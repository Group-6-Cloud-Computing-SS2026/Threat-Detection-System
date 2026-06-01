import time
import json
import base64
import os
import subprocess
from datetime import datetime, timezone
import paho.mqtt.client as mqtt

MQTT_BROKER = "192.168.1.50"  # Pi 5 Master IP
MQTT_PORT = 1883
STREAM_TOPIC = "cluster/camera/stream"

# Target resolution for fast network transmission over standard 100Mbps Ethernet
WIDTH = 320
HEIGHT = 240
QUALITY = 70  # JPEG compression quality percentage

# Attempt to initialize OpenCV
camera_backend = None
cap = None

try:
    import cv2
    cap = cv2.VideoCapture(0)
    if cap.isOpened():
        cap.set(cv2.CAP_PROP_FRAME_WIDTH, WIDTH)
        cap.set(cv2.CAP_PROP_FRAME_HEIGHT, HEIGHT)
        camera_backend = "opencv"
        print("✅ OpenCV camera backend successfully initialized.")
    else:
        cap.release()
        cap = None
        print("⚠️ OpenCV camera capture failed to open. Falling back to libcamera-still shell utility.")
except ImportError:
    print("⚠️ OpenCV library not found in Python environment. Falling back to libcamera-still shell utility.")

camera_command = None

if camera_backend is None:
    # Check for native Pi Camera CLI tools — rpicam-still (Pi Camera 3 / IMX500) or libcamera-still
    # These bypass the V4L2 lock entirely and talk directly to the CSI/GPU interface.
    for cmd in ["rpicam-still", "libcamera-still"]:
        try:
            subprocess.run(["which", cmd], check=True, stdout=subprocess.DEVNULL)
            camera_command = cmd
            camera_backend = "rpicam" if cmd == "rpicam-still" else "libcamera"
            print(f"✅ Verified native Pi Camera command: {cmd}")
            break
        except (subprocess.CalledProcessError, FileNotFoundError):
            continue

if camera_backend is None:
    print("❌ Fatal: Neither OpenCV nor native camera utilities (rpicam-still, libcamera-still) are available.")
    exit(1)

def capture_frame():
    """Captures a frame from the real camera and returns it as a Base64 JPEG string."""
    if camera_backend == "opencv":
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
        
    elif camera_backend in ["rpicam", "libcamera"]:
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
    print("LIVE EDGE CAMERA STREAM ACTIVE [10 FPS]")
    print(f"Streaming REAL camera frames to topic: {STREAM_TOPIC}")
    print(f"Active Backend: {camera_backend.upper()}")
    print("Press Ctrl+C to terminate the stream.")
    print("-----------------------------------------------------------\n")
    
    fps = 10
    interval = 1.0 / fps
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
                    "fps": fps,
                    "image": base64_frame
                }
                client.publish(STREAM_TOPIC, json.dumps(payload))
                
                frameCount += 1
                if frameCount % 30 == 0:
                    print(f"[{datetime.now().strftime('%H:%M:%S')}] Active: Sent {frameCount} frames.")
            
            # Wait for next frame maintaining exact 10 FPS
            t_elapsed = time.time() - t_start
            t_sleep = max(0, interval - t_elapsed)
            time.sleep(t_sleep)
            
    except KeyboardInterrupt:
        print("\nShutting down camera publisher cleanly.")
    finally:
        if cap is not None:
            cap.release()
        client.loop_stop()
