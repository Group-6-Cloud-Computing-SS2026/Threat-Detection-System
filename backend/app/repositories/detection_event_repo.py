"""
DetectionEvent repository — data-access layer for DetectionEvent model.
"""

from datetime import datetime
from uuid import UUID

from sqlalchemy import desc, func, select, update
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.detection_event import DetectionEvent
from app.repositories.base import BaseRepository


class DetectionEventRepository(BaseRepository[DetectionEvent]):
    def __init__(self, db: AsyncSession):
        super().__init__(DetectionEvent, db)

    async def get_by_id_with_sensor_node(self, event_id: UUID) -> DetectionEvent | None:
        """Fetch a single event with sensor_node eagerly loaded (avoids async lazy-load errors)."""
        stmt = (
            select(DetectionEvent)
            .options(selectinload(DetectionEvent.sensor_node))
            .where(DetectionEvent.id == event_id)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_sensor_id(self, sensor_id: UUID, skip: int = 0, limit: int = 50) -> list[DetectionEvent]:
        stmt = (
            select(DetectionEvent)
            .where(DetectionEvent.sensor_node_id == sensor_id)
            .order_by(desc(DetectionEvent.detected_at))
            .offset(skip).limit(limit)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_by_event_type(self, event_type: str, skip: int = 0, limit: int = 50) -> list[DetectionEvent]:
        stmt = (
            select(DetectionEvent)
            .where(DetectionEvent.event_type == event_type)
            .order_by(desc(DetectionEvent.detected_at))
            .offset(skip).limit(limit)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_by_severity(self, severity: str, skip: int = 0, limit: int = 50) -> list[DetectionEvent]:
        stmt = (
            select(DetectionEvent)
            .where(DetectionEvent.severity == severity)
            .order_by(desc(DetectionEvent.detected_at))
            .offset(skip).limit(limit)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_by_time_range(
        self, start: datetime, end: datetime, skip: int = 0, limit: int = 50,
    ) -> list[DetectionEvent]:
        stmt = (
            select(DetectionEvent)
            .where(DetectionEvent.detected_at.between(start, end))
            .order_by(desc(DetectionEvent.detected_at))
            .offset(skip).limit(limit)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_unacknowledged(self, skip: int = 0, limit: int = 50) -> list[DetectionEvent]:
        stmt = (
            select(DetectionEvent)
            .where(DetectionEvent.acknowledged.is_(False))
            .order_by(desc(DetectionEvent.detected_at))
            .offset(skip).limit(limit)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_recent(self, limit: int = 20) -> list[DetectionEvent]:
        stmt = (
            select(DetectionEvent)
            .order_by(desc(DetectionEvent.received_at))
            .limit(limit)
        )
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def acknowledge(self, event_id: UUID, username: str) -> None:
        stmt = (
            update(DetectionEvent)
            .where(DetectionEvent.id == event_id)
            .values(acknowledged=True, acknowledged_by=username)
        )
        await self.db.execute(stmt)
        await self.db.flush()

    async def count_by_type(self) -> dict[str, int]:
        stmt = (
            select(DetectionEvent.event_type, func.count())
            .group_by(DetectionEvent.event_type)
        )
        result = await self.db.execute(stmt)
        return dict(result.all())

    async def count_by_severity(self) -> dict[str, int]:
        stmt = (
            select(DetectionEvent.severity, func.count())
            .group_by(DetectionEvent.severity)
        )
        result = await self.db.execute(stmt)
        return dict(result.all())

    async def count_unacknowledged(self) -> int:
        stmt = select(func.count()).select_from(DetectionEvent).where(DetectionEvent.acknowledged.is_(False))
        result = await self.db.execute(stmt)
        return result.scalar_one()

    async def get_filtered(
        self,
        event_type: str | None = None,
        severity: str | None = None,
        sensor_id: UUID | None = None,
        acknowledged: bool | None = None,
        start_time: datetime | None = None,
        end_time: datetime | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> tuple[list[DetectionEvent], int]:
        """Get events with combined filters, returning (items, total_count)."""
        stmt = select(DetectionEvent)
        count_stmt = select(func.count()).select_from(DetectionEvent)

        conditions = []
        if event_type:
            conditions.append(DetectionEvent.event_type == event_type)
        if severity:
            conditions.append(DetectionEvent.severity == severity)
        if sensor_id:
            conditions.append(DetectionEvent.sensor_node_id == sensor_id)
        if acknowledged is not None:
            conditions.append(DetectionEvent.acknowledged == acknowledged)
        if start_time:
            conditions.append(DetectionEvent.detected_at >= start_time)
        if end_time:
            conditions.append(DetectionEvent.detected_at <= end_time)

        for cond in conditions:
            stmt = stmt.where(cond)
            count_stmt = count_stmt.where(cond)

        total = (await self.db.execute(count_stmt)).scalar_one()
        items = (
            await self.db.execute(
                stmt.order_by(desc(DetectionEvent.received_at)).offset(skip).limit(limit)
            )
        ).scalars().all()
        return list(items), total
