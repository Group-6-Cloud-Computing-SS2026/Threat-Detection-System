import time
import json
import base64
import os
import subprocess
import argparse
from datetime import datetime, timezone
import paho.mqtt.client as mqtt

# Parse command line arguments
parser = argparse.ArgumentParser(description="Live Edge Camera Stream Publisher")
parser.add_argument("--broker", "-b", default="192.168.1.50", help="MQTT Broker IP Address")
parser.add_argument("--port", "-p", type=int, default=1883, help="MQTT Broker TCP Port")
parser.add_argument("--topic", "-t", default="cluster/camera/stream", help="MQTT Topic to publish to")
parser.add_argument("--fps", "-f", type=int, default=20, help="Target frame rate (frames per second)")
parser.add_argument("--width", "-w", type=int, default=320, help="Image width")
parser.add_argument("--height", "-g", type=int, default=240, help="Image height")
parser.add_argument("--quality", "-q", type=int, default=70, help="JPEG compression quality (1-100)")
args, unknown = parser.parse_known_args()

MQTT_BROKER = args.broker
MQTT_PORT = args.port
STREAM_TOPIC = args.topic
FPS = args.fps
WIDTH = args.width
HEIGHT = args.height
QUALITY = args.quality

# Attempt to initialize OpenCV first to achieve ultra-fast in-memory streaming (20-30 FPS)
# now that the camera device '/dev/video0' has been successfully freed of background locks.
camera_backend = None
cap = None
camera_command = None

try:
    import cv2
    cap = cv2.VideoCapture(0)
    if cap.isOpened():
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, WIDTH)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, HEIGHT)
        camera_backend = "opencv"
        print(f"✅ OpenCV camera backend successfully initialized (supporting up to {FPS} FPS).")
    else:
        cap.release()
        cap = None
        print("⚠️ OpenCV camera capture failed to open. Falling back to native system utilities.")
except ImportError:
    print("⚠️ OpenCV library not found in Python environment. Falling back to native system utilities.")

# Fallback to native Pi Camera apps if OpenCV fails or is busy
if camera_backend is None:
    for cmd in ["rpicam-still", "libcamera-still"]:
        try:
            subprocess.run(["which", cmd], check=True, stdout=subprocess.DEVNULL)
            camera_command = cmd
            camera_backend = "rpicam" if cmd == "rpicam-still" else "libcamera"
            print(f"✅ Verified native Pi Camera command fallback: {cmd}")
            break
        except (subprocess.CalledProcessError, FileNotFoundError):
            continue

if camera_backend is None:
    print("❌ Fatal: Neither OpenCV nor native camera utilities (rpicam-still, libcamera-still) are available on this system.")
    exit(1)

def capture_frame():
    """Captures a frame from the real camera and returns it as a Base64 JPEG string."""
    if camera_backend in ["rpicam", "libcamera"]:
        # Capture a fast frame using rpicam-still / libcamera-still shell command to a temporary file
        temp_file = "/tmp/stream_frame.jpg"
        cmd = [
            camera_command,
            "-t", "100",             # Allow 100ms for sensor format/exposure sync to avoid exit code 255
            "--width", str(WIDTH),
            "--height", str(HEIGHT),
            "-q", str(QUALITY),      # JPEG quality
            "-o", temp_file,
            "-n"                     # No preview window
        ]
        try:
            # Run without blocking standard output
            subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            if os.path.exists(temp_file):
                with open(temp_file, "rb") as f:
                    img_bytes = f.read()
                os.remove(temp_file)
                return base64.b64encode(img_bytes).decode("utf-8")
        except subprocess.CalledProcessError as e:
            print(f"⚠️ {camera_command} capture failed: {e}")
            return None

    elif camera_backend == "opencv":
        ret, frame = cap.read()
        if not ret:
            print("⚠️ Failed to capture frame from OpenCV.")
            return None
        
        # Resize to 320x240 if cv2.CAP_PROP didn't enforce it
        if frame.shape[1] != WIDTH or frame.shape[0] != HEIGHT:
            frame = cv2.resize(frame, (WIDTH, HEIGHT))
            
        # Encode as JPEG
        _, buffer = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), QUALITY])
        return base64.b64encode(buffer).decode("utf-8")

if __name__ == "__main__":
    client = mqtt.Client()
    print(f"Connecting to MQTT Broker on Pi 5 at {MQTT_BROKER}...")
    try:
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
    except Exception as e:
        print(f"Error connecting to MQTT Broker: {e}")
        print("Please make sure your K3s Mosquitto MQTT broker service is running on the Pi 5 Master.")
        exit(1)
        
    client.loop_start()
    
    print("\n-----------------------------------------------------------")
    print(f"LIVE EDGE CAMERA STREAM ACTIVE [{FPS} FPS]")
    print(f"Streaming REAL camera frames to topic: {STREAM_TOPIC}")
    print(f"Active Backend: {camera_backend.upper()}")
    print("Press Ctrl+C to terminate the stream.")
    print("-----------------------------------------------------------\n")
    
    interval = 1.0 / FPS
    frameCount = 0
    
    try:
        while True:
            t_start = time.time()
            
            # Capture real image from Pi 4 camera
            base64_frame = capture_frame()
            
            if base64_frame:
                # Publish JSON payload to MQTT
                payload = {
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "fps": FPS,
                    "image": base64_frame
                }
                client.publish(STREAM_TOPIC, json.dumps(payload))
                
                frameCount += 1
                if frameCount % (FPS * 3) == 0 or frameCount % 30 == 0:
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
