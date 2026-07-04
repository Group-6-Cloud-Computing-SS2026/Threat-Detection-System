# Testing API from K3s on Pi5 Master

Your Threat Detection System is **running on K3s** with 9 API replicas distributed across the cluster!

## Current K3s Deployment Status

```
PODS RUNNING:
✅ tds-api:      9 replicas (across cluster nodes)
✅ tds-postgres: 1 replica (pi5-master)
✅ tds-minio:    4 replicas (distributed)
✅ tds-mqtt:     1 replica (pi5-master)
```

---

## Quick Test from Pi5

### Run Auto Test Script
```bash
ssh cc123@192.168.1.50
chmod +x Threat-Detection-System/test-api-from-k3s.sh
./Threat-Detection-System/test-api-from-k3s.sh
```

This script checks:
- ✅ K3s cluster status
- ✅ Pod health
- ✅ Service discovery
- ✅ API connectivity
- ✅ Detection events
- ✅ Statistics
- ✅ MQTT broker
- ✅ Database status

---

## Manual Testing from Pi5

### 1. SSH to Pi5
```bash
ssh cc123@192.168.1.50
```

### 2. Check Deployment Status
```bash
# All TDS pods
kubectl get pods -l 'app in (tds-api, tds-postgres, tds-minio, tds-mqtt)'

# Detailed info
kubectl get pods -l 'app in (tds-api, tds-postgres, tds-minio, tds-mqtt)' -o wide
```

### 3. Test API (Internal Access)

**Via Service DNS:**
```bash
# Health check
curl http://tds-api:8001/

# Get recent detections
curl http://tds-api:8001/api/v1/detections/recent?limit=5 | jq

# Get statistics
curl http://tds-api:8001/api/v1/detections/statistics | jq

# Filter by severity
curl http://tds-api:8001/api/v1/detections?severity=critical | jq
```

**Via ClusterIP:**
```bash
# Get ClusterIP
kubectl get svc tds-api

# Use the IP
curl http://<CLUSTERIP>:8001/api/v1/detections
```

### 4. Check Service Details
```bash
# API service
kubectl get svc tds-api -o wide

# All services
kubectl get svc -l 'app in (tds-api, tds-postgres, tds-minio, tds-mqtt)'
```

---

## Access from Your Workstation

### Option 1: Port-Forward from Pi5
```bash
ssh cc123@192.168.1.50

# In one terminal - keep it running
kubectl port-forward svc/tds-api 8001:8001 &

# Then on your workstation access:
# http://localhost:8001/docs
```

### Option 2: NodePort Access
```bash
ssh cc123@192.168.1.50

# Get the NodePort
kubectl get svc tds-api -o jsonpath='{.spec.ports[0].nodePort}'

# Then from your workstation:
curl http://192.168.1.50:NODEPORT/api/v1/detections
```

### Option 3: LoadBalancer (If Configured)
```bash
ssh cc123@192.168.1.50
kubectl get svc tds-api

# If EXTERNAL-IP is assigned:
curl http://EXTERNAL_IP:8001/api/v1/detections
```

---

## Complete Testing Workflow

### Terminal 1: Monitor Logs
```bash
ssh cc123@192.168.1.50
kubectl logs -f -l app=tds-api
```

### Terminal 2: Monitor MQTT Messages
```bash
ssh cc123@192.168.1.50
mosquitto_sub -h localhost -t 'cluster/camera/events' -v
```

### Terminal 3: Send Camera Stream from Pi4/Pi5
```bash
# On Pi4 edge node or another machine
python3 edge_camera_publisher.py \
  --broker 192.168.1.50 \
  --enable-detections \
  --fps 5 \
  --sensor-id "pi4-edge-001"
```

### Terminal 4: Monitor Detection Events
```bash
ssh cc123@192.168.1.50

# Watch events in real-time
while true; do
  echo "=== $(date) ==="
  curl -s http://tds-api:8001/api/v1/detections/recent?limit=3 | jq '.[] | {event_type, severity, confidence}'
  sleep 5
done
```

---

## Swagger UI Access

### From Workstation via Port-Forward
```bash
# Terminal 1: Create port-forward
ssh cc123@192.168.1.50
kubectl port-forward svc/tds-api 8001:8001 &

# Terminal 2: Open in browser
# http://localhost:8001/docs
```

### From Pi5 Terminal (Check for issues)
```bash
ssh cc123@192.168.1.50
curl http://tds-api:8001/docs
```

---

## Database Access

