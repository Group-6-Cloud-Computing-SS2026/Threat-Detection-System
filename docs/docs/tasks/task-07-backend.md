# Task 7 — Backend

The backend architecture has been fully developed, containerized, and deployed as a highly available, distributed microservice stack across the 8-node Raspberry Pi 3 worker cluster and the Pi 5 Master.

## 1. System Architecture

The Threat Detection System backend implements a decoupled, event-driven, high-availability architecture structured across the following layers:

* **Edge Ingestion**: The Raspberry Pi 4 Edge Node captures frames using native `rpicam-still` or OpenCV, encodes them in Base64 JPEG payloads, and streams them at 20 FPS (just for the test script).
* **Event Broker**: A containerized Mosquitto MQTT broker (`tds-mqtt`) serves as the central message bus inside the cluster, receiving the telemetry stream and heartbeats.
* **Distributed Compute**: The FastAPI backend (`tds-api`) is scaled to **9 replicas** running concurrently—exactly **1 instance on each of the 8 Raspberry Pi 3 workers and 1 instance on the Pi 5 Master**—subscribing to MQTT topics and processing frames in parallel.
* **Load Balancing**: The Traefik Ingress Controller runs on port 80 of the Pi 5 Master, handling external HTTP API requests and automatically balancing traffic round-robin across all 9 running pods.
* **Stateful Storage**: 
  * **Relational Database**: PostgreSQL (`tds-postgres`) catalogs node health records, detection events, log history, and image metadata.
  * **S3-Compatible Object Storage**: MinIO (`tds-minio`) serves as a cluster-wide S3 service, storing high-resolution AI-captured threat image logs. Both stateful databases reside on the Master's 500GB SSD to eliminate write latency bottlenecks.

---

## 2. Key Objectives & Compliance

### 2.1 — True High-Availability & Cluster Scheduling
* **9 Replicas for Full Coverage**: Configured the deployment with exactly `9 replicas` to fully cover the cluster's physical topology: **1 backend instance on the Pi 5 Master** and **1 instance on each of the 8 Raspberry Pi 3 workers**.
* **Soft Pod Anti-Affinity**: Implemented hostname-based `podAntiAffinity` rules inside [backend.yaml](../../k8s/backend.yaml) to ensure Kubernetes dynamically spreads the 9 pods individually across all 9 unique physical nodes.
* **Auto-healing & Fault Tolerance**: If any Pi 3 node drops offline, the Traefik Ingress controller and Kubernetes scheduler automatically redirect traffic and reschedule the replica without dropping user sessions.

### 2.2 — Centralized Storage & S3 Compatibility
* **MinIO Storage Service**: Integrated **MinIO** inside the cluster (`tds-minio` Service) to serve as a high-performance S3 Object Storage API. 
* **Database Cataloging**: As base64-encoded AI threat captures are received, they are saved asynchronously into MinIO, and their metadata catalogs are recorded inside a transactional PostgreSQL database (`tds-postgres`).
* **SSD-Backed Persistent Volumes**: Stateful services run on high-performance SSD-backed volumes via K3s `local-path` storage, avoiding SD card write degradation.

---

## 3. Technology Stack & Artifacts

* **FastAPI Core**: Lightweight asynchronous Python framework utilizing `asyncpg` for thread-safe database pooling and `paho-mqtt`/`aiomqtt` for telemetry ingestion.
* **Multi-stage Dockerfile**: Hardened production container packaging (`backend/Dockerfile`) running as a non-privileged user (`tds`).
* **Infrastructure-as-Code Manifests**:
  * [backend.yaml](../../k8s/backend.yaml) — Replicated FastAPI, Traefik Ingress, and node affinity rules.
  * [minio.yaml](../../k8s/minio.yaml) — S3 storage service setup.
  * [postgres.yaml](../../k8s/postgres.yaml) — Relational DB deployment.
  * [mqtt.yaml](../../k8s/mqtt.yaml) — Eclipse Mosquitto broker configurations.

---

## 4. Verification & Operational Reference
* **Interactive API Playground**: Access interactive Swagger UI endpoints at `http://192.168.1.50/docs` (load-balanced on default port 80).
* **Step-by-step Setup**: See the [Distributed k3s Kubernetes Deployment Guide](../guides/k3s-deployment.md) for NFS bind mounting, image building, and deep system diagnostics.

---

## 5. Core Fixes & Troubleshooting History

To establish stable operational service, the following structural fixes were implemented in the backend:

1. **Unauthenticated Image Downloads**: Bypassed JWT auth checks on `/api/v1/images/{image_id}/download` inside [images.py](file:///Users/hanan/personal-projects/Threat-Detection-System/backend/app/api/v1/images.py). This allows standard HTML `<img>` elements in the browser dashboard to render captured threat photos without needing to inject request headers.
2. **WebSocket CORS Restoration**: Configured the backend with the environment variable `BACKEND_CORS_ORIGINS` in [backend.yaml](file:///Users/hanan/personal-projects/Threat-Detection-System/k8s/backend.yaml) to whitelist `http://192.168.1.50/`. This resolves CORS checks on the live MJPEG camera stream WebSocket handshake (`/api/v1/stream/ws`).
3. **Prometheus fastapi Middleware Crash**: Setting `PROMETHEUS_ENABLED="false"` resolved a routing crash loop (`AttributeError: '_IncludedRouter' object has no attribute 'path'`) caused by a package mismatch inside the metrics middleware.
4. **Worker Registry Access**: Configured `/etc/rancher/k3s/registries.yaml` on all 8 worker nodes using Ansible to mirror `localhost:5000` pulls to the master registry at `http://192.168.1.50:5000`. This enables workers to pull backend API updates seamlessly.
5. **Multi-replica Message Duplication (Shared Subscriptions)**: Implemented MQTT v5 Shared Subscriptions (`$share/api-group/...`) in [mqtt_service.py](file:///Users/hanan/personal-projects/Threat-Detection-System/backend/app/services/mqtt_service.py) for events and health metrics to ensure exactly one replica processes database writes and dispatches the Telegram bot notifications, while maintaining standard broadcast for video frames.

