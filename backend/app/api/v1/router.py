"""
V1 API router — aggregates all v1 endpoint routers.
"""

from fastapi import APIRouter

from app.api.v1.auth import router as auth_router
from app.api.v1.sensor_nodes import router as sensor_nodes_router
from app.api.v1.detections import router as detections_router
from app.api.v1.images import router as images_router
from app.api.v1.logs import router as logs_router
from app.api.v1.health import router as health_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.dashboard import router as dashboard_router
from app.api.v1.infrastructure import router as infrastructure_router

v1_router = APIRouter()

v1_router.include_router(auth_router)
v1_router.include_router(sensor_nodes_router)
v1_router.include_router(detections_router)
v1_router.include_router(images_router)
v1_router.include_router(logs_router)
v1_router.include_router(health_router)
v1_router.include_router(notifications_router)
v1_router.include_router(dashboard_router)
v1_router.include_router(infrastructure_router)
