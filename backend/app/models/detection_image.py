"""
DetectionImage model.
"""

from datetime import datetime
from typing import TYPE_CHECKING
import uuid

from sqlalchemy import DateTime, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.detection_event import DetectionEvent


class DetectionImage(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "detection_images"

    detection_event_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("detection_events.id", ondelete="CASCADE"), nullable=False, index=True,
    )
    storage_key: Mapped[str] = mapped_column(String(512), nullable=False, unique=True)
    bucket: Mapped[str] = mapped_column(String(100), nullable=False)
    content_type: Mapped[str] = mapped_column(String(50), default="image/jpeg", nullable=False)
    file_size_bytes: Mapped[int | None] = mapped_column(Integer, nullable=True)
    image_type: Mapped[str] = mapped_column(String(20), nullable=False)
    captured_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    # Relationships
    detection_event: Mapped["DetectionEvent"] = relationship(back_populates="images")

    def __repr__(self) -> str:
        return f"<DetectionImage {self.image_type} key={self.storage_key}>"
