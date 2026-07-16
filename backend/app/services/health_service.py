"""
Health service — sensor node health monitoring and cluster overview.
"""

from datetime import datetime, timedelta
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.health_status_repo import HealthStatusRepository
from app.repositories.sensor_node_repo import SensorNodeRepository
from app.schemas.health_status import HealthStatusCreate
from app.services.image_storage_service import ImageStorageService
from app.utils.enums import NodeStatus
from app.utils.time_utils import utc_now

import logging

logger = logging.getLogger(__name__)


class HealthService:
    def __init__(self, db: AsyncSession):
        self.health_repo = HealthStatusRepository(db)
        self.node_repo = SensorNodeRepository(db)
        self.db = db

    async def record_health(self, sensor_id: UUID, data: HealthStatusCreate):
        """Store a health snapshot and update node heartbeat."""
        now = utc_now()

        status = await self.health_repo.create({
            "sensor_node_id": sensor_id,
            **data.model_dump(),
            "reported_at": now,
            "created_at": now,
        })

        # Update node heartbeat + status
        await self.node_repo.update_heartbeat(sensor_id, now)

        # Check thresholds
        if data.cpu_usage_percent and data.cpu_usage_percent > 90:
            logger.warning("Node %s CPU usage critical: %.1f%%", sensor_id, data.cpu_usage_percent)
        if data.cpu_temperature_celsius and data.cpu_temperature_celsius > 80:
            logger.warning("Node %s temperature critical: %.1f°C", sensor_id, data.cpu_temperature_celsius)

        return status

    async def get_cluster_overview(self) -> dict:
        """Aggregated health of all nodes for the dashboard."""
        nodes = await self.node_repo.get_all_with_status()
        latest_statuses = await self.health_repo.get_latest_all_sensors()

        status_map = {str(s.sensor_node_id): s for s in latest_statuses}

        online = sum(1 for n in nodes if n.status == NodeStatus.ONLINE)
        offline = sum(1 for n in nodes if n.status == NodeStatus.OFFLINE)
        maintenance = sum(1 for n in nodes if n.status == NodeStatus.MAINTENANCE)

        cpu_values = [s.cpu_usage_percent for s in latest_statuses if s.cpu_usage_percent is not None]
        mem_values = [s.memory_usage_percent for s in latest_statuses if s.memory_usage_percent is not None]
        temp_values = [s.cpu_temperature_celsius for s in latest_statuses if s.cpu_temperature_celsius is not None]

        node_details = []
        for n in nodes:
            health = status_map.get(str(n.id))
            node_details.append({
                "id": str(n.id),
                "name": n.name,
                "status": n.status,
                "ip_address": n.ip_address,
                "last_heartbeat": n.last_heartbeat.isoformat() if n.last_heartbeat else None,
                "health": {
                    "cpu": health.cpu_usage_percent if health else None,
                    "memory": health.memory_usage_percent if health else None,
                    "disk": health.disk_usage_percent if health else None,
                    "temp": health.cpu_temperature_celsius if health else None,
                    "fps": health.inference_fps if health else None,
                } if health else None,
            })

        return {
            "total_nodes": len(nodes),
            "online_nodes": online,
            "offline_nodes": offline,
            "maintenance_nodes": maintenance,
            "avg_cpu_usage": sum(cpu_values) / len(cpu_values) if cpu_values else None,
            "avg_memory_usage": sum(mem_values) / len(mem_values) if mem_values else None,
            "avg_temperature": sum(temp_values) / len(temp_values) if temp_values else None,
            "nodes": node_details,
        }

    async def get_node_health_history(self, sensor_id: UUID, hours: int = 24):
        """Get health history for a specific node."""
        end = utc_now()
        start = end - timedelta(hours=hours)
        return await self.health_repo.get_history(sensor_id, start, end)

    async def get_latest_for_node(self, sensor_id: UUID):
        return await self.health_repo.get_latest_by_sensor(sensor_id)

    async def check_stale_nodes(self, timeout_minutes: int = 5) -> list:
        """Find and mark nodes that haven't sent a heartbeat recently."""
        cutoff = utc_now() - timedelta(minutes=timeout_minutes)
        nodes = await self.node_repo.get_all_with_status()
        stale = []

        for node in nodes:
            if node.status == NodeStatus.ONLINE:
                if node.last_heartbeat is None or node.last_heartbeat < cutoff:
                    await self.node_repo.mark_offline(node.id)
                    stale.append(node)
                    logger.warning("Node '%s' marked offline (no heartbeat since %s)", node.name, node.last_heartbeat)

        return stale

    async def get_infrastructure_status(self) -> dict:
        """Full infrastructure status for the frontend status page."""
        from app.config import settings

        # Check services
        db_status = "connected"
        try:
            from sqlalchemy import text
            await self.db.execute(text("SELECT 1"))
        except Exception:
            db_status = "disconnected"

        minio_service = ImageStorageService()
        minio_connected = minio_service.check_connection()
        minio_stats = minio_service.get_storage_stats() if minio_connected else {}

        # Node statuses
        cluster = await self.get_cluster_overview()

        # Determine overall status
        overall = "healthy"
        if db_status != "connected" or not minio_connected:
            overall = "critical"
        elif cluster["offline_nodes"] > 0:
            overall = "degraded"

        return {
            "overall_status": overall,
            "api": {"status": "up", "version": "0.1.0"},
            "database": {"status": db_status},
            "minio": {
                "status": "connected" if minio_connected else "disconnected",
                "endpoint": settings.MINIO_ENDPOINT,
                **minio_stats,
            },
            "mqtt": {
                "status": "unknown",  # Updated at runtime by MQTT service
                "broker_host": settings.MQTT_BROKER_HOST,
                "broker_port": settings.MQTT_BROKER_PORT,
            },
            "nodes_summary": {
                "total": cluster["total_nodes"],
                "online": cluster["online_nodes"],
                "offline": cluster["offline_nodes"],
                "maintenance": cluster["maintenance_nodes"],
            },
            "nodes": cluster["nodes"],
        }
