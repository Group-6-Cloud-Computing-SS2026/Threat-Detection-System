"""
Logs router — system log listing and searching.
"""

from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.system_log import SystemLogCreate, SystemLogResponse
from app.services.system_log_service import SystemLogService

router = APIRouter(prefix="/logs", tags=["System Logs"])


@router.get("", response_model=PaginatedResponse[SystemLogResponse])
async def list_logs(
    level: str | None = None,
    source: str | None = None,
    sensor_id: UUID | None = None,
    start_time: datetime | None = None,
    end_time: datetime | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    service = SystemLogService(db)
    items, total = await service.get_logs(
        level=level, source=source, sensor_id=sensor_id,
        start_time=start_time, end_time=end_time,
        skip=skip, limit=limit,
    )
    return PaginatedResponse(items=items, total=total, skip=skip, limit=limit)


@router.get("/search", response_model=PaginatedResponse[SystemLogResponse])
async def search_logs(
    q: str = Query(..., min_length=1),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    service = SystemLogService(db)
    items, total = await service.search_logs(query=q, skip=skip, limit=limit)
    return PaginatedResponse(items=items, total=total, skip=skip, limit=limit)


@router.post("", response_model=SystemLogResponse, status_code=status.HTTP_201_CREATED)
async def create_log(
    body: SystemLogCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    service = SystemLogService(db)
    return await service.create_from_schema(body)