### Query Detection Events
```bash
ssh cc123@192.168.1.50

# Port-forward PostgreSQL
kubectl port-forward svc/tds-postgres 5432:5432 &

# On your workstation, connect:
psql -h localhost -U tds_user -d threat_detection
# Password: tds_secret

# SQL queries
SELECT id, event_type, severity, confidence, detected_at 
FROM detection_events 
ORDER BY created_at DESC 
LIMIT 10;

# Check images
SELECT de.id as event_id, di.storage_key, di.file_size_bytes
FROM detection_events de
JOIN detection_images di ON di.detection_event_id = de.id
ORDER BY de.created_at DESC;
```

---

## MQTT Broker Access

### Monitor Messages from Pi5
```bash
ssh cc123@192.168.1.50

# Subscribe to camera events
mosquitto_sub -h localhost -t 'cluster/camera/events' -v

# Subscribe to all topics
mosquitto_sub -h localhost -t '#' -v
```

### Publish Test Message
```bash
ssh cc123@192.168.1.50

mosquitto_pub -h localhost -t 'cluster/camera/events' -m '{"node":"test","label":"person"}'
```

---

## MinIO Image Storage

### Access MinIO Dashboard
```bash
ssh cc123@192.168.1.50

# Get MinIO service info
kubectl get svc -l app=tds-minio

# Port-forward MinIO console
kubectl port-forward svc/tds-minio-console 9001:9001 &

# On your workstation:
# http://localhost:9001
# Login: admin / password123
```

---

## Troubleshooting

### API Pod Not Running
```bash
ssh cc123@192.168.1.50

# Check pod status
kubectl get pods -l app=tds-api -o wide

# View logs
kubectl logs -l app=tds-api --tail=50

# Describe pod (shows events)
kubectl describe pod <pod-name>
```

### API Slow or Unresponsive
```bash
ssh cc123@192.168.1.50

# Check resources
kubectl top pods -l app=tds-api

# Check node resources
kubectl top nodes

# Restart deployment
kubectl rollout restart deployment/tds-api
```

### Database Connection Issues
```bash
ssh cc123@192.168.1.50

# Check database logs
kubectl logs -l app=tds-postgres --tail=50

# Port-forward and test connection
kubectl port-forward svc/tds-postgres 5432:5432 &
psql -h localhost -U tds_user -d threat_detection
```

### MQTT Not Receiving Messages
```bash
ssh cc123@192.168.1.50

# Check MQTT logs
kubectl logs -l app=tds-mqtt --tail=50

# Test MQTT connectivity
mosquitto_sub -h localhost -t 'test/topic' &
mosquitto_pub -h localhost -t 'test/topic' -m 'test'
```

---

## Performance Monitoring

### View Real-Time Metrics
```bash
ssh cc123@192.168.1.50

# CPU and Memory usage
watch kubectl top pods -l 'app in (tds-api, tds-postgres, tds-minio, tds-mqtt)'

# Node usage
watch kubectl top nodes
```

### Check API Metrics
```bash
# If Prometheus is installed
curl http://tds-api:8001/api/v1/metrics
```

---

## Common Commands Reference

| Command | Purpose |
|---------|---------|
| `kubectl get pods` | List all pods |
| `kubectl get svc` | List all services |
| `kubectl logs -f <pod>` | Stream logs |
| `kubectl exec -it <pod> bash` | Shell into pod |
| `kubectl port-forward <service> <port>` | Forward port |
| `kubectl rollout restart deployment/<app>` | Restart deployment |
| `kubectl top pods` | Resource usage |

---

## Edge Publisher Configuration

Run from Pi4 or your machine with camera access:

```bash
python3 edge_camera_publisher.py \
  --broker 192.168.1.50 \
  --port 1883 \
  --enable-detections \
  --yolo-model yolov8n.pt \
  --confidence 0.5 \
  --fps 10 \
  --sensor-id "pi4-edge-camera"
```

---

## What's Running Where

| Component | Pod | Node | Service IP | Port |
|-----------|-----|------|------------|------|
| API (x9) | tds-api-* | workers + master | 10.42.x.x | 8001 |
| PostgreSQL | tds-postgres-* | pi5-master | 10.42.0.x | 5432 |
| MQTT | tds-mqtt-* | pi5-master | 10.42.0.x | 1883 |
| MinIO (x4) | tds-minio-* | distributed | 10.42.x.x | 9000 |

---

## Quick Start

```bash
# 1. SSH to Pi5
ssh cc123@192.168.1.50

# 2. Run test script
./Threat-Detection-System/test-api-from-k3s.sh

# 3. Port-forward API (if you want local access)
kubectl port-forward svc/tds-api 8001:8001 &

# 4. Access Swagger UI
# Local: http://localhost:8001/docs
# Or: http://192.168.1.50:NODEPORT/docs (after checking NodePort)
```

