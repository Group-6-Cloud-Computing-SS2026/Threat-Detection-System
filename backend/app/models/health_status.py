"""
HealthStatus model.
"""

from datetime import datetime
from typing import TYPE_CHECKING
import uuid

from sqlalchemy import DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.sensor_node import SensorNode


class HealthStatus(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "health_statuses"

    sensor_node_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sensor_nodes.id", ondelete="CASCADE"), nullable=False, index=True,
    )
    cpu_usage_percent: Mapped[float | None] = mapped_column(Float, nullable=True)
    memory_usage_percent: Mapped[float | None] = mapped_column(Float, nullable=True)
    disk_usage_percent: Mapped[float | None] = mapped_column(Float, nullable=True)
    cpu_temperature_celsius: Mapped[float | None] = mapped_column(Float, nullable=True)
    gpu_temperature_celsius: Mapped[float | None] = mapped_column(Float, nullable=True)
    uptime_seconds: Mapped[int | None] = mapped_column(Integer, nullable=True)
    network_status: Mapped[str | None] = mapped_column(String(20), nullable=True)
    inference_fps: Mapped[float | None] = mapped_column(Float, nullable=True)
    extra_metrics: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    reported_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    # Relationships
    sensor_node: Mapped["SensorNode"] = relationship(back_populates="health_statuses")

    def __repr__(self) -> str:
        return f"<HealthStatus node={self.sensor_node_id} cpu={self.cpu_usage_percent}%>"
