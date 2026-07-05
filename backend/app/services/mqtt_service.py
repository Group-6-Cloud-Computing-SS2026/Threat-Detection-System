"""
MQTT service — background subscriber for sensor detection and health messages.

Runs as a background task inside the FastAPI lifespan.
"""

import asyncio
import json
import logging
from datetime import datetime, timedelta, timezone
from uuid import UUID

import aiomqtt

from app.config import settings
from app.database import async_session_factory
from app.repositories.sensor_node_repo import SensorNodeRepository
from app.schemas.detection_event import DetectionEventCreate
from app.schemas.health_status import HealthStatusCreate
from app.services.detection_service import DetectionService
from app.services.health_service import HealthService
from app.services.system_log_service import SystemLogService
from app.utils.enums import EventType, NodeStatus
from app.utils.time_utils import utc_now

logger = logging.getLogger(__name__)

# Module-level MQTT connection status for infrastructure reporting
mqtt_connected: bool = False
# Last known camera stream frame per node so detection events without images can still be archived.
_latest_camera_stream_frames: dict[str, dict[str, object]] = {}


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
                await client.subscribe(settings.MQTT_TOPIC_CAMERA)
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

    if topic == "cluster/camera/stream":
        _cache_camera_stream_frame(payload)
        return

    # Route camera detection events: cluster/camera/{sub-topic}
    if len(parts) >= 2 and parts[0] == "cluster" and parts[1] == "camera":
        async with async_session_factory() as db:
            try:
                await _handle_camera_event(db, topic, payload)
                await db.commit()
            except Exception as e:
                await db.rollback()
                logger.error("Failed to process camera event on %s: %s", topic, e, exc_info=True)
        return

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
    _valid_types = {e.value for e in EventType}
    _valid_severities = {"low", "medium", "high", "critical"}
    raw_type = payload.get("event_type", "unknown")
    raw_severity = payload.get("severity", "medium")
    raw_detections_payload = payload.get("detections")
    if isinstance(raw_detections_payload, list):
        raw_detections = {"detections": raw_detections_payload, "count": len(raw_detections_payload)}
    else:
        raw_detections = raw_detections_payload
    service = DetectionService(db)
    data = DetectionEventCreate(
        sensor_node_id=UUID(payload.get("sensor_id", sensor_id_str)),
        event_type=raw_type if raw_type in _valid_types else "unknown",
        severity=raw_severity if raw_severity in _valid_severities else "medium",
        confidence=payload.get("confidence", 0.0),
        raw_detections=raw_detections,
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


async def _handle_camera_event(db, topic: str, payload: dict) -> None:
    """Process a detection event published by an edge camera node.

    Expects payload: {"node": "pi4-edge", "timestamp": "...", "objects": 1, "label": "person"}
    Auto-registers the originating node as a SensorNode on first contact.
    """
    # Extract node identifier — use topic as fallback if "node" field is absent
    node_hostname = payload.get("node") or topic.replace("/", "-")

    # Look up or auto-register the sensor node
    sensor_repo = SensorNodeRepository(db)
    node = await sensor_repo.get_by_hostname(node_hostname)
    if not node:
        now = utc_now()
        node = await sensor_repo.create({
            "name": node_hostname,
            "hostname": node_hostname,
            "ip_address": "0.0.0.0",
            "status": NodeStatus.ONLINE,
            "registered_at": now,
            "created_at": now,
            "updated_at": now,
        })
        logger.info("Auto-registered camera edge node: %s", node_hostname)

    # Parse timestamp
    raw_ts = payload.get("timestamp")
    if isinstance(raw_ts, str):
        from datetime import datetime
        detected_at = datetime.fromisoformat(raw_ts.replace("Z", "+00:00"))
    else:
        detected_at = utc_now()

    # Parse label
    label = payload.get("label") or "unknown"
    # Normalise to a known EventType value where possible
    _LABEL_MAP = {
        "person": "person",
        "theft": "theft",
        "fire": "fire",
        "vandalism": "vandalism",
        "weapon": "weapon",
        "unknown": "unknown",
        # YOLO COCO → EventType fallback mappings
        "knife": "weapon",
        "scissors": "weapon",
        "baseball bat": "weapon",
        "gun": "weapon",
        "pistol": "weapon",
        "rifle": "weapon",
        "smoke": "fire",
    }
    event_type = _LABEL_MAP.get(label.lower(), "unknown")

    objects_count = payload.get("objects", 1)

    image_base64 = payload.get("image_base64")
    if not image_base64:
        image_base64 = _get_cached_camera_stream_frame(node_hostname)

    # Use severity/confidence from Pi4; validate severity
    _valid_severities = {"low", "medium", "high", "critical"}
    raw_severity = payload.get("severity", "medium")
    raw_confidence = payload.get("confidence", 1.0)

    # Wrap YOLO list into a dict so JSONB schema is satisfied
    raw_detections_payload = payload.get("raw_detections")
    if isinstance(raw_detections_payload, list):
        raw_detections = {"detections": raw_detections_payload, "count": len(raw_detections_payload)}
    elif isinstance(raw_detections_payload, dict):
        raw_detections = raw_detections_payload
    else:
        raw_detections = {"objects": objects_count, "label": label}

    # Merge Pi4 edge metadata with backend tracking fields
    edge_metadata = payload.get("metadata") or {}
    merged_metadata = {
        **edge_metadata,
        "mqtt_topic": topic,
        "source": "camera_edge",
        "node": node_hostname,
        "image_received": bool(image_base64),
    }

    service = DetectionService(db)
    data = DetectionEventCreate(
        sensor_node_id=node.id,
        event_type=event_type,
        severity=raw_severity if raw_severity in _valid_severities else "medium",
        confidence=min(max(float(raw_confidence), 0.0), 1.0),
        detected_at=detected_at,
        raw_detections=raw_detections,
        metadata=merged_metadata,
        image_base64=image_base64,
    )
    await service.ingest_detection(data)
    logger.info(
        "Saved camera detection from node %s: %s (%d object(s))",
        node_hostname, event_type, objects_count,
    )


def _cache_camera_stream_frame(payload: dict) -> None:
    """Cache the newest raw stream frame for a node so later detections can reuse it."""
    image_base64 = payload.get("image") or payload.get("image_base64")
    if not image_base64:
        return

    node_key = str(payload.get("node") or payload.get("sensor_id") or "pi4-edge")
    timestamp_value = payload.get("timestamp")
    timestamp = utc_now()

    if isinstance(timestamp_value, str):
        try:
            timestamp = datetime.fromisoformat(timestamp_value.replace("Z", "+00:00"))
        except Exception:
            timestamp = utc_now()

    _latest_camera_stream_frames[node_key] = {
        "image_base64": image_base64,
        "timestamp": timestamp,
    }


def _get_cached_camera_stream_frame(node_key: str) -> str | None:
    """Return a fresh cached stream frame if one is available for the node."""
    cached = _latest_camera_stream_frames.get(node_key)
    if not cached:
        return None

    cached_timestamp = cached.get("timestamp")
    if not isinstance(cached_timestamp, datetime):
        return None

    current_time = utc_now()
    if current_time.tzinfo is None:
        current_time = current_time.replace(tzinfo=timezone.utc)
    if cached_timestamp.tzinfo is None:
        cached_timestamp = cached_timestamp.replace(tzinfo=timezone.utc)

    if current_time - cached_timestamp > timedelta(seconds=10):
        return None

    return cached.get("image_base64") if isinstance(cached.get("image_base64"), str) else None