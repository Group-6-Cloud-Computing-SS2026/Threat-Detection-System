# Testing API from Pi5 Master Node

This is the legacy Pi5 testing page. Your system is now running on **K3s**, so use [Test API from K3s](test-api-from-k3s.md) for the current workflow.

## What changed

- API is served inside the K3s cluster on Pi5, not from Docker Compose on `192.168.10.144`
- Internal service access uses `http://tds-api:8001`
- Swagger UI is easiest through `kubectl port-forward svc/tds-api 8001:8001`
- MQTT is inside the cluster, so Pi5-side tests should use `localhost` after SSHing into Pi5

## Quick replacement commands

```bash
# SSH to Pi5
ssh cc123@192.168.1.50

# Check K3s services
kubectl get pods -l 'app in (tds-api, tds-postgres, tds-minio, tds-mqtt)'
kubectl get svc tds-api -o wide

# Test API from Pi5
curl http://tds-api:8001/api/v1/detections/recent

# Watch MQTT from Pi5
mosquitto_sub -h localhost -t 'cluster/camera/events' -v
```

## Open Swagger UI

```bash
ssh cc123@192.168.1.50
kubectl port-forward svc/tds-api 8001:8001 &
# Then open http://localhost:8001/docs on your workstation
```

For the complete checklist, use [test-api-from-k3s.md](test-api-from-k3s.md).

---

## Accessing Swagger UI

### From Your Workstation
```
http://192.168.10.144:8001/docs
```

### From Pi5 via Browser (if X11 forwarding)
```bash
ssh -X cc123@192.168.1.50
firefox http://192.168.10.144:8001/docs
```

### From Pi5 via SSH Tunnel
```bash
# On your workstation
ssh -L 8080:192.168.10.144:8001 cc123@192.168.1.50

# Then open: http://localhost:8080/docs
```

---

## Production Deployment (Optional)

To deploy the backend **to K3s cluster on Pi5**, follow these steps:

### 1. Fix K3s Backend Service (LoadBalancer)

Update `k8s/backend.yaml`:
```yaml
spec:
  type: LoadBalancer  # Enable external access
  ports:
    - port: 80
      targetPort: 8001
```

### 2. Deploy to K3s
```bash
ssh cc123@192.168.1.50
cd ~/Threat-Detection-System
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/mqtt.yaml
kubectl apply -f k8s/minio.yaml

# Check status
kubectl get pods
kubectl get svc tds-api
```

### 3. Then Access from Everywhere
```bash
# API will be at: http://192.168.1.50 (LoadBalancer IP)
curl http://192.168.1.50/api/v1/detections
```

---

## Using jq for Pretty JSON Output

If `jq` is not installed:
```bash
sudo apt install -y jq
```

Then format responses:
```bash
curl http://192.168.10.144:8001/api/v1/detections | jq '.items[] | {event_type, severity, confidence}'
```

---

## Network Connectivity Check

From Pi5, verify connectivity to your workstation:

```bash
ssh cc123@192.168.1.50

# Test ping
ping -c 3 192.168.10.144

# Test port 8001
nc -zv 192.168.10.144 8001

# Test port 1883 (MQTT)
nc -zv 192.168.10.144 1883
```

---

## Troubleshooting

### API Not Responding from Pi5
```bash
# Check if backend is running on your machine
docker ps | grep tds-api

# Check firewall on your machine
# Make sure port 8001 is accessible from Pi5 network
```

### MQTT Not Working
```bash
# Verify MQTT broker is running
docker ps | grep mqtt

# Test MQTT from Pi5
mosquitto_pub -h 192.168.10.144 -t test/topic -m "Hello"
mosquitto_sub -h 192.168.10.144 -t test/topic
```

### Database Connection Failed
```bash
# Check PostgreSQL status
docker ps | grep postgres

# Test database connection from Pi5
psql -h 192.168.10.144 -U tds_user -d threat_detection
# Password: tds_secret
```

---

## Script for Automated Testing

Copy and run the test script from Pi5:

```bash
ssh cc123@192.168.1.50

# Copy test script
scp your_workstation:/path/to/test-api-from-pi5.sh .

# Run it
chmod +x test-api-from-pi5.sh
./test-api-from-pi5.sh 192.168.10.144 8001
```

