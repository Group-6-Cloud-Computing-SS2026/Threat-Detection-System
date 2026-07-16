"""
Notifications router.
"""

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database import get_db
from app.models.user import User
from app.schemas.common import PaginatedResponse
from app.schemas.notification import NotificationResponse
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("", response_model=PaginatedResponse[NotificationResponse])
async def list_notifications(
    status: str | None = None,
    notification_type: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    service = NotificationService(db)
    items, total = await service.get_notifications(
        status=status, notification_type=notification_type,
        skip=skip, limit=limit,
    )
    return PaginatedResponse(items=items, total=total, skip=skip, limit=limit)


@router.patch("/{notification_id}/read", response_model=NotificationResponse)
async def mark_notification_read(
    notification_id: UUID,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    service = NotificationService(db)
    notif = await service.mark_read(notification_id)
    if not notif:
        raise HTTPException(status_code=404, detail="Notification not found")
    return notif


@router.get("/unread-count")
async def unread_count(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    service = NotificationService(db)
    count = await service.count_unread()
    return {"count": count}
