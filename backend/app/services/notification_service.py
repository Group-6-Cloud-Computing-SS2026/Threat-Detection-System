"""
Notification service — creates and manages notifications for the frontend.
"""

import logging
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.repositories.notification_repo import NotificationRepository
from app.utils.enums import NotificationChannel, NotificationStatus, NotificationType
from app.utils.time_utils import utc_now

logger = logging.getLogger(__name__)


class NotificationService:
    def __init__(self, db: AsyncSession):
        self.repo = NotificationRepository(db)

    async def send_telegram_alert(self, message: str, detection_event_id: UUID | None):
        """Send a real-time photo or text alert to Telegram."""
        if not settings.TELEGRAM_BOT_TOKEN or not settings.TELEGRAM_CHAT_ID:
            return

        import httpx
        from app.services.image_storage_service import ImageStorageService
        from app.repositories.detection_image_repo import DetectionImageRepository

        image_bytes = None
        if detection_event_id:
            try:
                image_repo = DetectionImageRepository(self.repo.db)
                images = await image_repo.get_by_event_id(detection_event_id)
                if images:
                    storage = ImageStorageService()
                    # Read the raw JPEG bytes from MinIO
                    image_bytes = storage.get_object_bytes(images[0].storage_key)
            except Exception as e:
                logger.warning("Failed to fetch image for Telegram alert: %s", e)

        try:
            url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/"
            async with httpx.AsyncClient() as client:
                if image_bytes:
                    files = {"photo": ("annotated.jpg", image_bytes, "image/jpeg")}
                    data = {"chat_id": settings.TELEGRAM_CHAT_ID, "caption": message}
                    res = await client.post(url + "sendPhoto", data=data, files=files, timeout=10.0)
                else:
                    payload = {"chat_id": settings.TELEGRAM_CHAT_ID, "text": message}
                    res = await client.post(url + "sendMessage", json=payload, timeout=10.0)
                
                if res.status_code != 200:
                    logger.warning("Telegram API returned error status %d: %s", res.status_code, res.text)
                else:
                    logger.info("Telegram threat alert delivered successfully")
        except Exception as e:
            logger.error("Failed to deliver Telegram notification: %s", e)

    async def create_notification(
        self,
        notification_type: str = NotificationType.THREAT_ALERT,
        message: str = "",
        detection_event_id: UUID | None = None,
        channel: str = NotificationChannel.WEBHOOK,
    ):
        """Create a notification record for the frontend notification center."""
        now = utc_now()
        notification = await self.repo.create({
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

        # Also deliver Telegram alert in the background if configured
        if notification_type == NotificationType.THREAT_ALERT:
            import asyncio
            asyncio.create_task(self.send_telegram_alert(message, detection_event_id))

        return notification

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
