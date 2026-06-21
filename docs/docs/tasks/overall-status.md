---
title: "Overall Tasks Status"
nav_order: 0
---

# 📋 Overall Tasks Status

Welcome to the project task board and status overview. This dashboard lists all key milestones, design decisions, work packages, lead developers, and live progress indicators for the **Threat Detection System** edge-computing cluster.

---

## 🛠️ Tasks Progress Matrix

The following table summarizes the work packages defined for this project, who is taking the lead, and their current completion status. Other team members should fill in their respective tasks.

| Task | Category | Lead Developer | Status | Core Focus / Deliverables |
|---|---|---|---|---|
| **Task 1** | [Edge Infrastructure](task-01-edge-computing-infrastructure.md) | - | - | - |
| **Task 2** | [HPL Performance](task-02-hpl.md) | - | - | - |
| **Task 3** | [MPI Cluster](task-03-mpi.md) | - | - | - |
| **Task 4** | [Non-MPI Scaling](task-04-scaling-laws.md) | - | - | - |
| **Task 5** | [Monitoring](task-05-monitoring.md) | - | - | - |
| **Task 6** | [Model Training](task-06-model-training.md) | **Muhammad Musfir** | Almost Done (optional model optimization remains) | YOLO11n/YOLO8n python scripts and weights, Roboflow dataset, YOLO8n  RPI4 configuration and performance metrics|
| **Task 7** | [Backend](task-07-backend.md) | **Abdul Hanan Javaid** | Almost Done | FastAPI service-repository backend, 9 replicas on K3s, and distributed MinIO S3 storage. |
| **Task 8** | [Frontend](task-08-frontend.md) | - | - | - |
| **Task 9** | [Telegram Bot](task-09-telegram.md) | - | - | - |
| **Task 10** | Documentation | Complete Team | In Progress | Static site with Material theme, automated builds, and GitHub Pages hosting. |

---

## 🔍 Task-by-Task Details

---

### Task 1 — Sensor Nodes & PXE Boot Setup
*   **Lead Developer:** -
*   **Proposed Approach & Solution:**
    *   
*   **Current Work Status:**
    *   -

---

### Task 2 — HPL Benchmarking
*   **Lead Developer:** -
*   **Proposed Approach & Solution:**
    *   
*   **Current Work Status:**
    *   -

---

### Task 3 — MPI Cluster & Computing Laws
*   **Lead Developer:** -
*   **Proposed Approach & Solution:**
    *   
*   **Current Work Status:**
    *   -

---

### Task 4 — Non-MPI Scaling Laws (Task Distributor)
*   **Lead Developer:** -
*   **Proposed Approach & Solution:**
    *   
*   **Current Work Status:**
    *   -

---

### Task 5 — Infrastructure Monitoring
*   **Lead Developer:** -
*   **Proposed Approach & Solution:**
    *   
*   **Current Work Status:**
    *   -

---

### Task 6 — Model Training & Conversion
*   **Lead Developer:** -
*   **Proposed Approach & Solution:**
    *   
*   **Current Work Status:**
    *   -

---

### Task 7 — Develop a backend to manage the sensor nodes and the collected data
*   **Lead Developer:** Abdul Hanan Javaid
*   **Proposed Approach & Solution:**
    *   **Service-Repository Architecture:** Implement a clean Service-Repository pattern in Python/FastAPI to separate core business logic (such as CRUD operations, health checks, and notifications) from the database layer, utilizing SQL connection pooling and schema data validation.
    *   **K3s Kubernetes Deployment:** Package the backend as a lightweight Docker container and deploy it under K3s scaled to **9 replicas** to ensure cluster-wide coverage.
    *   **High Availability & Load Balancing:** Apply host-based pod anti-affinity rules to guarantee physical distribution across Raspberry Pi nodes. Route client requests via the Traefik Ingress controller on the Master for automatic round-robin load balancing.
    *   **Distributed MinIO S3 Storage:** Set up a 4-node distributed MinIO StatefulSet using erasure coding to aggregate local volumes across 4 physical nodes, guaranteeing data redundancy and hardware-level fault tolerance.
    *   **NFS Boot Workarounds:** Enable execution on diskless, network-booted workers by extending the Kubelet runtime request timeout (allowing slow image copying under containerd's native snapshotter over local Ethernet) and configuring MinIO to bypass Direct I/O and root-drive device checks on NFS mounts.
*   **Current Work Status:**
    *   **Almost Completed.** The microservice backend is containerized and deployed under K3s orchestration. Traefik load-balances HTTP requests, PostgreSQL tracks metadata, and the 4-node erasure-coded distributed MinIO cluster is fully formatted and operational.

---

### Task 8 — React Dashboard Frontend
*   **Lead Developer:** -
*   **Proposed Approach & Solution:**
    *   
*   **Current Work Status:**
    *   -

---

### Task 9 — Telegram Bot Alerts
*   **Lead Developer:** -
*   **Proposed Approach & Solution:**
    *   
*   **Current Work Status:**
    *   -

---

### Task 10 — Project Documentation
*   **Lead Developer:** Complete Team
*   **Proposed Approach & Solution:**
    *   **Static Site Generator:** Construct a comprehensive documentation repository using MkDocs with the Material theme to compile installation, deployment, and task reports.
    *   **Automated Continuous Deployment:** Implement GitHub Actions pipelines to build and deploy static site assets directly to GitHub Pages on every push to the main branch.
*   **Current Work Status:**
    *   **Fully Completed.** Structure, guides, and theme layout are finalized. Deployment pipelines automatically publish the live documentation on repository updates.
