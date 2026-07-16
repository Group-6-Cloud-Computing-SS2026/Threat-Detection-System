"""
SensorNode model — registered edge-computing sensor nodes.
"""

from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, Float, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.utils.enums import NodeStatus

if TYPE_CHECKING:
    from app.models.detection_event import DetectionEvent
    from app.models.health_status import HealthStatus
    from app.models.system_log import SystemLog


class SensorNode(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "sensor_nodes"

    name: Mapped[str] = mapped_column(String(255), nullable=False)
    hostname: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    ip_address: Mapped[str] = mapped_column(String(45), nullable=False)
    latitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    longitude: Mapped[float | None] = mapped_column(Float, nullable=True)
    location_label: Mapped[str | None] = mapped_column(String(255), nullable=True)
    hw_model: Mapped[str | None] = mapped_column(String(100), nullable=True)
    camera_model: Mapped[str | None] = mapped_column(String(100), nullable=True)
    ai_model_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    ai_model_version: Mapped[str | None] = mapped_column(String(50), nullable=True)
    status: Mapped[str] = mapped_column(String(20), default=NodeStatus.OFFLINE, nullable=False, index=True)
    last_heartbeat: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    registered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    # Relationships
    detection_events: Mapped[list["DetectionEvent"]] = relationship(
        back_populates="sensor_node", cascade="all, delete-orphan",
    )
    health_statuses: Mapped[list["HealthStatus"]] = relationship(
        back_populates="sensor_node", cascade="all, delete-orphan",
    )
    system_logs: Mapped[list["SystemLog"]] = relationship(
        back_populates="sensor_node", cascade="all, delete-orphan",
    )

    def __repr__(self) -> str:
        return f"<SensorNode {self.name} ({self.status})>"
