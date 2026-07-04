"""
SensorNode repository — data-access layer for SensorNode model.
"""

from datetime import datetime

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.sensor_node import SensorNode
from app.repositories.base import BaseRepository
from app.utils.enums import NodeStatus


class SensorNodeRepository(BaseRepository[SensorNode]):
    def __init__(self, db: AsyncSession):
        super().__init__(SensorNode, db)

    async def get_by_hostname(self, hostname: str) -> SensorNode | None:
        stmt = select(SensorNode).where(SensorNode.hostname == hostname)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_name(self, name: str) -> SensorNode | None:
        stmt = select(SensorNode).where(SensorNode.name == name)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_ip(self, ip_address: str) -> SensorNode | None:
        stmt = select(SensorNode).where(SensorNode.ip_address == ip_address)
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_online_nodes(self) -> list[SensorNode]:
        stmt = select(SensorNode).where(SensorNode.status == NodeStatus.ONLINE)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_all_with_status(self) -> list[SensorNode]:
        """Get all nodes ordered by status (online first) then name."""
        stmt = select(SensorNode).order_by(SensorNode.status, SensorNode.name)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def update_heartbeat(self, node_id, heartbeat_time: datetime) -> None:
        stmt = (
            update(SensorNode)
            .where(SensorNode.id == node_id)
            .values(last_heartbeat=heartbeat_time, status=NodeStatus.ONLINE)
        )
        await self.db.execute(stmt)
        await self.db.flush()

    async def mark_offline(self, node_id) -> None:
        stmt = (
            update(SensorNode)
            .where(SensorNode.id == node_id)
            .values(status=NodeStatus.OFFLINE)
        )
        await self.db.execute(stmt)
        await self.db.flush()
