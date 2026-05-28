"""
MQTT service — background subscriber for sensor detection and health messages.

Runs as a background task inside the FastAPI lifespan.
"""

import asyncio
import json
import logging
from uuid import UUID

import aiomqtt

from app.config import settings
from app.database import async_session_factory
from app.schemas.detection_event import DetectionEventCreate
from app.schemas.health_status import HealthStatusCreate
from app.services.detection_service import DetectionService
from app.services.health_service import HealthService
from app.services.system_log_service import SystemLogService
from app.utils.time_utils import utc_now

logger = logging.getLogger(__name__)

# Module-level MQTT connection status for infrastructure reporting
mqtt_connected: bool = False


async def mqtt_subscriber():
    """Long-running MQTT subscriber that processes sensor messages."""
    global mqtt_connected

    while True:
        try:
            async with aiomqtt.Client(
                hostname=settings.MQTT_BROKER_HOST,
                port=settings.MQTT_BROKER_PORT,
            ) as client:
                mqtt_connected = True
                logger.info(
                    "MQTT connected to %s:%d",
                    settings.MQTT_BROKER_HOST,
                    settings.MQTT_BROKER_PORT,
                )

                await client.subscribe(settings.MQTT_TOPIC_DETECTIONS)
                await client.subscribe(settings.MQTT_TOPIC_HEALTH)
                logger.info("Subscribed to MQTT topics")

                async for message in client.messages:
                    try:
                        await _handle_message(message)
                    except Exception as e:
                        logger.error("Error handling MQTT message: %s", e, exc_info=True)

        except aiomqtt.MqttError as e:
            mqtt_connected = False
            logger.warning("MQTT disconnected: %s. Reconnecting in 5s...", e)
            await asyncio.sleep(5)
        except asyncio.CancelledError:
            mqtt_connected = False
            logger.info("MQTT subscriber cancelled")
            break
        except Exception as e:
            mqtt_connected = False
            logger.error("MQTT unexpected error: %s. Reconnecting in 10s...", e, exc_info=True)
            await asyncio.sleep(10)


async def _handle_message(message: aiomqtt.Message) -> None:
    """Route an incoming MQTT message to the appropriate service."""
    topic = str(message.topic)
    payload = json.loads(message.payload.decode())
    parts = topic.split("/")

    # Extract sensor_id from topic: sensors/{sensor_id}/detections or health
    if len(parts) < 3:
        logger.warning("Unexpected MQTT topic format: %s", topic)
        return

    sensor_id_str = parts[1]
    message_type = parts[2]

    async with async_session_factory() as db:
        try:
            if message_type == "detections":
                await _handle_detection(db, sensor_id_str, payload)
            elif message_type == "health":
                await _handle_health(db, sensor_id_str, payload)
            else:
                logger.warning("Unknown MQTT message type: %s", message_type)

            await db.commit()
        except Exception as e:
            await db.rollback()
            logger.error("Failed to process MQTT %s message: %s", message_type, e, exc_info=True)

            # Log the failure
            try:
                log_service = SystemLogService(db)
                await log_service.log(
                    level="ERROR",
                    source="mqtt_service",
                    message=f"Failed to process {message_type} from sensor {sensor_id_str}: {e}",
                    context={"topic": topic, "error": str(e)},
                )
                await db.commit()
            except Exception:
                pass


async def _handle_detection(db, sensor_id_str: str, payload: dict) -> None:
    """Process a detection message."""
    service = DetectionService(db)
    data = DetectionEventCreate(
        sensor_node_id=UUID(payload.get("sensor_id", sensor_id_str)),
        event_type=payload.get("event_type", "unknown"),
        severity=payload.get("severity", "medium"),
        confidence=payload.get("confidence", 0.0),
        raw_detections=payload.get("detections"),
        metadata=payload.get("metadata"),
        detected_at=payload.get("timestamp", utc_now().isoformat()),
        image_base64=payload.get("image_base64"),
    )
    await service.ingest_detection(data)
    logger.info("Ingested detection from sensor %s: %s", sensor_id_str, data.event_type)


async def _handle_health(db, sensor_id_str: str, payload: dict) -> None:
    """Process a health heartbeat message."""
    service = HealthService(db)
    sensor_id = UUID(payload.get("sensor_id", sensor_id_str))
    data = HealthStatusCreate(
        cpu_usage_percent=payload.get("cpu_usage_percent"),
        memory_usage_percent=payload.get("memory_usage_percent"),
        disk_usage_percent=payload.get("disk_usage_percent"),
        cpu_temperature_celsius=payload.get("cpu_temperature_celsius"),
        gpu_temperature_celsius=payload.get("gpu_temperature_celsius"),
        uptime_seconds=payload.get("uptime_seconds"),
        network_status=payload.get("network_status"),
        inference_fps=payload.get("inference_fps"),
        extra_metrics=payload.get("extra_metrics"),
    )
    await service.record_health(sensor_id, data)
    logger.debug("Recorded health from sensor %s", sensor_id_str)
