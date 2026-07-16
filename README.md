# Threat Detection System

An edge-computing threat detection platform built on Raspberry Pi clusters, featuring real-time object detection, a FastAPI backend, and a React + TypeScript dashboard.

## Repository Structure

```
Threat-Detection-System/
├── frontend/          # React + TypeScript (Vite)
├── backend/           # FastAPI (Python)
├── docs/              # MkDocs Material documentation
├── .gitignore
└── README.md
```

## Quick Start

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Linux / macOS
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Documentation

```bash
cd docs
pip install -r requirements.txt
mkdocs serve
```

## Tasks

| # | Task | Description |
|---|------|-------------|
| 1 | Sensor Nodes & PXE Boot | Raspberry Pi sensor setup and PXE network boot |
| 2 | HPL Performance | Cluster benchmarking with High Performance LINPACK |
| 3 | MPI Cluster | Message Passing Interface deployment and scaling |
| 4 | Non-MPI Scaling Laws | Amdahl's & Gustafson's Law with Task Distributor |
| 5 | Monitoring | Prometheus / Grafana infrastructure monitoring |
| 6 | Model training & Deployment | Custom object detection model training |
| 7 | Backend | FastAPI service on k3s with distributed storage |
| 8 | Frontend | React dashboard on k3s |
| 9 | Telegram Notifications | Real-time alerts via Telegram Bot |
| 10 | Documentation | MkDocs online documentation & live demo |
