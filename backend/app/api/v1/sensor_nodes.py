"""
Sensor Nodes router — CRUD and heartbeat endpoints.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user, require_role
from app.database import get_db
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.health_status import HealthStatusCreate, HealthStatusResponse
from app.schemas.sensor_node import SensorNodeCreate, SensorNodeDetailResponse, SensorNodeResponse, SensorNodeUpdate
from app.services.health_service import HealthService
from app.services.sensor_node_service import SensorNodeService
from app.utils.enums import UserRole
from app.utils.exceptions import AppException

router = APIRouter(prefix="/nodes", tags=["Sensor Nodes"])


@router.post("", response_model=SensorNodeResponse, status_code=status.HTTP_201_CREATED)
async def register_node(
    body: SensorNodeCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    try:
        service = SensorNodeService(db)
        return await service.register_node(body)
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


@router.get("", response_model=PaginatedResponse[SensorNodeResponse])
async def list_nodes(
    status_filter: str | None = Query(None, alias="status"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    service = SensorNodeService(db)
    items, total = await service.get_all_nodes(skip=skip, limit=limit, status=status_filter)
    return PaginatedResponse(items=items, total=total, skip=skip, limit=limit)


@router.get("/{node_id}", response_model=SensorNodeDetailResponse)
async def get_node(
    node_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    try:
        service = SensorNodeService(db)
        node = await service.get_node(node_id)
        health_service = HealthService(db)
        latest_health = await health_service.get_latest_for_node(node_id)
        return SensorNodeDetailResponse(
            **SensorNodeResponse.model_validate(node).model_dump(),
            latest_health=HealthStatusResponse.model_validate(latest_health).model_dump() if latest_health else None,
        )
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


@router.patch("/{node_id}", response_model=SensorNodeResponse)
async def update_node(
    node_id: UUID,
    body: SensorNodeUpdate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    try:
        service = SensorNodeService(db)
        return await service.update_node(node_id, body)
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


@router.delete("/{node_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_node(
    node_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_role(UserRole.ADMIN)),
):
    try:
        service = SensorNodeService(db)
        await service.deregister_node(node_id)
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.detail)


@router.post("/{node_id}/heartbeat", response_model=HealthStatusResponse)
async def receive_heartbeat(
    node_id: UUID,
    body: HealthStatusCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    service = HealthService(db)
    return await service.record_health(node_id, body)
