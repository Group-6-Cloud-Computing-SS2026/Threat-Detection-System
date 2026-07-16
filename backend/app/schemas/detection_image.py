"""
DetectionImage schemas — response representations.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class DetectionImageResponse(BaseModel):
    """Detection image metadata."""
    id: UUID
    detection_event_id: UUID
    storage_key: str
    bucket: str
    content_type: str
    file_size_bytes: int | None
    image_type: str
    captured_at: datetime
    uploaded_at: datetime

    model_config = {"from_attributes": True}
