import time
import json
import base64
import random
from datetime import datetime, timezone
import paho.mqtt.client as mqtt

MQTT_BROKER = "192.168.1.50"  # pi 5
MQTT_PORT = 1883
SENSOR_ID = "4070c569-201d-47b3-8406-b4c097295d4a"  # THIS IS ALREADY SETUP!

DETECTION_TOPIC = f"sensors/{SENSOR_ID}/detections"
HEALTH_TOPIC = f"sensors/{SENSOR_ID}/health"

def generate_mock_image():
    """Simulates capturing an image frame and encoding it to Base64."""
    # A tiny 1x1 white pixel JPEG as base64 for lightweight test uploads
    return "/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA="

def send_simulated_detection(client):
    """Fires a mock YOLO threat detection event."""
    threats = [
        {"type": "intruder", "severity": "critical", "conf": 0.94},
        {"type": "suspicious_vehicle", "severity": "high", "conf": 0.88},
        {"type": "unattended_baggage", "severity": "medium", "conf": 0.76}
    ]
    threat = random.choice(threats)
    
    payload = {
        "sensor_id": SENSOR_ID,
        "event_type": threat["type"],
        "severity": threat["severity"],
        "confidence": threat["conf"],
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "image_base64": generate_mock_image(),
        "detections": [
            {
                "box_2d": [120, 340, 480, 640],
                "label": threat["type"],
                "confidence": threat["conf"]
            }
        ],
        "metadata": {
            "fps": 24.5,
            "inference_time_ms": 12.8,
            "ambient_light": "daylight"
        }
    }
    
    client.publish(DETECTION_TOPIC, json.dumps(payload))
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Published threat alert: {threat['type']} ({threat['severity']})")

def send_health_heartbeat(client):
    """Sends Pi 4 system stats directly into FastAPI health metrics."""
    payload = {
        "sensor_id": SENSOR_ID,
        "cpu_usage_percent": round(random.uniform(15.0, 45.0), 1),
        "memory_usage_percent": round(random.uniform(30.0, 55.0), 1),
        "disk_usage_percent": 42.1,
        "cpu_temperature_celsius": round(random.uniform(48.0, 62.0), 1),
        "uptime_seconds": int(time.monotonic()),
        "network_status": "stable",
        "inference_fps": 24.5
    }
    client.publish(HEALTH_TOPIC, json.dumps(payload))
    print(f"[{datetime.now().strftime('%H:%M:%S')}] Sent Pi 4 health heartbeat.")

# --- MAIN LOOP ---
if __name__ == "__main__":
    client = mqtt.Client()
    print(f"Connecting to MQTT Broker at {MQTT_BROKER}...")
    try:
        client.connect(MQTT_BROKER, MQTT_PORT, 60)
    except Exception as e:
        print(f"Error connecting to MQTT Broker: {e}")
        print("Please make sure Mosquitto MQTT broker is running on the Pi 5 Master.")
        exit(1)
        
    client.loop_start()
    
    print("Edge Simulator active. Sending heartbeats every 10s. Press Ctrl+C to trigger a threat manually.")
    
    heartbeat_interval = 10
    last_heartbeat = 0
    
    try:
        while True:
            current_time = time.time()
            if current_time - last_heartbeat >= heartbeat_interval:
                send_health_heartbeat(client)
                last_heartbeat = current_time
            
            # Simulate a detection event randomly every ~15 seconds
            time.sleep(1)
            if random.random() < 0.08:
                send_simulated_detection(client)
                
    except KeyboardInterrupt:
        print("\nKeyboardInterrupt detected. Manually triggering a priority security threat!")
        send_simulated_detection(client)
    finally:
        client.loop_stop()
