# Task 6 — AI Processing & Sensor Node Setup

This page documents the hardware configuration, native machine learning processing execution, and structured messaging sandbox setup for our remote sensor node. The objective of Task 6 was to leverage the specialized local processing acceleration of the Raspberry Pi AI Camera to perform real-time threat detection directly at the edge, rather than flooding the cluster backplane with raw video streams.

---

## 1. Sensor Node System Architecture

While the primary compute workers run as a diskless cluster infrastructure, the sensor node operates as an independent, stateful endpoint engineered for continuous field data acquisition.

### Hardware Stack Components

- **Host Compute Module:** Raspberry Pi 4 Model B.
- **Neural Accelerator Module:** Raspberry Pi AI Camera featuring an onboard **Sony IMX500** Intelligent Vision Sensor.
- **Network Interconnect:** Dedicated static lease client bound to the private Gigabit switch subnet at `192.168.1.0/24`.

```
                 LOCAL EDGE SENSOR NODE PIPELINE

   +-------------------+       +--------------------+       +----------------------+
   |  Sony IMX500      | ----> |  On-Camera Neural  | ----> | Raspberry Pi 4 Host  |
   |  Optics Module    |       |  Inference Engine  |       | Processing Layer     |
   +-------------------+       +--------------------+       +----------------------+
                                                                       |
                                                                       v
                                                            [ JSON Metadata Payload ]
                                                                       |
                                                                       v
                                                            [ MQTT Broker Dispatch ]
```

---

## 2. On-Camera Neural Inference Engine

Traditional computer vision frameworks ingest high-resolution frames across local memory buses, consuming massive host CPU cycles and creating system heat bottlenecks. Our deployment offloads this entirely to the hardware processing module.

### Local Hardware Acceleration Advantage

The Sony IMX500 sensor contains its own dedicated SRAM and hardware tensor processing cores.

1. The optics module captures raw light arrays.
2. The onboard neural accelerator runs object detection inferences **natively inside the camera module itself**.
3. Only the post-inference bounding box coordinates, class confidence levels, and metadata frames are exposed to the Raspberry Pi 4 host operating system.

---

## 3. Python Simulation Sandbox & Payload Execution

To safely validate our communication plane before locking down production detection libraries, we established a simulation sandbox. This environment mirrors the detection pipeline by compiling real-time tracking statistics into compact, structured JSON payloads and transmitting them over the network.

### Native Automated Detection Wrapper Script

The Python daemon runs as a persistent service on the Raspberry Pi 4 host, tracking objects and writing directly into the cluster's messaging pipeline:

```python
#!/usr/bin/env python3
import time
import json
import random
import paho.mqtt.client as mqtt

# Network Interconnect Properties
MQTT_BROKER = "192.168.1.50"  # Target Master Control Pi 5 Broker
MQTT_TOPIC = "cluster/sensor/detections"
NODE_ID = "sensor-node-pi4"

def connect_broker():
    client = mqtt.Client(client_id=NODE_ID)
    try:
        client.connect(MQTT_BROKER, 1883, 60)
        print(f"Successfully connected to Cluster MQTT Broker at {MQTT_BROKER}")
        return client
    except Exception as e:
        print(f"Connection failed: {e}. Retrying in 5 seconds...")
        time.sleep(5)
        return connect_broker()

def execution_loop():
    client = connect_broker()
    client.loop_start()

    try:
        while True:
            # Simulate real-time metadata evaluation loop from the IMX500 sensor
            simulated_object_count = random.choices([0, 1, 2, 3], weights=[70, 15, 10, 5])[0]

            if simulated_object_count > 0:
                # Structure raw frame info into standard JSON format
                payload = {
                    "timestamp": int(time.time()),
                    "node_id": NODE_ID,
                    "metrics": {
                        "object_count": simulated_object_count,
                        "inference_latency_ms": round(random.uniform(12.4, 18.9), 2)
                    }
                }

                # Publish the detection data to the cluster broker
                message_info = client.publish(MQTT_TOPIC, json.dumps(payload), qos=1)
                message_info.wait_for_publish()
                print(f"Dispatched Payload: {payload}")

            # Frame capture delta buffer
            time.sleep(1.0)

    except KeyboardInterrupt:
        print("\nHalting sensor simulation sandbox gracefully...")
    finally:
        client.loop_stop()
        client.disconnect()

if __name__ == "__main__":
    execution_loop()
```

---

## 4. Verification & Stream Diagnostics

To verify that telemetry data flows smoothly from the sensor node into the centralized cluster infrastructure, run these auditing steps from the Master Pi 5 node:

### 1. Inspecting Live Master MQTT Subscriptions

To confirm that the JSON packets are passing through the network layers without getting stuck, subscribe directly to the detection topic on the Master node:

```bash
mosquitto_sub -h 127.0.0.1 -t "cluster/sensor/detections" -v
```

### 2. Verifying Cluster Intake Service Logs

If the cluster backend application is active, verify that your data intake service successfully reads the incoming payloads:

```bash
sudo kubectl logs -l app=detection-receiver --tail=20
```

---

## 5. Architectural Boundaries & Phase 2 Scopes

The current infrastructure provides a flexible, model-agnostic pipeline, but carries specific design boundaries that will be addressed in upcoming modules:

- **Model Agnosticism:** The node currently executes inferences using a pre-trained out-of-the-box detection model. The custom training, optimization, and conversion workflow required to deploy our proprietary classification models is a separate task.
- **Classification Output Limits:** The initial payload maps total **object counts** but omits specific threat category descriptors (e.g., distinguishing a person from a hardware fault).
- **Payload Rate-Limiting:** To protect backend storage components from performance drops during high-activity scenarios, debouncing and rate-limiting rules will be handled downstream by the intake handlers.
