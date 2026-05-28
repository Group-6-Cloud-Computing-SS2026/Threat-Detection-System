"""
HealthStatus schemas — request and response representations.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class HealthStatusCreate(BaseModel):
    """Payload from a sensor node heartbeat."""
    cpu_usage_percent: float | None = Field(None, ge=0, le=100)
    memory_usage_percent: float | None = Field(None, ge=0, le=100)
    disk_usage_percent: float | None = Field(None, ge=0, le=100)
    cpu_temperature_celsius: float | None = None
    gpu_temperature_celsius: float | None = None
    uptime_seconds: int | None = Field(None, ge=0)
    network_status: str | None = Field(None, pattern="^(connected|degraded|disconnected)$")
    inference_fps: float | None = Field(None, ge=0)
    extra_metrics: dict | None = None


class HealthStatusResponse(BaseModel):
    """Health status snapshot."""
    id: UUID
    sensor_node_id: UUID
    cpu_usage_percent: float | None
    memory_usage_percent: float | None
    disk_usage_percent: float | None
    cpu_temperature_celsius: float | None
    gpu_temperature_celsius: float | None
    uptime_seconds: int | None
    network_status: str | None
    inference_fps: float | None
    extra_metrics: dict | None
    reported_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


class ClusterHealthResponse(BaseModel):
    """Aggregated cluster health overview."""
    total_nodes: int = 0
    online_nodes: int = 0
    offline_nodes: int = 0
    maintenance_nodes: int = 0
    avg_cpu_usage: float | None = None
    avg_memory_usage: float | None = None
    avg_temperature: float | None = None
    nodes: list[dict] = []
