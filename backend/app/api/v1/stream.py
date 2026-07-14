from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from app.services.mqtt_service import manager
from app.utils.security import decode_access_token
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/stream", tags=["Stream"])


@router.websocket("/ws")
async def websocket_stream(
    websocket: WebSocket,
    token: str | None = Query(None),
):
    """WebSocket endpoint for receiving the live camera stream."""
    # Verify token
    if token:
        payload = decode_access_token(token)
        if not payload or not payload.get("sub"):
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
    else:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(websocket)
    logger.info("WebSocket client connected to live stream")
    try:
        while True:
            # Keep connection alive; receive messages from client (if any, e.g. ping/pong)
            await websocket.receive_text()
    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected from live stream")
    except Exception as e:
        logger.error("Error in live stream WebSocket: %s", e)
    finally:
        manager.disconnect(websocket)
