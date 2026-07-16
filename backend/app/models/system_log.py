"""
SystemLog model — application and sensor log entries.
"""

from datetime import datetime
from typing import TYPE_CHECKING
import uuid

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.models.base import Base, UUIDPrimaryKeyMixin

if TYPE_CHECKING:
    from app.models.sensor_node import SensorNode


class SystemLog(Base, UUIDPrimaryKeyMixin):
    __tablename__ = "system_logs"

    sensor_node_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sensor_nodes.id", ondelete="SET NULL"), nullable=True, index=True,
    )
    level: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    source: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    context: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    logged_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    # Relationships
    sensor_node: Mapped["SensorNode | None"] = relationship(back_populates="system_logs")

    def __repr__(self) -> str:
        return f"<SystemLog [{self.level}] {self.source}: {self.message[:60]}>"
