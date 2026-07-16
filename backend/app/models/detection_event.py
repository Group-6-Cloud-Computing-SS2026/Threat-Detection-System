"""
DetectionEvent model.
"""

from datetime import datetime
from typing import TYPE_CHECKING
import uuid

from sqlalchemy import Boolean, DateTime, Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.detection_image import DetectionImage
    from app.models.notification import Notification
    from app.models.sensor_node import SensorNode


class DetectionEvent(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "detection_events"

    sensor_node_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sensor_nodes.id", ondelete="CASCADE"), nullable=False, index=True,
    )
    event_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    severity: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    confidence: Mapped[float] = mapped_column(Float, nullable=False)
    raw_detections: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSONB, nullable=True)
    acknowledged: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    acknowledged_by: Mapped[str | None] = mapped_column(String(150), nullable=True)
    detected_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    # Relationships
    sensor_node: Mapped["SensorNode"] = relationship(back_populates="detection_events")
    images: Mapped[list["DetectionImage"]] = relationship(
        back_populates="detection_event", cascade="all, delete-orphan",
    )
    notifications: Mapped[list["Notification"]] = relationship(
        back_populates="detection_event", cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<DetectionEvent {self.event_type} severity={self.severity} confidence={self.confidence:.2f}>"
