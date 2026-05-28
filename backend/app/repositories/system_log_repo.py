"""
SystemLog repository — data-access layer for SystemLog model.
"""

from datetime import datetime
from uuid import UUID

from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.system_log import SystemLog
from app.repositories.base import BaseRepository


class SystemLogRepository(BaseRepository[SystemLog]):
    def __init__(self, db: AsyncSession):
        super().__init__(SystemLog, db)

    async def get_by_level(self, level: str, skip: int = 0, limit: int = 50) -> list[SystemLog]:
        stmt = (
            select(SystemLog).where(SystemLog.level == level)
            .order_by(desc(SystemLog.logged_at)).offset(skip).limit(limit)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_by_source(self, source: str, skip: int = 0, limit: int = 50) -> list[SystemLog]:
        stmt = (
            select(SystemLog).where(SystemLog.source == source)
            .order_by(desc(SystemLog.logged_at)).offset(skip).limit(limit)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_by_sensor_id(self, sensor_id: UUID, skip: int = 0, limit: int = 50) -> list[SystemLog]:
        stmt = (
            select(SystemLog).where(SystemLog.sensor_node_id == sensor_id)
            .order_by(desc(SystemLog.logged_at)).offset(skip).limit(limit)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_by_time_range(
        self, start: datetime, end: datetime, skip: int = 0, limit: int = 50,
    ) -> list[SystemLog]:
        stmt = (
            select(SystemLog)
            .where(SystemLog.logged_at.between(start, end))
            .order_by(desc(SystemLog.logged_at)).offset(skip).limit(limit)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def search(self, query: str, skip: int = 0, limit: int = 50) -> tuple[list[SystemLog], int]:
        pattern = f"%{query}%"
        condition = SystemLog.message.ilike(pattern)
        count_stmt = select(func.count()).select_from(SystemLog).where(condition)
        total = (await self.db.execute(count_stmt)).scalar_one()
        stmt = (
            select(SystemLog).where(condition)
            .order_by(desc(SystemLog.logged_at)).offset(skip).limit(limit)
        )
        items = (await self.db.execute(stmt)).scalars().all()
        return list(items), total

    async def get_filtered(
        self,
        level: str | None = None,
        source: str | None = None,
        sensor_id: UUID | None = None,
        start_time: datetime | None = None,
        end_time: datetime | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> tuple[list[SystemLog], int]:
        stmt = select(SystemLog)
        count_stmt = select(func.count()).select_from(SystemLog)

        conditions = []
        if level:
            conditions.append(SystemLog.level == level)
        if source:
            conditions.append(SystemLog.source == source)
        if sensor_id:
            conditions.append(SystemLog.sensor_node_id == sensor_id)
        if start_time:
            conditions.append(SystemLog.logged_at >= start_time)
        if end_time:
            conditions.append(SystemLog.logged_at <= end_time)

        for cond in conditions:
            stmt = stmt.where(cond)
            count_stmt = count_stmt.where(cond)

        total = (await self.db.execute(count_stmt)).scalar_one()
        items = (
            await self.db.execute(
                stmt.order_by(desc(SystemLog.logged_at)).offset(skip).limit(limit)
            )
        ).scalars().all()
        return list(items), total
