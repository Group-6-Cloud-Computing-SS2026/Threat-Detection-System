"""
DetectionEvent schemas — request and response representations.
"""

from datetime import datetime
from uuid import UUID

from pydantic import AliasChoices, BaseModel, Field

from app.utils.enums import EventType

from app.utils.enums import EventType


class DetectionEventCreate(BaseModel):
    """Payload for ingesting a detection event (REST fallback)."""
    sensor_node_id: UUID
    event_type: EventType
    severity: str = Field("medium", pattern="^(low|medium|high|critical)$")
    confidence: float = Field(..., ge=0.0, le=1.0)
    raw_detections: dict | None = None
    metadata: dict | None = None
    detected_at: datetime
    image_base64: str | None = None


class DetectionEventResponse(BaseModel):
    """Detection event representation."""
    id: UUID
    sensor_node_id: UUID
    event_type: str
    severity: str
    confidence: float
    raw_detections: dict | None
    metadata: dict | None = Field(None, validation_alias=AliasChoices("metadata_", "metadata"))
    acknowledged: bool
    acknowledged_by: str | None
    detected_at: datetime
    received_at: datetime
    created_at: datetime
    preview_image_url: str | None = None

    model_config = {"from_attributes": True, "populate_by_name": True}


class DetectionEventDetailResponse(DetectionEventResponse):
    """Extended detail with images and sensor info."""
    sensor_name: str | None = None
    sensor_location: str | None = None
    images: list[dict] = []


class DetectionStatisticsResponse(BaseModel):
    """Aggregated detection statistics."""
    total_events: int = 0
    by_type: dict[str, int] = {}
    by_severity: dict[str, int] = {}
    by_sensor: dict[str, int] = {}
    unacknowledged_count: int = 0
