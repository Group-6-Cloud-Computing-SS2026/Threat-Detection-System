"""Pydantic models for request/response validation."""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class ThreatLevel(str, Enum):
    """Threat severity levels."""
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


class ThreatDetectionRequest(BaseModel):
    """Request model for threat detection."""
    sensor_id: str = Field(..., description="Unique sensor identifier")
    object_type: str = Field(..., description="Type of object detected (e.g., person, weapon)")
    confidence: float = Field(..., ge=0, le=1, description="Detection confidence (0-1)")
    location: Optional[str] = Field(None, description="Location metadata")
    image_url: Optional[str] = Field(None, description="URL to threat image")
    timestamp: Optional[datetime] = Field(default_factory=datetime.utcnow)


class ThreatDetailResponse(BaseModel):
    """Response model for threat details."""
    threat_id: str
    sensor_id: str
    object_type: str
    confidence: float
    threat_level: ThreatLevel
    location: Optional[str]
    image_url: Optional[str]
    timestamp: datetime
    acknowledged: bool = False
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    resolved: bool = False
    resolved_at: Optional[datetime] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True


class ThreatsListResponse(BaseModel):
    """Response model for threats list."""
    total: int
    threats: List[ThreatDetailResponse]
    filters: Optional[dict] = None


class SensorHeartbeatRequest(BaseModel):
    """Request model for sensor heartbeat."""
    sensor_id: str = Field(..., description="Unique sensor identifier")
    status: str = Field(default="active", description="Sensor status")
    temperature: Optional[float] = Field(None, description="CPU temperature in Celsius")
    memory_usage: Optional[float] = Field(None, ge=0, le=100, description="Memory usage percentage")
    cpu_usage: Optional[float] = Field(None, ge=0, le=100, description="CPU usage percentage")
    timestamp: Optional[datetime] = Field(default_factory=datetime.utcnow)


class SensorInfo(BaseModel):
    """Response model for sensor information."""
    sensor_id: str
    status: str
    last_heartbeat: datetime
    temperature: Optional[float]
    memory_usage: Optional[float]
    cpu_usage: Optional[float]
    threats_detected: int = 0


class HealthStatus(BaseModel):
    """Response model for health status."""
    status: str
    timestamp: datetime
    uptime_seconds: float
    environment: str
    version: str
    storage_available: bool
    telegram_available: bool


class SystemStatistics(BaseModel):
    """Response model for system statistics."""
    total_threats_detected: int
    critical_threats: int
    high_threats: int
    medium_threats: int
    low_threats: int
    active_sensors: int
    storage_used_mb: float
    uptime_seconds: float
    threats_resolved: int
    threats_pending: int


class ThreatAcknowledgeRequest(BaseModel):
    """Request model for acknowledging a threat."""
    acknowledged_by: str = Field(..., description="User who acknowledged")
    notes: Optional[str] = Field(None, description="Additional notes")


class ThreatResolveRequest(BaseModel):
    """Request model for resolving a threat."""
    resolved_by: str = Field(..., description="User who resolved")
    notes: Optional[str] = Field(None, description="Resolution notes")
