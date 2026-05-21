# Backend Setup Guide

## Overview

This is a complete FastAPI backend implementation for the **Threat Detection System** (Tasks 7 & 9).

### Features

✅ **Real-time Threat Detection** - Intelligent classification system
✅ **Telegram Bot Notifications** - Automatic alerts for threats
✅ **Distributed Storage** - k3s PVC integration for persistence
✅ **Sensor Management** - Health tracking and heartbeat monitoring
✅ **REST API** - 20+ endpoints with full documentation
✅ **Production Ready** - Kubernetes deployment manifests included
✅ **Horizontal Scaling** - HPA support for auto-scaling
✅ **Security** - Network policies and resource limits

---

## Quick Start (Development)

### Prerequisites

- Python 3.12+
- pip/venv
- Git

### Installation

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
source venv/bin/activate  # Linux/macOS
# OR
venv\\Scripts\\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Create .env file from example
cp .env.example .env
```

### Running Locally

```bash
# Start the development server with auto-reload
uvicorn app.main:app --reload

# Server will be available at http://localhost:8000
# API documentation: http://localhost:8000/docs
# ReDoc: http://localhost:8000/redoc
```

---

## Configuration

### Environment Variables

Edit `.env` file:

```env
# Application
APP_ENV=development          # production/development
DEBUG=true                   # Enable debug mode

# Storage (Task 7)
STORAGE_ENABLED=true         # Enable persistent storage
STORAGE_PATH=/data/threats   # Storage directory path

# Threat Detection
THREAT_SENSITIVITY=0.7       # Detection sensitivity (0-1)
CRITICAL_THRESHOLD=0.95      # Critical alert threshold
HIGH_THRESHOLD=0.85          # High alert threshold
MEDIUM_THRESHOLD=0.70        # Medium alert threshold

# Telegram (Task 9)
TELEGRAM_ENABLED=false
TELEGRAM_BOT_TOKEN=your-token
TELEGRAM_CHAT_ID=your-chat-id
```

### Setting Up Telegram Bot (Task 9)

1. **Create a Telegram Bot**
   - Open Telegram and search for `@BotFather`
   - Send `/newbot` command
   - Follow the setup wizard
   - Copy the bot token

2. **Get Your Chat ID**
   - Send `/start` to your bot
   - Message `@userinfobot` to get your user ID
   - Use this as `TELEGRAM_CHAT_ID`

3. **Update .env**
   ```env
   TELEGRAM_ENABLED=true
   TELEGRAM_BOT_TOKEN=<bot-token>
   TELEGRAM_CHAT_ID=<chat-id>
   ```

---

## API Endpoints

### Health & Info

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Root endpoint with API info |
| GET | `/health` | Kubernetes health probe |
| GET | `/status` | Current system status |
| GET | `/statistics` | System statistics |

### Threat Detection (Task 7)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/threats/detect` | Detect and classify threat |
| GET | `/threats` | List all threats (filterable) |
| GET | `/threats/{threat_id}` | Get specific threat |
| PATCH | `/threats/{threat_id}/acknowledge` | Acknowledge threat |
| PATCH | `/threats/{threat_id}/resolve` | Mark as resolved |

### Sensor Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/sensors/heartbeat` | Sensor health heartbeat |
| GET | `/sensors/active` | List active sensors |

---

## Example Usage

### Detect a Threat

```bash
curl -X POST "http://localhost:8000/threats/detect" \
  -H "Content-Type: application/json" \
  -d '{
    "sensor_id": "pi-cam-01",
    "object_type": "weapon",
    "confidence": 0.95,
    "location": "Building A - Room 101",
    "image_url": "https://example.com/image.jpg"
  }'
```

### Get Threats

```bash
# Get all threats
curl http://localhost:8000/threats

# Filter by severity
curl "http://localhost:8000/threats?threat_level=CRITICAL"

# Get unresolved threats
curl "http://localhost:8000/threats?resolved=false"
```

### Sensor Heartbeat

```bash
curl -X POST "http://localhost:8000/sensors/heartbeat" \
  -H "Content-Type: application/json" \
  -d '{
    "sensor_id": "pi-cam-01",
    "status": "active",
    "cpu_usage": 45.5,
    "memory_usage": 62.3,
    "temperature": 52.1
  }'
```

---

## Deployment on k3s (Task 7)

### Prerequisites

- k3s cluster running on Raspberry Pi nodes
- kubectl configured
- Docker image built: `threat-detection-backend:latest`

### Build Docker Image

```bash
cd backend
docker build -t threat-detection-backend:latest .

# Load to k3s (if using local registry)
docker load < threat-detection-backend.tar
```

### Deploy to k3s

