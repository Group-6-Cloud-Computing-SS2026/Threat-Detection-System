"""
Time Utilities
"""

from datetime import datetime, timezone


def utc_now() -> datetime:
    """Return the current time in UTC (timezone-aware)."""
    return datetime.now(timezone.utc)
