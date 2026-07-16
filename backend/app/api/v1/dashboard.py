"""
Dashboard router — aggregated stats for the frontend dashboard.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.database import get_db
from app.models.user import User
from app.repositories.detection_event_repo import DetectionEventRepository
from app.repositories.sensor_node_repo import SensorNodeRepository
from app.services.detection_service import DetectionService
from app.services.health_service import HealthService
from app.services.notification_service import NotificationService

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/summary")
async def dashboard_summary(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Aggregated stats for the frontend dashboard home."""
    detection_service = DetectionService(db)
    health_service = HealthService(db)
    notif_service = NotificationService(db)
    node_repo = SensorNodeRepository(db)

    stats = await detection_service.get_statistics()
    cluster = await health_service.get_cluster_overview()
    unread = await notif_service.count_unread()
    recent = await detection_service.get_recent(limit=5)

    return {
        "detection_stats": stats,
        "cluster_health": {
            "total_nodes": cluster["total_nodes"],
            "online_nodes": cluster["online_nodes"],
            "offline_nodes": cluster["offline_nodes"],
        },
        "unread_notifications": unread,
        "recent_detections": [
            {
                "id": str(e.id),
                "event_type": e.event_type,
                "severity": e.severity,
                "confidence": e.confidence,
                "detected_at": e.detected_at.isoformat(),
                "acknowledged": e.acknowledged,
            }
            for e in recent
        ],
    }


@router.get("/event-map")
async def event_map(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Recent events with coordinates for map display."""
    detection_service = DetectionService(db)
    events = await detection_service.get_recent(limit=100)

    points = []
    for e in events:
        if e.sensor_node and (e.sensor_node.latitude or e.sensor_node.longitude):
            points.append({
                "event_id": str(e.id),
                "event_type": e.event_type,
                "severity": e.severity,
                "latitude": e.sensor_node.latitude,
                "longitude": e.sensor_node.longitude,
                "sensor_name": e.sensor_node.name,
                "detected_at": e.detected_at.isoformat(),
            })

    return points


@router.get("/timeline")
async def timeline(
    db: AsyncSession = Depends(get_db),
    _: User = Depends(get_current_user),
):
    """Events bucketed by hour for timeline chart."""
    from sqlalchemy import func, select
    from app.models.detection_event import DetectionEvent

    stmt = (
        select(
            func.date_trunc("hour", DetectionEvent.detected_at).label("bucket"),
            func.count().label("count"),
        )
        .group_by("bucket")
        .order_by("bucket")
        .limit(168)  # last 7 days of hourly data
    )
    result = await db.execute(stmt)
    return [
        {"timestamp": row.bucket.isoformat(), "count": row.count}
        for row in result.all()
    ]
