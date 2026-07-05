import time
import json
import base64
import os
import subprocess
import argparse
from datetime import datetime, timezone
from uuid import uuid4
import paho.mqtt.client as mqtt

# Try to import YOLO for object detection
try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False

# Try to import OpenCV for annotation
try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    CV2_AVAILABLE = False

# Target defaults (can be overridden by CLI arguments)
DEFAULT_BROKER = "192.168.1.50"  # Pi 5 Master IP
DEFAULT_PORT = 1883
DEFAULT_TOPIC_STREAM = "cluster/camera/stream"
DEFAULT_TOPIC_EVENTS = "cluster/camera/events"
DEFAULT_FPS = 20
DEFAULT_WIDTH = 640
DEFAULT_HEIGHT = 480
DEFAULT_QUALITY = 85  # JPEG compression quality percentage
DEFAULT_SENSOR_ID = str(uuid4())  # Generate or use environment variable

def parse_args():
    parser = argparse.ArgumentParser(description="Threat Detection System — Edge Camera Publisher with YOLO Detection")
    parser.add_argument("--broker", "-b", default=DEFAULT_BROKER, help="MQTT Broker IP address")
    parser.add_argument("--port", "-p", type=int, default=DEFAULT_PORT, help="MQTT Broker port")
    parser.add_argument("--topic-stream", "-ts", default=DEFAULT_TOPIC_STREAM, help="MQTT topic for raw stream frames")
    parser.add_argument("--topic-events", "-te", default=DEFAULT_TOPIC_EVENTS, help="MQTT topic for detection events")
    parser.add_argument("--fps", "-f", type=int, default=DEFAULT_FPS, help="Target frames per second (FPS)")
    parser.add_argument("--width", "-w", type=int, default=DEFAULT_WIDTH, help="Frame capture width")
    parser.add_argument("--height", "-g", type=int, default=DEFAULT_HEIGHT, help="Frame capture height")
    parser.add_argument("--quality", "-q", type=int, default=DEFAULT_QUALITY, help="JPEG compression quality (1-100)")
    parser.add_argument(
        "--backend", "-k",
        choices=["auto", "rpicam", "libcamera", "opencv"],
        default="auto",
        help="Camera backend to use (auto prioritizes native utilities over buggy OpenCV V4L2)"
    )
    parser.add_argument(
        "--sensor-id", "-s",
        default=os.getenv("SENSOR_ID", DEFAULT_SENSOR_ID),
        help="Unique sensor identifier (UUID). Can set via SENSOR_ID env var."
    )
    parser.add_argument(
        "--yolo-model", "-m",
        default="yolov8n.pt",
        help="Path or name of YOLO model (e.g., yolov8n.pt, yolov8s.pt)"
    )
    parser.add_argument(
        "--confidence", "-c",
        type=float,
        default=0.5,
        help="YOLO confidence threshold (0.0-1.0)"
    )
    parser.set_defaults(enable_detections=True)
    detection_group = parser.add_mutually_exclusive_group()
    detection_group.add_argument(
        "--enable-detections",
        dest="enable_detections",
        action="store_true",
        help="Enable YOLO object detection and send events"
    )
    detection_group.add_argument(
        "--disable-detections",
        dest="enable_detections",
        action="store_false",
        help="Disable YOLO object detection and send only raw stream frames"
    )
    parser.add_argument(
        "--disable-stream",
        action="store_true",
        help="Disable raw stream publishing (only send detection events)"
    )
    return parser.parse_args()

