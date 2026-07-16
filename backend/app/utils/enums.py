"""
Threat Detection System — Enum Definitions

Centralised enums used across models, schemas, and services.
"""

from enum import Enum


class NodeStatus(str, Enum):
    """Sensor node operational status."""
    ONLINE = "online"
    OFFLINE = "offline"
    MAINTENANCE = "maintenance"


class EventType(str, Enum):
    """Detection event categories."""
    PERSON = "person"
    THEFT = "theft"
    FIRE = "fire"
    VANDALISM = "vandalism"
    WEAPON = "weapon"
    UNKNOWN = "unknown"


class Severity(str, Enum):
    """Detection event severity levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class LogLevel(str, Enum):
    """System log severity levels."""
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARNING = "WARNING"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


class NetworkStatus(str, Enum):
    """Network connectivity status."""
    CONNECTED = "connected"
    DEGRADED = "degraded"
    DISCONNECTED = "disconnected"


class ImageType(str, Enum):
    """Detection image variants."""
    ANNOTATED = "annotated"
    RAW = "raw"
    THUMBNAIL = "thumbnail"


class NotificationChannel(str, Enum):
    """Notification delivery channels."""
    WEBHOOK = "webhook"
    EMAIL = "email"


class NotificationType(str, Enum):
    """Notification categories."""
    THREAT_ALERT = "threat_alert"
    HEALTH_ALERT = "health_alert"
    SYSTEM_ALERT = "system_alert"


class NotificationStatus(str, Enum):
    """Notification delivery status."""
    PENDING = "pending"
    SENT = "sent"
    FAILED = "failed"
    READ = "read"


class UserRole(str, Enum):
    """User authorization roles."""
    ADMIN = "admin"
    OPERATOR = "operator"
    VIEWER = "viewer"
