# K3s Backend API Access - Swagger Documentation

## ✅ Current Status: K3s is Running!

Your entire Threat Detection System is **deployed on K3s** on the Pi5 cluster:

```
tds-api:      9 replicas running across cluster nodes
tds-postgres: 1 replica (pi5-master)
tds-minio:    4 replicas (distributed)
tds-mqtt:     1 replica (pi5-master)
```

---

## Accessing the API

### From Your Workstation (External)

**Check the external service:**
```bash
ssh cc123@192.168.1.50 kubectl get svc tds-api -o wide
```

Then access at the LoadBalancer/NodePort:
```
http://192.168.1.50:PORT/docs
```

### From Pi5 Master (Internal)

**Direct access to K3s service:**
```bash
# Via ClusterIP DNS
curl http://tds-api:8001/api/v1/detections

# Via service IP
kubectl get svc tds-api
curl http://<SERVICE-IP>:8001/api/v1/detections
```

### Your Network

```
┌─ Pi5 Master (192.168.1.50) - K3s Control Plane
│  ├─ tds-api:8001 (9 replicas across workers)
│  ├─ tds-postgres (pi5-master)
│  ├─ tds-minio (distributed)
│  └─ tds-mqtt (pi5-master)
│
└─ External Access
   └─ Via LoadBalancer/Ingress/NodePort
```

---

## How to Test from Pi5

### Quick Answer: 3 Ways

#### 1. Inside K3s Cluster ⚡ (Fastest)

```bash
ssh cc123@192.168.1.50

# Test via internal DNS
curl http://tds-api:8001/api/v1/detections/recent

# Or test via ClusterIP
kubectl get svc tds-api
curl http://<ClusterIP>:8001/api/v1/detections/recent
```

#### 2. Via K3s Service NodePort

```bash
ssh cc123@192.168.1.50

# Check what port tds-api is exposed on
kubectl get svc tds-api -o wide

# Then from your workstation
curl http://192.168.1.50:NODEPORT/api/v1/detections
```

#### 3. Via LoadBalancer (If configured)

```bash
ssh cc123@192.168.1.50
kubectl get svc tds-api

# If type=LoadBalancer, it will show EXTERNAL-IP
# Access from anywhere:
curl http://EXTERNAL-IP:8001/api/v1/detections
```

---

## Why Not Just Use 192.168.10.144?

✅ **Actually, use 192.168.1.50** - Your backend is on the K3s cluster on Pi5, not Docker Compose on your workstation!

The previous documentation was assuming Docker Compose deployment. Your **production system is running on K3s** at `192.168.1.50`.

---

## For Your Current Setup (K3s)

### Accessing Swagger UI

**From Your Workstation (external access):**

First, find the exposed port:
```bash
ssh cc123@192.168.1.50
kubectl get svc tds-api -o wide
# Note the NodePort or EXTERNAL-IP
```

Then access:
```
http://192.168.1.50:NODEPORT/docs
```

**From Pi5 (internal access):**
```bash
ssh cc123@192.168.1.50

# Via service DNS (fastest)
curl http://tds-api:8001/api/v1/detections

# Or Swagger UI internally
http://localhost:8001/docs  # If you have port-forward
```

### Running Edge Camera Publisher

**Important:** Use 192.168.1.50 (K3s MQTT broker)

```bash
# ✅ CORRECT - K3s cluster
python3 edge_camera_publisher.py --broker 192.168.1.50

# ❌ WRONG - old Docker Compose location
python3 edge_camera_publisher.py --broker 192.168.10.144
```

---

## Complete Testing Workflow (K3s)

### Terminal 1: Monitor MQTT Messages
```bash
# MQTT is running in K3s on Pi5
mosquitto_sub -h 192.168.1.50 -t 'cluster/camera/events' -v
```

### Terminal 2: Run Edge Camera Publisher
```bash
# From your machine or Pi4 - send to K3s
python3 edge_camera_publisher.py \
  --broker 192.168.1.50 \
  --enable-detections \
  --fps 5
```

### Terminal 3: Query API from Pi5
```bash
ssh cc123@192.168.1.50

# Keep polling for new events (internal K3s access)
while true; do
  curl -s http://tds-api:8001/api/v1/detections/recent?limit=3
  sleep 3
done
```

---

## Finding Your K3s Service Port

To determine how to access the API externally:

```bash
ssh cc123@192.168.1.50

# Check service type and port
kubectl get svc tds-api -o wide

# If NodePort:
kubectl get svc tds-api -o jsonpath='{.spec.ports[0].nodePort}'

# If LoadBalancer:
kubectl get svc tds-api -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
```

---

## Documentation Updates Made

✅ **CRITICAL FIX:** K3s is already running! Updated all references  
✅ [test-api-from-k3s.md](docs/docs/guides/test-api-from-k3s.md) - NEW guide for K3s testing  
✅ [test-api-from-k3s.sh](test-api-from-k3s.sh) - NEW K3s test script  
✅ Updated [stream-detection-to-database.md](docs/docs/guides/stream-detection-to-database.md) - K3s IPs  
✅ [SWAGGER_API_IP_CLARIFICATION.md](SWAGGER_API_IP_CLARIFICATION.md) - This file (K3s edition)  

---

## Next Steps

1. **Test API Access:** Run `./test-api-from-k3s.sh` from Pi5
2. **Verify Services:** `kubectl get all -l app in (tds-api, tds-postgres, tds-minio, tds-mqtt)`
3. **Check MQTT:** `kubectl logs -f -l app=tds-mqtt`
4. **Run Edge Publisher:** `python3 edge_camera_publisher.py --broker 192.168.1.50`

---

## Quick Reference (K3s)

```bash
# SSH to Pi5
ssh cc123@192.168.1.50

# Check all services
kubectl get pods -l 'app in (tds-api, tds-postgres, tds-minio, tds-mqtt)'

# Test API internally
curl http://tds-api:8001/api/v1/detections

# Get service details
kubectl get svc tds-api -o wide

# Run edge publisher (use 192.168.1.50!)
python3 edge_camera_publisher.py --broker 192.168.1.50 --enable-detections

# Monitor MQTT from Pi5
mosquitto_sub -h localhost -t 'cluster/camera/events' -v
```

