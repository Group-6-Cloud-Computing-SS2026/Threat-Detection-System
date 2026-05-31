import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import v1_router
from app.config import settings
from app.services.image_storage_service import ImageStorageService
from app.services.mqtt_service import mqtt_subscriber
from app.utils.exceptions import AppException

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s %(levelname)-8s [%(name)s] %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan: startup and shutdown hooks."""
    logger.info("🚀 Starting Threat Detection System API v0.1.0")

    # Ensure MinIO bucket exists
    try:
        storage = ImageStorageService()
        storage.ensure_bucket()
        logger.info("✅ MinIO bucket verified: %s", settings.MINIO_BUCKET_DETECTIONS)
    except Exception as e:
        logger.warning("⚠️  MinIO not available at startup: %s", e)

    # Start MQTT subscriber as background task
    mqtt_task = asyncio.create_task(mqtt_subscriber())
    logger.info("✅ MQTT subscriber started")

    # Start periodic stale-node checker
    async def _stale_node_checker():
        """Check for stale nodes every 5 minutes."""
        from app.database import async_session_factory
        from app.services.health_service import HealthService

        while True:
            await asyncio.sleep(300)  # 5 minutes
            try:
                async with async_session_factory() as db:
                    service = HealthService(db)
                    stale = await service.check_stale_nodes(timeout_minutes=5)
                    if stale:
                        logger.warning("Marked %d nodes as offline", len(stale))
                    await db.commit()
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error("Stale node check failed: %s", e)

    stale_task = asyncio.create_task(_stale_node_checker())

    yield

    # Shutdown
    logger.info("🛑 Shutting down background tasks...")
    mqtt_task.cancel()
    stale_task.cancel()
    try:
        await mqtt_task
    except asyncio.CancelledError:
        pass
    try:
        await stale_task
    except asyncio.CancelledError:
        pass
    logger.info("✅ Shutdown complete")


app = FastAPI(
    title="Threat Detection System API",
    description="Backend API for the edge-computing threat detection sensor network.",
    version="0.1.0",
    lifespan=lifespan,
)

@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail})

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

if settings.PROMETHEUS_ENABLED:
    try:
        from prometheus_fastapi_instrumentator import Instrumentator
        Instrumentator().instrument(app).expose(app, endpoint="/api/v1/metrics")
        logger.info("✅ Prometheus metrics enabled at /api/v1/metrics")
    except ImportError:
        logger.warning("⚠️  prometheus-fastapi-instrumentator not installed, metrics disabled")

app.include_router(v1_router, prefix=settings.API_V1_PREFIX)

@app.get("/", tags=["Root"])
async def root():
    """Health-check / landing endpoint."""
    return {
        "message": "Threat Detection System API is running.",
        "version": "0.1.0",
        "docs": "/docs",
    }
