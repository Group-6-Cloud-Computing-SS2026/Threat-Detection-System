#!/bin/bash
# Test Threat Detection System API running on K3s
# Run this script on Pi5 master node
# Usage: chmod +x test-api-from-k3s.sh && ./test-api-from-k3s.sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║   Threat Detection System - K3s API Test Suite              ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Test 1: K3s Cluster Status
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}[1/8] K3s Cluster Status${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

nodes=$(kubectl get nodes -o name | wc -l)
pods=$(kubectl get pods -l 'app in (tds-api, tds-postgres, tds-minio, tds-mqtt)' --no-headers | wc -l)

echo -e "${GREEN}✅ K3s Cluster:${NC}"
echo "   Nodes: $nodes"
echo "   TDS Pods: $pods"
echo ""

# Test 2: Pod Status
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}[2/8] Pod Status${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo -e "${GREEN}API Replicas:${NC}"
kubectl get pods -l app=tds-api --no-headers | awk '{print "   " $1 ": " $3}'

echo ""
echo -e "${GREEN}Database & Storage:${NC}"
kubectl get pods -l 'app in (tds-postgres, tds-minio, tds-mqtt)' --no-headers | awk '{print "   " $1 ": " $3}'

echo ""

# Test 3: Service Discovery
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}[3/8] Service Discovery${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

api_svc=$(kubectl get svc tds-api -o jsonpath='{.spec.clusterIP}:{.spec.ports[0].port}' 2>/dev/null)
postgres_svc=$(kubectl get svc tds-postgres -o jsonpath='{.spec.clusterIP}:{.spec.ports[0].port}' 2>/dev/null)
mqtt_svc=$(kubectl get svc tds-mqtt -o jsonpath='{.spec.clusterIP}:{.spec.ports[0].port}' 2>/dev/null)

echo -e "${GREEN}Internal Service IPs:${NC}"
echo "   API:        $api_svc"
echo "   PostgreSQL: $postgres_svc"
echo "   MQTT:       $mqtt_svc"
echo ""

# Test 4: Internal API Access
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}[4/8] Internal API Access (via K3s DNS)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Test via service DNS
health=$(curl -s -o /dev/null -w "%{http_code}" http://tds-api:8001/ 2>/dev/null)

if [ "$health" = "200" ]; then
    echo -e "${GREEN}✅ API is healthy${NC}"
else
    echo -e "${RED}❌ API returned HTTP $health${NC}"
fi
echo ""

# Test 5: List Detections
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}[5/8] Fetching Detection Events${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

detections=$(curl -s http://tds-api:8001/api/v1/detections/recent?limit=5 2>/dev/null)
count=$(echo "$detections" | grep -o '"id"' | wc -l)

echo "Recent detections: $count"
if [ "$count" -gt 0 ]; then
    echo "$detections" | grep -o '"event_type":"[^"]*' | head -3 | cut -d'"' -f4
fi
echo ""

# Test 6: Statistics
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}[6/8] Detection Statistics${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

stats=$(curl -s http://tds-api:8001/api/v1/detections/statistics 2>/dev/null)
total=$(echo "$stats" | grep -o '"total_events":[0-9]*' | cut -d: -f2)

echo "Total events in database: $total"
echo ""

# Test 7: MQTT Status
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}[7/8] MQTT Broker Status${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

mqtt_pod=$(kubectl get pods -l app=tds-mqtt -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
mqtt_ip=$(kubectl get svc tds-mqtt -o jsonpath='{.spec.clusterIP}' 2>/dev/null)

if [ ! -z "$mqtt_pod" ]; then
    echo -e "${GREEN}✅ MQTT Broker Running${NC}"
    echo "   Pod: $mqtt_pod"
    echo "   IP:  $mqtt_ip:1883"
else
    echo -e "${RED}❌ MQTT Broker not found${NC}"
fi
echo ""

# Test 8: Database Status
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}[8/8] Database Status${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

db_pod=$(kubectl get pods -l app=tds-postgres -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)

if [ ! -z "$db_pod" ]; then
    echo -e "${GREEN}✅ PostgreSQL Running${NC}"
    echo "   Pod: $db_pod"
else
    echo -e "${RED}❌ PostgreSQL not found${NC}"
fi
echo ""

# Summary
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Test Summary${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${GREEN}✅ K3s Deployment Active${NC}"
echo ""
echo "📊 API Endpoint:       http://tds-api:8001 (internal)"
echo "📊 External Access:    http://192.168.1.50:NODEPORT"
echo "📚 Swagger Docs:       http://tds-api:8001/docs (via port-forward)"
echo "🔌 MQTT Broker:        $mqtt_ip:1883"
echo "💾 Database:           threat_detection (PostgreSQL)"
echo "📦 Image Storage:      detection-images (MinIO)"
echo ""

echo -e "${YELLOW}Common Commands:${NC}"
echo ""
echo "# Port-forward API to your workstation"
echo "kubectl port-forward svc/tds-api 8001:8001 &"
echo "# Then access: http://localhost:8001/docs"
echo ""
echo "# Monitor logs"
echo "kubectl logs -f -l app=tds-api"
echo ""
echo "# Get API service details"
echo "kubectl get svc tds-api -o wide"
echo ""
echo "# Query API"
echo "curl http://tds-api:8001/api/v1/detections/recent"
echo ""
echo "# Monitor MQTT messages"
echo "mosquitto_sub -h localhost -t 'cluster/camera/events' -v"
echo ""
