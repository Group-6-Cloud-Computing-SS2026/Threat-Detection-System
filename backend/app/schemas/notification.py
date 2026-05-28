"""
Notification schemas — response representations.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class NotificationResponse(BaseModel):
    """Notification entry."""
    id: UUID
    detection_event_id: UUID | None
    channel: str
    notification_type: str
    status: str
    message_body: str
    response_data: dict | None
    retry_count: int
    sent_at: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}
