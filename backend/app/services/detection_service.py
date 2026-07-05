"""
Detection service — business logic for detection event ingestion and querying.
"""

import base64
import logging
from datetime import datetime
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.repositories.detection_event_repo import DetectionEventRepository
from app.repositories.detection_image_repo import DetectionImageRepository
from app.schemas.detection_event import DetectionEventCreate
from app.services.image_storage_service import ImageStorageService
from app.utils.enums import ImageType, NotificationChannel, NotificationType, Severity
from app.utils.exceptions import NotFoundException
from app.utils.time_utils import utc_now

logger = logging.getLogger(__name__)


class DetectionService:
    def __init__(self, db: AsyncSession):
        self.event_repo = DetectionEventRepository(db)
        self.image_repo = DetectionImageRepository(db)
        self.image_storage = ImageStorageService()
        self.db = db

    async def _attach_preview_image_url(self, event):
        """Attach a presigned preview URL from the first stored image, if one exists."""
        preview_url = None
        try:
            images = await self.image_repo.get_by_event_id(event.id)
            if images:
                preview_url = self.image_storage.get_presigned_url(images[0].storage_key)
        except Exception:
            preview_url = None

        setattr(event, "preview_image_url", preview_url)
        return event

    async def _attach_preview_image_urls(self, events):
        for event in events:
            await self._attach_preview_image_url(event)
        return events

    async def ingest_detection(self, data: DetectionEventCreate):
        """Process an incoming detection: create event, store image, create notification."""
        now = utc_now()
        event = await self.event_repo.create({
            "sensor_node_id": data.sensor_node_id,
            "event_type": data.event_type,
            "severity": data.severity,
            "confidence": data.confidence,
            "raw_detections": data.raw_detections,
            "metadata_": data.metadata,
            "acknowledged": False,
            "detected_at": data.detected_at,
            "received_at": now,
            "created_at": now,
        })

        # Store image if provided
        if data.image_base64:
            try:
                image_bytes = base64.b64decode(data.image_base64)
                storage_key = f"detections/{event.id}/annotated.jpg"
                self.image_storage.upload_image_bytes(storage_key, image_bytes, "image/jpeg")

                image = await self.image_repo.create({
                    "detection_event_id": event.id,
                    "storage_key": storage_key,
                    "bucket": self.image_storage.bucket,
                    "content_type": "image/jpeg",
                    "file_size_bytes": len(image_bytes),
                    "image_type": ImageType.ANNOTATED,
                    "captured_at": data.detected_at,
                    "uploaded_at": now,
                })
                setattr(event, "preview_image_url", self.image_storage.get_presigned_url(image.storage_key))
            except Exception as img_exc:
                logger.warning("Image upload skipped for event %s: %s", event.id, img_exc)
        else:
            setattr(event, "preview_image_url", None)

        # Create notification for critical events
        if data.severity in (Severity.CRITICAL, Severity.HIGH):
            from app.services.notification_service import NotificationService
            notif_service = NotificationService(self.db)
            await notif_service.create_notification(
                detection_event_id=event.id,
                notification_type=NotificationType.THREAT_ALERT,
                message=f"⚠️ {data.severity.upper()} threat detected: {data.event_type} "
                        f"(confidence: {data.confidence:.0%})",
            )

        return event

    async def get_event_detail(self, event_id: UUID):
        """Get event with images."""
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise NotFoundException("DetectionEvent", event_id)
        images = await self.image_repo.get_by_event_id(event_id)
        await self._attach_preview_image_url(event)
        return event, images

    async def get_events_feed(
        self,
        event_type: str | None = None,
        severity: str | None = None,
        sensor_id: UUID | None = None,
        acknowledged: bool | None = None,
        start_time: datetime | None = None,
        end_time: datetime | None = None,
        skip: int = 0,
        limit: int = 50,
    ):
        events, total = await self.event_repo.get_filtered(
            event_type=event_type, severity=severity, sensor_id=sensor_id,
            acknowledged=acknowledged, start_time=start_time, end_time=end_time,
            skip=skip, limit=limit,
        )
        await self._attach_preview_image_urls(events)
        return events, total

    async def get_recent(self, limit: int = 20):
        events = await self.event_repo.get_recent(limit=limit)
        await self._attach_preview_image_urls(events)
        return events

    async def acknowledge_event(self, event_id: UUID, username: str):
        event = await self.event_repo.get_by_id(event_id)
        if not event:
            raise NotFoundException("DetectionEvent", event_id)
        await self.event_repo.acknowledge(event_id, username)
        event = await self.event_repo.get_by_id(event_id)
        return await self._attach_preview_image_url(event)

    async def get_statistics(self):
        by_type = await self.event_repo.count_by_type()
        by_severity = await self.event_repo.count_by_severity()
        unack = await self.event_repo.count_unacknowledged()
        total = await self.event_repo.count()
        return {
            "total_events": total,
            "by_type": by_type,
            "by_severity": by_severity,
            "unacknowledged_count": unack,
        }