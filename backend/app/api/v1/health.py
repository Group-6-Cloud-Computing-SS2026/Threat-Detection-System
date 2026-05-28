"""
Health router — API health check and cluster health overview.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.health_status import ClusterHealthResponse, HealthStatusResponse
from app.services.health_service import HealthService

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("")
async def health_check():
    """Public API health check — no auth required."""
    return {"status": "healthy"}


@router.get("/cluster", response_model=ClusterHealthResponse)
async def cluster_health(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    service = HealthService(db)
    overview = await service.get_cluster_overview()
    return ClusterHealthResponse(**overview)


@router.get("/nodes/{node_id}", response_model=list[HealthStatusResponse])
async def node_health_history(
    node_id: UUID,
    hours: int = Query(24, ge=1, le=168),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    service = HealthService(db)
    return await service.get_node_health_history(node_id, hours=hours)


@router.get("/nodes/{node_id}/latest", response_model=HealthStatusResponse | None)
async def node_latest_health(
    node_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    service = HealthService(db)
    return await service.get_latest_for_node(node_id)
