#!/bin/bash
# AI Sensor Node - publishes structured detection events and live stream to cluster

echo "Starting AI Sensor Node wrapper..."
if [ -d "/home/cc123/tds-edge-venv" ]; then
    /home/cc123/tds-edge-venv/bin/python3 -u "$(dirname "$0")/sensor_node.py"
elif [ -d "$(dirname "$0")/tds-edge-venv" ]; then
    "$(dirname "$0")/tds-edge-venv/bin/python3" -u "$(dirname "$0")/sensor_node.py"
else
    python3 -u "$(dirname "$0")/sensor_node.py"
fi
