"""
SystemLog schemas — request and response representations.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class SystemLogCreate(BaseModel):
    """Payload for creating a manual log entry."""
    sensor_node_id: UUID | None = None
    level: str = Field("INFO", pattern="^(DEBUG|INFO|WARNING|ERROR|CRITICAL)$")
    source: str = Field(..., max_length=100)
    message: str
    context: dict | None = None


class SystemLogResponse(BaseModel):
    """System log entry."""
    id: UUID
    sensor_node_id: UUID | None
    level: str
    source: str
    message: str
    context: dict | None
    logged_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}
