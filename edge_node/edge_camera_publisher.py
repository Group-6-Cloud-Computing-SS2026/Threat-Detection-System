import time
import json
import base64
import os
import subprocess
import argparse
from datetime import datetime, timezone
import paho.mqtt.client as mqtt

# Target defaults (can be overridden by CLI arguments)
DEFAULT_BROKER = "192.168.1.50"  # Pi 5 Master IP
DEFAULT_PORT = 1883
DEFAULT_TOPIC = "cluster/camera/stream"
DEFAULT_FPS = 20
DEFAULT_WIDTH = 320
DEFAULT_HEIGHT = 240
DEFAULT_QUALITY = 70  # JPEG compression quality percentage

def parse_args():
    parser = argparse.ArgumentParser(description="Threat Detection System — Edge Camera Publisher")
    parser.add_argument("--broker", "-b", default=DEFAULT_BROKER, help="MQTT Broker IP address")
    parser.add_argument("--port", "-p", type=int, default=DEFAULT_PORT, help="MQTT Broker port")
    parser.add_argument("--topic", "-t", default=DEFAULT_TOPIC, help="MQTT topic to publish frames to")
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
            return None
        
        # Resize to target if cv2.CAP_PROP didn't enforce it
        if frame.shape[1] != args.width or frame.shape[0] != args.height:
            import cv2
            frame = cv2.resize(frame, (args.width, args.height))
            
        # Encode as JPEG
        import cv2
        _, buffer = cv2.imencode(".jpg", frame, [int(cv2.IMWRITE_JPEG_QUALITY), args.quality])
        return base64.b64encode(buffer).decode("utf-8")
        
    elif camera_backend in ["rpicam", "libcamera"]:
        temp_file = "/tmp/stream_frame.jpg"
        cmd = [
            camera_command,
            "-t", "100",             # Allow 100ms for sensor format/exposure sync to avoid exit code 255
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
                return base64.b64encode(img_bytes).decode("utf-8")
        except subprocess.CalledProcessError as e:
            print(f"⚠️ {camera_command} capture failed: {e}")
            return None

if __name__ == "__main__":
    args = parse_args()
    
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
    print(f"Streaming REAL camera frames to topic: {args.topic}")
    print(f"Active Backend: {camera_backend.upper()}")
    if camera_command:
        print(f"Native Utility: {camera_command}")
    print("Press Ctrl+C to terminate the stream.")
    print("-----------------------------------------------------------\n")
    
    interval = 1.0 / args.fps
    frameCount = 0
    
    try:
        while True:
            t_start = time.time()
            
            base64_frame = capture_frame(camera_backend, cap, camera_command, args)
            
            if base64_frame:
                payload = {
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                    "fps": args.fps,
                    "image": base64_frame
                }
                client.publish(args.topic, json.dumps(payload))
                
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
