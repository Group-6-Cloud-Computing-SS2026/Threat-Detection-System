# Threat Detection System

Welcome to the documentation for the **Threat Detection System** — an edge-computing sensor network built on Raspberry Pi clusters.

## Project Overview

This project implements a complete threat detection pipeline using:

- **Sensor nodes** with Raspberry Pi 5 and AI camera modules for object detection
- **High-performance cluster** of Raspberry Pi nodes communicating via MPI
- **Backend API** built with FastAPI, deployed on a k3s Kubernetes cluster
- **Frontend dashboard** built with React + TypeScript
- **Monitoring** with Prometheus / Grafana
- **Telegram notifications** for real-time alerts

## Quick Links

| Component | Description |
|-----------|-------------|
| [Getting Started](getting-started/overview.md) | Setup instructions and prerequisites |
| [Tasks](tasks/task-01-edge-computing-infrastructure.md) | Detailed documentation for each project task |
| [Architecture](architecture.md) | System architecture and design decisions |
