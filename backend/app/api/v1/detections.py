"""
Detections router — event ingestion, listing, and acknowledgement.
"""

from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.detection_event import (
    DetectionEventCreate,
    DetectionEventDetailResponse,
    DetectionEventResponse,
    DetectionStatisticsResponse,
)
from app.schemas.detection_image import DetectionImageResponse
from app.services.detection_service import DetectionService
from app.utils.exceptions import AppException

router = APIRouter(prefix="/detections", tags=["Detections"])


@router.post("", response_model=DetectionEventResponse, status_code=status.HTTP_201_CREATED)
async def ingest_detection(
    body: DetectionEventCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Ingest a detection event (REST fallback for non-MQTT)."""
    service = DetectionService(db)
    return await service.ingest_detection(body)


@router.get("", response_model=PaginatedResponse[DetectionEventResponse])
async def list_detections(
    event_type: str | None = None,
    severity: str | None = None,
    sensor_id: UUID | None = None,
    acknowledged: bool | None = None,
    start_time: datetime | None = None,
    end_time: datetime | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    service = DetectionService(db)
    items, total = await service.get_events_feed(
        event_type=event_type, severity=severity, sensor_id=sensor_id,
        acknowledged=acknowledged, start_time=start_time, end_time=end_time,
        skip=skip, limit=limit,
    )
    return PaginatedResponse(items=items, total=total, skip=skip, limit=limit)


@router.get("/recent", response_model=list[DetectionEventResponse])
async def recent_detections(
    limit: int = Query(20, ge=1, le=100),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    service = DetectionService(db)
    return await service.get_recent(limit=limit)


@router.get("/statistics", response_model=DetectionStatisticsResponse)
async def detection_statistics(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    service = DetectionService(db)
    return await service.get_statistics()


@router.get("/{event_id}", response_model=DetectionEventDetailResponse)
async def get_detection(
    event_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    try:
        service = DetectionService(db)
        event, images = await service.get_event_detail(event_id)
        return DetectionEventDetailResponse(
            **DetectionEventResponse.model_validate(event).model_dump(),
            sensor_name=event.sensor_node.name if event.sensor_node else None,
            sensor_location=event.sensor_node.location_label if event.sensor_node else None,
            images=[DetectionImageResponse.model_validate(img).model_dump() for img in images],
        )
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


@router.patch("/{event_id}/acknowledge", response_model=DetectionEventResponse)
async def acknowledge_detection(
    event_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        service = DetectionService(db)
        return await service.acknowledge_event(event_id, current_user.username)
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)
