"""
SensorNode schemas — request and response representations.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class SensorNodeCreate(BaseModel):
    """Payload for registering a new sensor node."""
    name: str = Field(..., max_length=255)
    hostname: str = Field(..., max_length=255)
    ip_address: str = Field(..., max_length=45)
    latitude: float | None = None
    longitude: float | None = None
    location_label: str | None = Field(None, max_length=255)
    hw_model: str | None = Field(None, max_length=100)
    camera_model: str | None = Field(None, max_length=100)
    ai_model_name: str | None = Field(None, max_length=100)
    ai_model_version: str | None = Field(None, max_length=50)


class SensorNodeUpdate(BaseModel):
    """Payload for updating a sensor node (all fields optional)."""
    name: str | None = Field(None, max_length=255)
    hostname: str | None = Field(None, max_length=255)
    ip_address: str | None = Field(None, max_length=45)
    latitude: float | None = None
    longitude: float | None = None
    location_label: str | None = Field(None, max_length=255)
    hw_model: str | None = Field(None, max_length=100)
    camera_model: str | None = Field(None, max_length=100)
    ai_model_name: str | None = Field(None, max_length=100)
    ai_model_version: str | None = Field(None, max_length=50)
    status: str | None = Field(None, pattern="^(online|offline|maintenance)$")


class SensorNodeResponse(BaseModel):
    """Sensor node representation."""
    id: UUID
    name: str
    hostname: str
    ip_address: str
    latitude: float | None
    longitude: float | None
    location_label: str | None
    hw_model: str | None
    camera_model: str | None
    ai_model_name: str | None
    ai_model_version: str | None
    status: str
    last_heartbeat: datetime | None
    registered_at: datetime
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SensorNodeDetailResponse(SensorNodeResponse):
    """Extended node detail including latest health and recent events count."""
    latest_health: dict | None = None
    recent_events_count: int = 0
