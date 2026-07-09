#!/bin/bash
# AI Sensor Node - publishes structured detection events and live stream to cluster
# Launches the Python wrapper which handles both the binary MJPEG stream and text detection logs.

echo "Starting AI Sensor Node wrapper..."
python3 "$(dirname "$0")/sensor_node.py"
