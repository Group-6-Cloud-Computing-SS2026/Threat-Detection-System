"""Main FastAPI application for Threat Detection System (Task 7 & 9)."""

import logging
from datetime import datetime
from typing import Optional, List
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, status, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.models import (
    ThreatDetectionRequest, ThreatDetailResponse, ThreatsListResponse,
    SensorHeartbeatRequest, SensorInfo, HealthStatus, SystemStatistics,
    ThreatAcknowledgeRequest, ThreatResolveRequest, ThreatLevel
)
from app.threat_detector import detector
from app.notifications import notifier
from app.storage import storage

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# In-memory storage for demo (replace with database in production)
threats_db: dict = {}
sensors_db: dict = {}
start_time = datetime.utcnow()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle management."""
    logger.info("\n" + "="*50)
    logger.info("Threat Detection Backend Starting")
    logger.info(f"Environment: {settings.app_env}")
    logger.info(f"Storage enabled: {settings.storage_enabled}")
    logger.info(f"Telegram enabled: {settings.telegram_enabled}")
    logger.info("="*50)
    yield
    logger.info("Shutting down Threat Detection Backend")


app = FastAPI(
    title=settings.app_name,
    description="Real-time threat detection system for edge computing",
    version=settings.version,
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ==================== Health & Info Endpoints ====================

@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": settings.app_name,
        "version": settings.version,
        "status": "running",
        "docs_url": "/docs",
        "environment": settings.app_env
    }


@app.get("/health", response_model=HealthStatus)
async def health_check():
    """Health check endpoint for Kubernetes probes."""
    uptime = (datetime.utcnow() - start_time).total_seconds()
    
    return HealthStatus(
        status="healthy",
        timestamp=datetime.utcnow(),
        uptime_seconds=uptime,
        environment=settings.app_env,
        version=settings.version,
        storage_available=settings.storage_enabled,
        telegram_available=settings.telegram_enabled
    )


@app.get("/status")
async def status():
    """Get system status."""
    return {
        "status": "operational",
        "threats_count": len(threats_db),
        "sensors_count": len(sensors_db),
        "uptime_seconds": (datetime.utcnow() - start_time).total_seconds()
    }


@app.get("/statistics", response_model=SystemStatistics)
async def get_statistics():
    """Get comprehensive system statistics."""
    critical = sum(1 for t in threats_db.values() if t.get("threat_level") == ThreatLevel.CRITICAL)
    high = sum(1 for t in threats_db.values() if t.get("threat_level") == ThreatLevel.HIGH)
    medium = sum(1 for t in threats_db.values() if t.get("threat_level") == ThreatLevel.MEDIUM)
    low = sum(1 for t in threats_db.values() if t.get("threat_level") == ThreatLevel.LOW)
    resolved = sum(1 for t in threats_db.values() if t.get("resolved"))
    pending = len(threats_db) - resolved
    
    storage_stats = storage.get_storage_stats()
    uptime = (datetime.utcnow() - start_time).total_seconds()
    
    return SystemStatistics(
        total_threats_detected=len(threats_db),
        critical_threats=critical,
        high_threats=high,
        medium_threats=medium,
        low_threats=low,
        active_sensors=len(sensors_db),
        storage_used_mb=storage_stats.get("storage_used_mb", 0),
        uptime_seconds=uptime,
        threats_resolved=resolved,
        threats_pending=pending
    )


# ==================== Threat Detection Endpoints (Task 7) ====================

@app.post("/threats/detect", response_model=ThreatDetailResponse, status_code=status.HTTP_201_CREATED)
async def detect_threat(threat_request: ThreatDetectionRequest):
    """Detect and classify a threat from sensor data."""
    
    # Classify threat
    threat_level, reason = detector.classify_threat(
        threat_request.object_type,
        threat_request.confidence,
        threat_request.location
    )
    
    # Generate unique threat ID
    threat_id = detector.generate_threat_id(threat_request.sensor_id)
    
    # Create threat record
    threat = ThreatDetailResponse(
        threat_id=threat_id,
        sensor_id=threat_request.sensor_id,
        object_type=threat_request.object_type,
        confidence=threat_request.confidence,
        threat_level=threat_level,
        location=threat_request.location,
        image_url=threat_request.image_url,
        timestamp=threat_request.timestamp or datetime.utcnow()
    )
    
    # Store in memory
    threats_db[threat_id] = threat.model_dump()
    
    # Store in distributed filesystem (k3s PVC)
    storage.save_threat(threat.model_dump())
    
    # Send notifications for high/critical threats (Task 9)
    if detector.should_notify(threat_level):
        await notifier.send_threat_alert(threat)
    
    logger.info(f"Threat detected: {threat_id} - Level: {threat_level}")
    
    return threat


@app.get("/threats", response_model=ThreatsListResponse)
async def get_threats(
    threat_level: Optional[ThreatLevel] = Query(None),
    resolved: Optional[bool] = Query(None),
    limit: int = Query(100, ge=1, le=1000)
):
    """Get list of threats with optional filtering."""
    
    threats = list(threats_db.values())
    
    # Apply filters
    if threat_level:
        threats = [t for t in threats if t.get("threat_level") == threat_level]
    
    if resolved is not None:
        threats = [t for t in threats if t.get("resolved") == resolved]
    
    # Sort by timestamp descending
    threats.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    
    # Apply limit
    threats = threats[:limit]
    
    return ThreatsListResponse(
        total=len(threats),
        threats=[ThreatDetailResponse(**t) for t in threats],
        filters={"threat_level": threat_level, "resolved": resolved}
    )


@app.get("/threats/{threat_id}", response_model=ThreatDetailResponse)
async def get_threat(threat_id: str):
    """Get details of a specific threat."""
    
    if threat_id not in threats_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Threat {threat_id} not found"
        )
    
    return ThreatDetailResponse(**threats_db[threat_id])


@app.patch("/threats/{threat_id}/acknowledge", response_model=ThreatDetailResponse)
async def acknowledge_threat(threat_id: str, request: ThreatAcknowledgeRequest):
    """Acknowledge a threat."""
    
    if threat_id not in threats_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Threat {threat_id} not found"
        )
    
    threat = threats_db[threat_id]
    threat["acknowledged"] = True
    threat["acknowledged_by"] = request.acknowledged_by
    threat["acknowledged_at"] = datetime.utcnow()
    
    if request.notes:
        threat["notes"] = request.notes
    
    # Update in storage
    storage.update_threat(threat_id, {
        "acknowledged": True,
        "acknowledged_by": request.acknowledged_by,
        "acknowledged_at": datetime.utcnow(),
        "notes": request.notes
    })
    
    logger.info(f"Threat {threat_id} acknowledged by {request.acknowledged_by}")
    
    return ThreatDetailResponse(**threat)


@app.patch("/threats/{threat_id}/resolve", response_model=ThreatDetailResponse)
async def resolve_threat(threat_id: str, request: ThreatResolveRequest):
    """Mark a threat as resolved."""
    
    if threat_id not in threats_db:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Threat {threat_id} not found"
        )
    
    threat = threats_db[threat_id]
    threat["resolved"] = True
    threat["resolved_at"] = datetime.utcnow()
    
    if request.notes:
        threat["notes"] = request.notes
    
    # Update in storage
    storage.update_threat(threat_id, {
        "resolved": True,
        "resolved_at": datetime.utcnow(),
        "notes": request.notes
    })
    
    logger.info(f"Threat {threat_id} resolved by {request.resolved_by}")
    
    return ThreatDetailResponse(**threat)


# ==================== Sensor Management Endpoints ====================

@app.post("/sensors/heartbeat")
async def sensor_heartbeat(heartbeat: SensorHeartbeatRequest):
    """Process sensor heartbeat and health metrics."""
    
    # Update sensor status
    sensors_db[heartbeat.sensor_id] = {
        "sensor_id": heartbeat.sensor_id,
        "status": heartbeat.status,
        "last_heartbeat": heartbeat.timestamp or datetime.utcnow(),
        "temperature": heartbeat.temperature,
        "memory_usage": heartbeat.memory_usage,
        "cpu_usage": heartbeat.cpu_usage,
        "threats_detected": sum(1 for t in threats_db.values() if t.get("sensor_id") == heartbeat.sensor_id)
    }
    
    logger.debug(f"Heartbeat received from sensor {heartbeat.sensor_id}")
    
    return {
        "sensor_id": heartbeat.sensor_id,
        "status": "received",
        "timestamp": datetime.utcnow()
    }


@app.get("/sensors/active", response_model=List[SensorInfo])
async def get_active_sensors():
    """Get list of active sensors."""
    
    sensors = []
    for sensor_id, data in sensors_db.items():
        sensors.append(SensorInfo(**data))
    
    return sensors


# ==================== Error Handlers ====================

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle general exceptions."""
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        app,
        host=settings.host,
        port=settings.port,
        log_level="info"
    )