def init_camera(args):
    camera_backend = None
    cap = None
    camera_command = None

    # Determine command paths for native utilities
    native_cmds = {"rpicam-still": "rpicam", "libcamera-still": "libcamera"}
    found_native_cmd = None
    found_native_backend = None

    for cmd, backend in native_cmds.items():
        try:
            subprocess.run(["which", cmd], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            found_native_cmd = cmd
            found_native_backend = backend
            break
        except (subprocess.CalledProcessError, FileNotFoundError):
            continue

    selected_backend = args.backend

    # Backend selection logic
    if selected_backend == "auto":
        # Prioritize native camera tools to bypass OpenCV V4L2 /dev/video0 lock deadlocks
        if found_native_backend:
            camera_backend = found_native_backend
            camera_command = found_native_cmd
            print(f"✅ Auto-selected native Pi Camera backend: {camera_command}")
        else:
            # Fall back to OpenCV if no native tools exist
            camera_backend = "opencv"
            print("⚠️ No native Pi Camera tools found. Attempting to fall back to OpenCV...")
    elif selected_backend in ["rpicam", "libcamera"]:
        cmd_needed = "rpicam-still" if selected_backend == "rpicam" else "libcamera-still"
        if found_native_backend and found_native_cmd == cmd_needed:
            camera_backend = selected_backend
            camera_command = found_native_cmd
            print(f"✅ Initialized explicit Pi Camera backend: {camera_command}")
        else:
            print(f"❌ Error: Explicit backend '{selected_backend}' requested but '{cmd_needed}' is not installed.")
            exit(1)
    elif selected_backend == "opencv":
        camera_backend = "opencv"
        print("✅ Initializing explicit OpenCV camera backend...")

    # Initialize selected backend
    if camera_backend == "opencv":
        try:
            import cv2
            cap = cv2.VideoCapture(0)
            if cap.isOpened():
                cap.set(cv2.CAP_PROP_FRAME_WIDTH, args.width)
                cap.set(cv2.CAP_PROP_FRAME_HEIGHT, args.height)
                print("✅ OpenCV camera backend successfully opened /dev/video0.")
            else:
                cap.release()
                cap = None
                print("❌ Error: OpenCV camera capture failed to open /dev/video0.")
                exit(1)
        except ImportError:
            print("❌ Error: OpenCV library not found in Python environment.")
            exit(1)

    if camera_backend is None:
        print("❌ Fatal: No valid camera backend could be initialized.")
        exit(1)

    return camera_backend, cap, camera_command

def capture_frame(camera_backend, cap, camera_command, args):
    """Captures a frame from the camera and returns it as a Base64 JPEG string."""
    if camera_backend == "opencv":
        ret, frame = cap.read()
        if not ret:
            print("⚠️ Failed to capture frame from OpenCV.")
            return None, None
        
        # Resize to target if cv2.CAP_PROP didn't enforce it
        if frame.shape[1] != args.width or frame.shape[0] != args.height:
            import cv2
            frame = cv2.resize(frame, (args.width, args.height))
            
        # Encode as JPEG
        import cv2
        _, buffer = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), args.quality])
        base64_frame = base64.b64encode(buffer).decode("utf-8")
        return base64_frame, frame
        
    elif camera_backend in ["rpicam", "libcamera"]:
        temp_file = "/tmp/stream_frame.jpg"
        cmd = [
            camera_command,
            "-t", "200",            # 200ms sensor warmup — enough for exposure lock without stalling stream FPS
            "--width", str(args.width),
            "--height", str(args.height),
            "-q", str(args.quality),  # JPEG quality
            "-o", temp_file,
            "-n"                     # No preview window
        ]
        try:
            subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            if os.path.exists(temp_file):
                with open(temp_file, "rb") as f:
                    img_bytes = f.read()
                os.remove(temp_file)
                # Decode frame for YOLO detection if needed
                frame = None
                if CV2_AVAILABLE and args.enable_detections:
                    import numpy as np
                    import cv2
                    frame = cv2.imdecode(np.frombuffer(img_bytes, dtype=np.uint8), cv2.IMREAD_COLOR)
                base64_frame = base64.b64encode(img_bytes).decode("utf-8")
                return base64_frame, frame
        except subprocess.CalledProcessError as e:
            print(f"⚠️ {camera_command} capture failed: {e}")
            return None, None


def detect_objects(frame, yolo_model, confidence_threshold):
    """Run YOLO detection on a frame and return detections."""
    if not YOLO_AVAILABLE or yolo_model is None or frame is None:
        return None, None
    
    try:
        results = yolo_model(frame, conf=confidence_threshold, verbose=False)
        detections = []
        annotated_frame = frame.copy()
        
        if len(results) > 0 and results[0].boxes is not None:
            boxes = results[0].boxes
            for box in boxes:
                detection = {
                    "class": int(box.cls[0]),
                    "class_name": yolo_model.names.get(int(box.cls[0]), "unknown"),
                    "confidence": float(box.conf[0]),
                    "bbox": {
                        "x1": float(box.xyxy[0][0]),
                        "y1": float(box.xyxy[0][1]),
                        "x2": float(box.xyxy[0][2]),
                        "y2": float(box.xyxy[0][3]),
                    }
                }
                detections.append(detection)
            
            # Annotate frame if OpenCV available
            if CV2_AVAILABLE:
                annotated_frame = results[0].plot()
        
        return detections, annotated_frame
    except Exception as e:
        print(f"⚠️ YOLO detection failed: {e}")
        return None, None


# Maps YOLO COCO class names to TDS EventType labels
_YOLO_TO_EVENT_TYPE: dict[str, str] = {
    "person": "person",
    "knife": "weapon",
    "scissors": "weapon",
    "baseball bat": "weapon",
    "gun": "weapon",
    "pistol": "weapon",
    "rifle": "weapon",
    "fire": "fire",
    "smoke": "fire",
}

# Severity per EventType
_EVENT_TYPE_SEVERITY: dict[str, str] = {
    "person": "low",
    "weapon": "high",
    "fire": "critical",
    "theft": "high",
    "vandalism": "medium",
    "unknown": "medium",
}


