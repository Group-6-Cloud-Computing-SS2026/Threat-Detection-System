"""
Infrastructure router — comprehensive system status for the frontend status page.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database import get_db
from app.models.user import User
from app.services.health_service import HealthService
from app.services.image_storage_service import ImageStorageService

router = APIRouter(prefix="/infrastructure", tags=["Infrastructure"])


@router.get("/status")
async def full_infrastructure_status(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Full system status: API, DB, MinIO, MQTT, all sensor nodes."""
    service = HealthService(db)
    return await service.get_infrastructure_status()


@router.get("/services")
async def service_statuses(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Status of backend services (PostgreSQL, MinIO, MQTT broker)."""
    from sqlalchemy import text
    from app.config import settings

    services = []

    # PostgreSQL
    try:
        await db.execute(text("SELECT 1"))
        services.append({"name": "PostgreSQL", "status": "connected", "host": settings.POSTGRES_HOST})
    except Exception:
        services.append({"name": "PostgreSQL", "status": "disconnected", "host": settings.POSTGRES_HOST})

    # MinIO
    storage = ImageStorageService()
    minio_ok = storage.check_connection()
    services.append({
        "name": "MinIO",
        "status": "connected" if minio_ok else "disconnected",
        "endpoint": settings.MINIO_ENDPOINT,
    })

    # MQTT
    from app.services.mqtt_service import mqtt_connected
    services.append({
        "name": "MQTT Broker",
        "status": "connected" if mqtt_connected else "disconnected",
        "host": settings.MQTT_BROKER_HOST,
        "port": settings.MQTT_BROKER_PORT,
    })

    return services


@router.get("/nodes")
async def infrastructure_nodes(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """All nodes with status, last heartbeat, and health snapshot."""
    service = HealthService(db)
    overview = await service.get_cluster_overview()
    return overview["nodes"]


@router.get("/storage")
async def storage_status(
    _: User = Depends(get_current_user),
):
    """MinIO cluster storage stats (total/used/free across Pi 3s)."""
    storage = ImageStorageService()
    if not storage.check_connection():
        return {"status": "disconnected", "error": "Cannot reach MinIO cluster"}

    stats = storage.get_storage_stats()
    return {
        "status": "connected",
        **stats,
    }
