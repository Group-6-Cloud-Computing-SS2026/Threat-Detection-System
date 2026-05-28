"""
Notification service — creates and manages notifications for the frontend.
"""

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.notification_repo import NotificationRepository
from app.utils.enums import NotificationChannel, NotificationStatus, NotificationType
from app.utils.time_utils import utc_now


class NotificationService:
    def __init__(self, db: AsyncSession):
        self.repo = NotificationRepository(db)

    async def create_notification(
        self,
        notification_type: str = NotificationType.THREAT_ALERT,
        message: str = "",
        detection_event_id: UUID | None = None,
        channel: str = NotificationChannel.WEBHOOK,
    ):
        """Create a notification record for the frontend notification center."""
        now = utc_now()
        return await self.repo.create({
            "detection_event_id": detection_event_id,
            "channel": channel,
            "notification_type": notification_type,
            "status": NotificationStatus.PENDING,
            "message_body": message,
            "response_data": None,
            "retry_count": 0,
            "sent_at": None,
            "created_at": now,
        })

    async def get_notifications(
        self,
        status: str | None = None,
        notification_type: str | None = None,
        skip: int = 0,
        limit: int = 50,
    ):
        return await self.repo.get_filtered(
            status=status, notification_type=notification_type,
            skip=skip, limit=limit,
        )

    async def mark_read(self, notification_id: UUID):
        await self.repo.mark_read(notification_id)
        return await self.repo.get_by_id(notification_id)

    async def count_unread(self) -> int:
        return await self.repo.count_unread()
