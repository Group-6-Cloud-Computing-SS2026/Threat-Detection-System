import os
import sys
import time
import json
import base64
import subprocess
import threading
from datetime import datetime, timezone
import paho.mqtt.client as mqtt

BROKER = os.getenv("MQTT_BROKER_HOST", "192.168.1.50")
PORT = int(os.getenv("MQTT_BROKER_PORT", "1883"))
NODE = "pi4-edge"
TOPIC_EVENTS = "cluster/camera/events"
TOPIC_STREAM = "cluster/camera/stream"
POST_PROCESS_FILE = "/home/cc123/imx500_yolo.json"
DETECTION_INTERVAL = float(os.getenv("DETECTION_INTERVAL", "5.0"))  # seconds
CAMERA_FPS = int(os.getenv("CAMERA_FPS", "30"))

# Global reference to the latest captured frame bytes
latest_frame_base64 = None
frame_lock = threading.Lock()

# Initialize MQTT client
client = mqtt.Client()


def parse_stderr_detections(stderr_stream):
    """Thread function to read stderr, parse YOLO detections, and publish events."""
    global latest_frame_base64
    last_publish_time = 0.0

    print("Started detection log parser thread.")
    while True:
        line = stderr_stream.readline()
        if not line:
            break

        line_str = line.decode("utf-8", errors="ignore").strip()

        # Check for detection summary: "Number of objects detected: [1-9]"
        if "Number of objects detected:" in line_str:
            try:
                parts = line_str.split(":")
                count = int(parts[1].strip())
            except (ValueError, IndexError):
                count = 0

            if count <= 0:
                continue

            # Read the next line to extract the active label (only if count > 0)
            next_line = stderr_stream.readline()
            if not next_line:
                break
            next_line_str = next_line.decode("utf-8", errors="ignore").strip()

            # Raw string layout: "fire[3] (0.85) @ 147308,43185 0x0"
            label = "unknown"
            confidence = 0.0

            # 1. Isolate text after the colon
            raw_target = next_line_str.split(":", 1)[1].strip() if ":" in next_line_str else next_line_str.strip()
            
            # 2. Extract the label (everything before the class bracket '[')
            if "[" in raw_target:
                label = raw_target.split("[")[0].strip()
            
            # 3. Extract the confidence (everything between '(' and ')')
            if "(" in raw_target and ")" in raw_target:
                try:
                    conf_str = raw_target.split("(")[1].split(")")[0].strip()
                    confidence = round(float(conf_str), 2)
                except (ValueError, IndexError):
                    confidence = 0.02

            # Enforce the configured publish interval
            current_time = time.time()
            if current_time - last_publish_time >= DETECTION_INTERVAL:
                last_publish_time = current_time

                # Map label to known EventType and severity
                label_lower = label.lower()
                event_type = "unknown"
                if "person" in label_lower:
                    event_type = "person"
                elif any(
                    w in label_lower
                    for w in [
                        "knife",
                        "scissors",
                        "bat",
                        "gun",
                        "pistol",
                        "rifle",
                        "weapon",
                    ]
                ):
                    event_type = "weapon"
                elif any(f in label_lower for f in ["fire", "smoke"]):
                    event_type = "fire"

                # Determine severity
                severity = "medium"
                if event_type == "person":
                    severity = "low"
                elif event_type == "weapon":
                    severity = "high"
                elif event_type == "fire":
                    severity = "critical"

                ts = datetime.now(timezone.utc).isoformat()

                # Retrieve the latest base64 frame if available
                with frame_lock:
                    img_base64 = latest_frame_base64

                payload = {
                    "node": NODE,
                    "timestamp": ts,
                    "event_type": event_type,
                    "objects": count,
                    "label": event_type,
                    "confidence": confidence,
                    "severity": severity,
                    "raw_detections": [{"class_name": label, "confidence": confidence}],
                    "metadata": {
                        "source": "imx500_hardware_tpu",
                        "node": NODE,
                    },
                }
                if img_base64:
                    payload["image_base64"] = img_base64

                try:
                    client.publish(TOPIC_EVENTS, json.dumps(payload))
                    print(
                        f"[{datetime.now().strftime('%H:%M:%S')}] Published hardware detection event: {event_type} (count: {count}, conf: {confidence}))"
                    )
                except Exception as e:
                    print(f"Error publishing detection event: {e}")


def main():
    global latest_frame_base64

    print(f"Connecting to MQTT broker at {BROKER}:{PORT}...")
    try:
        client.connect(BROKER, PORT, 60)
    except Exception as e:
        print(f"Fatal error connecting to broker: {e}")
        sys.exit(1)

    client.loop_start()

    # Launch rpicam-vid 
    cmd = [
        "rpicam-vid",
        "-t",
        "0",
        "--post-process-file",
        POST_PROCESS_FILE,
        "--nopreview",
        "-v",
        "2",
        "--codec",
        "mjpeg",
        "--width",
        "640",
        "--height",
        "480",
        "--framerate",
        str(CAMERA_FPS),
        "-o",
        "-",
    ]

    print(f"Launching command: {' '.join(cmd)}")
    try:
        process = subprocess.Popen(
            cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, bufsize=0
        )
    except FileNotFoundError:
        print(
            "Fatal error: rpicam-vid command not found. Ensure rpicam-apps is installed."
        )
        client.loop_stop()
        sys.exit(1)

    # Start the stderr parsing thread
    stderr_thread = threading.Thread(
        target=parse_stderr_detections, args=(process.stderr,), daemon=True
    )
    stderr_thread.start()

    # Read binary MJPEG frames from stdout
    buffer = bytearray()
    print("Reading MJPEG stream from rpicam-vid...")

    try:
        while True:
            data = process.stdout.read(4096)
            if not data:
                print("No data received from camera process. Exiting stream loop.")
                break

            buffer.extend(data)
            while True:
                start = buffer.find(b"\xff\xd8")
                if start == -1:
                    # Clean up buffer if no start marker is found
                    if len(buffer) > 1000000:
                        buffer.clear()
                    break

                if start > 0:
                    del buffer[:start]
                    start = 0

                end = buffer.find(b"\xff\xd9", start)
                if end == -1:
                    break

                # Extract the full JPEG frame
                frame_bytes = bytes(buffer[start : end + 2])
                del buffer[: end + 2]

                # Base64 encode the frame
                base64_frame = base64.b64encode(frame_bytes).decode("utf-8")

                # Store as the latest frame for detection events
                with frame_lock:
                    latest_frame_base64 = base64_frame

                # Publish stream frame to MQTT
                stream_payload = {
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "fps": CAMERA_FPS,
                    "node": NODE,
                    "image": base64_frame,
                }
                try:
                    client.publish(TOPIC_STREAM, json.dumps(stream_payload))
                except Exception as e:
                    print(f"Error publishing stream frame: {e}")

    except KeyboardInterrupt:
        print("\nShutting down AI sensor node cleanly...")
    finally:
        process.terminate()
        try:
            process.wait(timeout=2)
        except subprocess.TimeoutExpired:
            process.kill()
        client.loop_stop()
        client.disconnect()
        print("Shutdown complete.")


if __name__ == "__main__":
    main()
