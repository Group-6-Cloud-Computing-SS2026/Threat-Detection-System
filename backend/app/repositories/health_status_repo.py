"""
HealthStatus repository — data-access layer for HealthStatus model.
"""

from datetime import datetime
from uuid import UUID

from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.health_status import HealthStatus
from app.repositories.base import BaseRepository


class HealthStatusRepository(BaseRepository[HealthStatus]):
    def __init__(self, db: AsyncSession):
        super().__init__(HealthStatus, db)

    async def get_latest_by_sensor(self, sensor_id: UUID) -> HealthStatus | None:
        stmt = (
            select(HealthStatus)
            .where(HealthStatus.sensor_node_id == sensor_id)
            .order_by(desc(HealthStatus.reported_at))
            .limit(1)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_latest_all_sensors(self) -> list[HealthStatus]:
        """Get the most recent health status for each sensor node."""
        subq = (
            select(
                HealthStatus.sensor_node_id,
                HealthStatus.reported_at,
            )
            .distinct(HealthStatus.sensor_node_id)
            .order_by(HealthStatus.sensor_node_id, desc(HealthStatus.reported_at))
            .subquery()
        )
        stmt = (
            select(HealthStatus)
            .join(
                subq,
                (HealthStatus.sensor_node_id == subq.c.sensor_node_id)
                & (HealthStatus.reported_at == subq.c.reported_at),
            )
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_history(
        self, sensor_id: UUID, start: datetime, end: datetime, limit: int = 500,
    ) -> list[HealthStatus]:
        stmt = (
            select(HealthStatus)
            .where(
                HealthStatus.sensor_node_id == sensor_id,
                HealthStatus.reported_at.between(start, end),
            )
            .order_by(HealthStatus.reported_at)
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())