```bash
# Apply manifests
kubectl apply -f k3s-deployment.yaml

# Verify deployment
kubectl get pods -n threat-detection
kubectl get svc -n threat-detection
kubectl get pvc -n threat-detection

# Check logs
kubectl logs -n threat-detection -l app=threat-detection-backend --tail=100 -f

# Port forward for testing
kubectl port-forward -n threat-detection svc/threat-detection-backend 8000:8000
```

### Scaling

The deployment includes HPA (Horizontal Pod Autoscaler):
- Minimum replicas: 2
- Maximum replicas: 10
- CPU threshold: 70%
- Memory threshold: 80%

```bash
# Monitor HPA status
kubectl get hpa -n threat-detection -w
```

### Ingress Configuration

Update the ingress hostname in `k3s-deployment.yaml`:

```yaml
- host: your-domain.local
  http:
    paths:
    - path: /
      pathType: Prefix
```

---

## Storage (Task 7)

### Distributed Storage

- **Type**: PersistentVolumeClaim (PVC)
- **Location**: `/data/threats` inside container
- **Size**: 10Gi (configurable)
- **Access**: ReadWriteMany for multi-replica consistency

### Storage Backends

For k3s on Raspberry Pi:

#### Option 1: Local Storage
```yaml
storageClassName: local-path
```

#### Option 2: SeaweedFS (Recommended)
```bash
helm repo add seaweedfs https://seaweedfs.github.io/seaweedfs/helm
helm install seaweedfs seaweedfs/seaweedfs -n threat-detection
```

#### Option 3: MinIO S3
```bash
helm repo add minio https://charts.min.io
helm install minio minio/minio -n threat-detection
```

---

## Monitoring

### Logs

```bash
# Watch real-time logs
kubectl logs -n threat-detection -l app=threat-detection-backend -f

# Get previous logs (crashed pod)
kubectl logs -n threat-detection <pod-name> --previous
```

### Metrics

Exposed on `/statistics` endpoint:
- Total threats detected
- Threats by severity
- Active sensors
- Storage usage
- System uptime

### Health Probes

- **Liveness Probe**: `/health` (restarts pod if unhealthy)
- **Readiness Probe**: `/health` (removes from load balancer if not ready)

---

## Troubleshooting

### Pod Won't Start

```bash
# Check events
kubectl describe pod <pod-name> -n threat-detection

# Check logs
kubectl logs <pod-name> -n threat-detection
```

### Storage Issues

```bash
# Check PVC status
kubectl get pvc -n threat-detection

# Describe PVC
kubectl describe pvc threats-storage-pvc -n threat-detection
```

### Telegram Notifications Not Working

1. Verify tokens in secrets:
   ```bash
   kubectl get secret backend-secrets -n threat-detection -o yaml
   ```

2. Check application logs for errors

3. Test Telegram API:
   ```bash
   curl "https://api.telegram.org/bot<TOKEN>/getMe"
   ```

---

## Testing

### Unit Tests

```bash
pip install pytest pytest-asyncio
pytest tests/ -v
```

### Integration Tests

```bash
# Start server
uvicorn app.main:app --reload

# In another terminal
cd tests
python -m pytest integration/ -v
```

### Load Testing

```bash
pip install locust

locust -f tests/load_test.py --host=http://localhost:8000
```

---

## Development

### Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application
│   ├── config.py            # Configuration
│   ├── models.py            # Pydantic models
│   ├── threat_detector.py   # Threat classification
│   ├── notifications.py     # Telegram Bot (Task 9)
│   └── storage.py           # Distributed storage (Task 7)
├── k3s-deployment.yaml      # Kubernetes manifests
├── Dockerfile
├── requirements.txt
├── .env.example
└── README_SETUP.md
```

### Adding New Features

1. Define models in `app/models.py`
2. Implement logic in appropriate module
3. Add endpoints in `app/main.py`
4. Update `requirements.txt` if needed
5. Test locally before deployment

---

## Security

- **Environment Variables**: Use Kubernetes Secrets for sensitive data
- **Network Policies**: Restrict traffic between pods
- **Resource Limits**: Prevent resource exhaustion
- **CORS**: Configured for production use
- **Input Validation**: Pydantic models validate all input

---

## Performance Optimization

- **Async/Await**: Non-blocking operations
- **Connection Pooling**: Reuse HTTP connections
- **Caching**: Store frequently accessed data
- **Horizontal Scaling**: HPA automatically scales based on load

---

## Links & Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Pydantic Documentation](https://docs.pydantic.dev/)
- [k3s Documentation](https://docs.k3s.io/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Kubernetes Documentation](https://kubernetes.io/docs/)

---

## Support & Issues

For issues or questions:
1. Check logs: `kubectl logs -n threat-detection <pod>`
2. Verify configuration: `kubectl describe deployment threat-detection-backend -n threat-detection`
3. Check Telegram setup if notifications fail
4. Verify storage is mounted: `kubectl exec -it <pod> -n threat-detection -- ls -la /data/threats`

---

**Last Updated**: 2026-05-21
**Version**: 1.0.0
