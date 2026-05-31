# Distributed k3s Kubernetes Deployment Guide

To satisfy production and academic requirements for a high-availability, distributed cloud-edge architecture, this guide details how to deploy the entire Threat Detection System backend onto a multi-node **k3s Kubernetes cluster** distributed across your 8 Raspberry Pi worker nodes.

---

## 1. Architectural Distribution Overview

In this deployment:
* **Storage and Broker isolation**: PostgreSQL, MinIO, and Mosquitto MQTT run as dedicated single-pod workloads backed by k3s local-path Persistent Volume Claims (retaining state across rescheduling).
* **High Availability Application Scaling**: The FastAPI web service is scaled to **3 active replicas**.
* **Anti-Affinity Distribution**: By implementing `podAntiAffinity` rules, we force Kubernetes to schedule your backend instances across **different physical worker nodes**, guaranteeing that a single hardware crash cannot take the system offline.

---

## 2. Directory Structure of Manifests

The configuration is organized under the new `k8s/` directory in the repository root:
* **`k8s/postgres.yaml`**: PVC, Single-instance deployment, and cluster Service.
* **`k8s/minio.yaml`**: Standalone S3 Object Storage with Console access on Port 9001.
* **`k8s/mqtt.yaml`**: Broker ConfigMap, message persistent storage, and Port 1883/9001 Service.
* **`k8s/backend.yaml`**: Highly available, anti-affinity API Deployment (3 pods), ClusterIP Service, and Traefik Ingress Controller configurations.

---

## 3. Step 1 — Build the Docker Image Natively on the Pi 5 Master

Since the Raspberry Pi worker nodes run on `ARM64` architecture, the Docker image must be built for `ARM64`. Because the Pi 5 Master runs on `ARM64`, you can build the image natively after SSH'ing into the Master node:

```bash
cd ~/Threat-Detection-System/backend
docker build -t localhost:5000/tds-api:latest .
```

---

## 4. Step 2 — Import the Image into k3s

If you do not have a private container registry running inside your k3s cluster, you can manually import the compiled image into the `k8s.io` namespace on the master node:

```bash
# Save image to tar archive
docker save localhost:5000/tds-api:latest -o tds-api.tar

# Import directly into k3s containerd namespace
sudo k3s ctr images import tds-api.tar
```

---

## 5. Step 3 — Apply the Kubernetes Manifests

Apply the manifests in logical dependency order (Databases, Broker, and Storage first, followed by the web application):

```bash
# 1. Navigate to the project root on your Master node
cd ~/Threat-Detection-System

# 2. Deploy Supporting State Services
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/minio.yaml
kubectl apply -f k8s/mqtt.yaml

# 3. Deploy the FastAPI Backend Application
kubectl apply -f k8s/backend.yaml
```

---

## 6. Step 4 — Verify the Distributed Scaling

Once applied, verify that Kubernetes has successfully scheduled and distributed the backend pods across the distinct Raspberry Pi worker nodes.

Run the broad pod inspect command:
```bash
kubectl get pods -o wide
```

### Expected Output Structure:
```text
NAME                            READY   STATUS    RESTARTS   AGE    IP              NODE             NOMINATED NODE
tds-postgres-7b89f8dc9c-x4h9b   1/1     Running   0          2m     10.42.0.24      pi3-worker-104   <none>
tds-minio-6b6f79dd4c-z8jkw      1/1     Running   0          2m     10.42.1.18      pi3-worker-136   <none>
tds-mqtt-5f89c8dfb9-d2qkw       1/1     Running   0          2m     10.42.2.14      pi3-worker-58    <none>
tds-api-6cd4d68b9f-b7wkw        1/1     Running   0          45s    10.42.3.9       pi3-worker-86    <none>
tds-api-6cd4d68b9f-p4kqw        1/1     Running   0          45s    10.42.4.11      pi3-worker-117   <none>
tds-api-6cd4d68b9f-v8x2b        1/1     Running   0          45s    10.42.5.3       pi3-worker-83    <none>
```

🔬 **Notice the `NODE` column**: Because of our `podAntiAffinity` rules, the 3 `tds-api` pods are running concurrently on **`pi3-worker-86`**, **`pi3-worker-117`**, and **`pi3-worker-83`**. 

If any one of these worker nodes is physically powered off, Kubernetes automatically detects the failure and reschedules a new replica on a different online Pi 3 node in seconds!

---

## 7. Step 5 — Access the Distributed API

k3s ships with the **Traefik Ingress Controller** natively. The Ingress in `backend.yaml` automatically exposes your FastAPI pods externally.

Simply open your browser and navigate to:
* Swagger UI: **`http://192.168.1.50/docs`** *(No port suffix needed! Traefik routes the standard port 80 traffic internally to port 8001 of your active backend pods)*.

Your backend is now fully distributed, load-balanced, and running in high-availability across your Raspberry Pi 3 workers! 
