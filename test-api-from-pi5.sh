#!/bin/bash
# Test Threat Detection System API from Pi5
# Usage: chmod +x test-api-from-pi5.sh && ./test-api-from-pi5.sh

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration - UPDATE THESE FOR YOUR SETUP
API_HOST="${1:-192.168.10.144}"  # Default to local workstation IP
API_PORT="${2:-8001}"
API_BASE_URL="http://${API_HOST}:${API_PORT}"
API_DOCS="$API_BASE_URL/docs"

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Threat Detection System - API Test Suite${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
echo "Testing API at: $API_BASE_URL"
echo ""

# Test 1: Health Check
echo -e "${YELLOW}[1/7] Testing API Health Check...${NC}"
response=$(curl -s -w "\n%{http_code}" "$API_BASE_URL/")
status=$(echo "$response" | tail -1)
body=$(echo "$response" | head -1)

if [ "$status" = "200" ]; then
    echo -e "${GREEN}✅ API is running${NC}"
    echo "Response: $body"
else
    echo -e "${RED}❌ API not responding (HTTP $status)${NC}"
    echo "Make sure Docker Compose is running:"
    echo "  cd backend && docker-compose up -d"
    exit 1
fi

echo ""

# Test 2: Get Recent Detections
echo -e "${YELLOW}[2/7] Fetching Recent Detections...${NC}"
response=$(curl -s -X GET \
    -H "Content-Type: application/json" \
    "$API_BASE_URL/api/v1/detections/recent?limit=5")

count=$(echo "$response" | grep -o '"id"' | wc -l)
echo "Found $count recent detection(s)"
echo "$response" | head -c 200
echo ""
echo ""

# Test 3: Get Detection Statistics
echo -e "${YELLOW}[3/7] Fetching Detection Statistics...${NC}"
stats=$(curl -s -X GET \
    -H "Content-Type: application/json" \
    "$API_BASE_URL/api/v1/detections/statistics")

total=$(echo "$stats" | grep -o '"total_events":[0-9]*' | cut -d: -f2)
echo -e "${GREEN}Total Events in Database: ${total:-0}${NC}"
echo "$stats" | head -c 300
echo ""
echo ""

# Test 4: Filter Detections by Severity
echo -e "${YELLOW}[4/7] Fetching High Severity Events...${NC}"
critical=$(curl -s -X GET \
    "$API_BASE_URL/api/v1/detections?severity=critical&limit=10")

count=$(echo "$critical" | grep -o '"severity":"critical"' | wc -l)
echo "Found $count critical event(s)"
echo ""

# Test 5: MQTT Status
echo -e "${YELLOW}[5/7] Checking MQTT Broker Connection...${NC}"
mqtt_status=$(curl -s -X GET \
    "$API_BASE_URL/api/v1/infrastructure/mqtt-status")

if echo "$mqtt_status" | grep -q "true\|connected"; then
    echo -e "${GREEN}✅ MQTT Broker is Connected${NC}"
else
    echo -e "${YELLOW}⚠️  MQTT Status: ${NC}"
fi
echo "$mqtt_status"
echo ""

# Test 6: List All Sensor Nodes
echo -e "${YELLOW}[6/7] Fetching Registered Sensor Nodes...${NC}"
sensors=$(curl -s -X GET \
    "$API_BASE_URL/api/v1/sensor-nodes")

sensor_count=$(echo "$sensors" | grep -o '"name"' | wc -l)
echo "Found $sensor_count sensor node(s)"
if [ "$sensor_count" -gt 0 ]; then
    echo "$sensors" | grep -o '"name":"[^"]*' | head -3
fi
echo ""

# Test 7: Swagger Documentation
echo -e "${YELLOW}[7/7] Swagger UI Documentation...${NC}"
echo -e "${GREEN}✅ Access Interactive API Docs at:${NC}"
echo -e "   ${YELLOW}$API_DOCS${NC}"
echo ""

# Summary
echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}Test Summary${NC}"
echo -e "${YELLOW}========================================${NC}"
echo ""
echo "📊 API Endpoint:     $API_BASE_URL"
echo "📚 Swagger Docs:     $API_DOCS"
echo "🔌 MQTT Topic:       cluster/camera/events"
echo "💾 Database:         threat_detection (PostgreSQL)"
echo "📦 Image Storage:    minio:9000 (detection-images bucket)"
echo ""
echo "🧪 Common Test Commands:"
echo ""
echo "# List all detections (paginated)"
echo "curl '$API_BASE_URL/api/v1/detections?skip=0&limit=10'"
echo ""
echo "# Filter by severity"
echo "curl '$API_BASE_URL/api/v1/detections?severity=critical'"
echo ""
echo "# Get single detection by ID"
echo "curl '$API_BASE_URL/api/v1/detections/{event_id}'"
echo ""
echo "# Get detection statistics"
echo "curl '$API_BASE_URL/api/v1/detections/statistics'"
echo ""
echo "# Monitor MQTT messages"
echo "mosquitto_sub -h 192.168.1.50 -t 'cluster/camera/events' -v"
echo ""
