#!/bin/bash
# AI Sensor Node - publishes structured detection events to cluster
BROKER="192.168.1.50"
TOPIC="cluster/camera/events"
NODE="pi4-edge"

echo "Starting AI Sensor Node -> broker $BROKER topic $TOPIC"

rpicam-hello -t 0 \
  --post-process-file /home/cc123/imx500_yolo.json \
  --nopreview -v 2 2>&1 | while read -r line; do

  # Catch the detection summary line
  if echo "$line" | grep -qE "Number of objects detected: [1-9]"; then
    COUNT=$(echo "$line" | grep -oE '[0-9]+$')
    TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    # Read the very next line to extract the active label
    read -r next_line
    LABEL=$(echo "$next_line" | awk -F' : ' '{print $2}' | awk -F'\\[' '{print $1}')

    # Fallback if label extraction fails
    if [ -z "$LABEL" ]; then LABEL="unknown"; fi

    # Construct and publish the updated payload
    PAYLOAD="{\"node\":\"$NODE\",\"timestamp\":\"$TS\",\"objects\":$COUNT,\"label\":\"$LABEL\"}"
    mosquitto_pub -h "$BROKER" -t "$TOPIC" -m "$PAYLOAD"
    echo "Published: $PAYLOAD"
  fi
done

