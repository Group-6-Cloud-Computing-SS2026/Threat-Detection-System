"""
Notification repository — data-access layer for Notification model.
"""

from uuid import UUID

from sqlalchemy import desc, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification
from app.repositories.base import BaseRepository
from app.utils.enums import NotificationStatus


class NotificationRepository(BaseRepository[Notification]):
    def __init__(self, db: AsyncSession):
        super().__init__(Notification, db)

    async def get_pending(self) -> list[Notification]:
        stmt = select(Notification).where(Notification.status == NotificationStatus.PENDING)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def get_failed(self) -> list[Notification]:
        stmt = select(Notification).where(Notification.status == NotificationStatus.FAILED)
        result = await self.db.execute(stmt)
        return list(result.scalars().all())

    async def mark_read(self, notification_id: UUID) -> None:
        stmt = (
            update(Notification)
            .where(Notification.id == notification_id)
            .values(status=NotificationStatus.READ)
        )
        await self.db.execute(stmt)
        await self.db.flush()

    async def count_unread(self) -> int:
        stmt = (
            select(func.count())
            .select_from(Notification)
            .where(Notification.status != NotificationStatus.READ)
        )
        result = await self.db.execute(stmt)
        return result.scalar_one()

    async def get_filtered(
        self,
        status: str | None = None,
        notification_type: str | None = None,
        skip: int = 0,
        limit: int = 50,
    ) -> tuple[list[Notification], int]:
        stmt = select(Notification)
        count_stmt = select(func.count()).select_from(Notification)

        conditions = []
        if status:
            conditions.append(Notification.status == status)
        if notification_type:
            conditions.append(Notification.notification_type == notification_type)

        for cond in conditions:
            stmt = stmt.where(cond)
            count_stmt = count_stmt.where(cond)

        total = (await self.db.execute(count_stmt)).scalar_one()
        items = (
            await self.db.execute(
                stmt.order_by(desc(Notification.created_at)).offset(skip).limit(limit)
            )
        ).scalars().all()
        return list(items), total