if __name__ == "__main__":
    args = parse_args()
    
    # Initialize YOLO model if available and enabled
    yolo_model = None
    if args.enable_detections and YOLO_AVAILABLE:
        try:
            print(f"Loading YOLO model: {args.yolo_model}...")
            yolo_model = YOLO(args.yolo_model)
            print(f"✅ YOLO model loaded successfully")
        except Exception as e:
            print(f"⚠️ Failed to load YOLO model: {e}")
            print("   Continuing without object detection...")
            args.enable_detections = False
    
    # Initialize camera backend based on arguments and platform capabilities
    camera_backend, cap, camera_command = init_camera(args)
    
    client = mqtt.Client()
    print(f"Connecting to MQTT Broker on Pi 5 at {args.broker}:{args.port}...")
    try:
        client.connect(args.broker, args.port, 60)
    except Exception as e:
        print(f"Error connecting to MQTT Broker: {e}")
        print("Please make sure your K3s Mosquitto MQTT broker service is running on the Pi 5 Master.")
        if cap is not None:
            cap.release()
        exit(1)
        
    client.loop_start()
    
    print("\n-----------------------------------------------------------")
    print(f"LIVE EDGE CAMERA STREAM ACTIVE [{args.fps} FPS]")
    if not args.disable_stream:
        print(f"Raw Stream Topic: {args.topic_stream}")
    if args.enable_detections:
        print(f"Detection Events Topic: {args.topic_events}")
        print(f"YOLO Model: {args.yolo_model if yolo_model else 'NOT LOADED'}")
    print(f"Active Backend: {camera_backend.upper()}")
    if camera_command:
        print(f"Native Utility: {camera_command}")
    print(f"Sensor ID: {args.sensor_id}")
    print("Press Ctrl+C to terminate the stream.")
    print("-----------------------------------------------------------\n")
    
    interval = 1.0 / args.fps
    frameCount = 0
    
    try:
        while True:
            t_start = time.time()
            
            base64_frame, frame = capture_frame(camera_backend, cap, camera_command, args)
            
            # Publish raw stream if enabled and an image was captured.
            if base64_frame and not args.disable_stream:
                stream_payload = {
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "fps": args.fps,
                    "node": "pi4-edge",
                    "sensor_id": args.sensor_id,
                    "image": base64_frame
                }
                client.publish(args.topic_stream, json.dumps(stream_payload))

            # Perform YOLO detection and publish events even when the image is unavailable.
            if args.enable_detections and yolo_model and frame is not None:
                detections, annotated_frame = detect_objects(frame, yolo_model, args.confidence)

                if detections and len(detections) > 0:
                    # Encode annotated frame if available
                    annotated_base64 = None
                    if annotated_frame is not None and CV2_AVAILABLE:
                        try:
                            import cv2
                            _, buffer = cv2.imencode(".jpg", annotated_frame,
                                                    [int(cv2.IMWRITE_JPEG_QUALITY), args.quality])
                            annotated_base64 = base64.b64encode(buffer).decode("utf-8")
                        except Exception:
                            pass

                    for detection in detections:
                        class_name = detection.get("class_name", "unknown").lower()
                        confidence = detection.get("confidence", 0)

                        # Map YOLO class to EventType label and severity
                        event_type = _YOLO_TO_EVENT_TYPE.get(class_name, "unknown")
                        severity = _EVENT_TYPE_SEVERITY.get(event_type, "medium")

                        # Create detection event
                        event_payload = {
                            "timestamp": datetime.now(timezone.utc).isoformat(),
                            "node": "pi4-edge",
                            "sensor_id": args.sensor_id,
                            "event_type": event_type,
                            "objects": len(detections),
                            "label": event_type,
                            "confidence": round(confidence, 4),
                            "severity": severity,
                            "raw_detections": detections,
                            "metadata": {
                                "camera_backend": camera_backend,
                                "frame_width": args.width,
                                "frame_height": args.height,
                                "image_received": bool(base64_frame),
                                "yolo_class": class_name,
                            }
                        }
                        if annotated_base64 or base64_frame:
                            event_payload["image_base64"] = annotated_base64 or base64_frame

                        client.publish(args.topic_events, json.dumps(event_payload))
                
                frameCount += 1
                if frameCount % 30 == 0:
                    print(f"[{datetime.now().strftime('%H:%M:%S')}] Active: Sent {frameCount} frames.")
            
            # Wait for next frame maintaining exact target FPS
            t_elapsed = time.time() - t_start
            t_sleep = max(0, interval - t_elapsed)
            time.sleep(t_sleep)
            
    except KeyboardInterrupt:
        print("\nShutting down camera publisher cleanly.")
    finally:
        if cap is not None:
            cap.release()
        client.loop_stop()
        client.disconnect()

