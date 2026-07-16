"""
Threat Detection System — SQLAlchemy Model Base
"""

import uuid
from datetime import datetime

from sqlalchemy import DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from app.utils.time_utils import utc_now


class Base(DeclarativeBase):
    """Shared declarative base for all models."""
    pass


class TimestampMixin:
    """Adds ``created_at`` and ``updated_at`` columns."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        nullable=False,
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=utc_now,
        onupdate=utc_now,
        nullable=False,
    )


class UUIDPrimaryKeyMixin:
    """Provides a UUID primary key column."""

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
