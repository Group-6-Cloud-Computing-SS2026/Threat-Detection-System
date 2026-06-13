# Threat Detection System

Welcome to the central documentation hub for the **Threat Detection System (TDS)** — a high-availability, edge-computing threat detection sensor network deployed across a multi-node Raspberry Pi cluster.

---

## 🗺️ Documentation Map

Navigate through the guides and configurations structured by component and layer:

### ⚙️ Cluster Infrastructure & Setup

| Guide | Description |
| :--- | :--- |
| [❗ (MUST FOLLOW!) Cluster Shutdown and Cold Start Guide](guides/shutdown-and-cold-start.md) | Step-by-step shutdown and boot recovery operations. |
| [Cluster Setup V2 (Setup & Verification)](guides/cluster-setup-v2.md) | Verification checklist and system checks for network boot. |
| [Ansible Orchestration Guide](guides/ansible.md) | Setting up ssh keys, hosts inventory, and batch task automation. |
| [Basic User Guide](guides/user-guide.md) | Day-to-day admin commands and Ansible cheat sheet. |

### 🚀 Distributed Web Services

| Guide | Description |
| :--- | :--- |
| [Local Dev & Workstation Setup](guides/backend-pi5.md) | Run the entire FastAPI + Databases stack locally using Docker Compose. |
| [Distributed k3s Kubernetes Deployment](guides/k3s-deployment.md) | Scheduling API replicas, node affinity rules, and Ingress routing. |
| [MinIO S3 Object Storage Guide](guides/minio-s3.md) | Configuration for distributed S3 buckets and erasure coding over NFS. |
| [Edge Camera Test Stream Guide](guides/camera-test-stream.md) | Ingestion scripts, base64 image streaming, and browser test client. |

### 📊 HPC Benchmarking & Parallel Computing

| Guide | Description |
| :--- | :--- |
| [MPI Cluster Setup Guide](guides/mpi-cluster.md) | Cross-compiling OpenMPI via chroot and launching cluster-wide jobs. |
| [HPL Synthetic Benchmarks](guides/synthetic-benchmarks.md) | Tuning process grids (P x Q) and running LINPACK benchmarks. |
| [Task Distributor Guide](guides/task4-task-distributor.md) | Validating Amdahl's and Gustafson's Laws using parallel POV-Ray renders. |

---

## 📋 Project Task Matrix

Detailed completion progress for each task requirement:

| Task | Title | Description / Status |
|:---|:---|:---|
| **Task 1** | [Edge Computing Infrastructure](tasks/task-01-edge-computing-infrastructure.md) | Network boot setup, dual-homed DNS config, and SSD migration. |
| **Task 2** | [HPL Performance](tasks/task-02-hpl.md) | High Performance LINPACK benchmarking and process tuning. |
| **Task 3** | [MPI Cluster](tasks/task-03-mpi.md) | OpenMPI deployment and distributed workload validation. |
| **Task 4** | [Non-MPI Scaling Laws](tasks/task-04-scaling-laws.md) | Scaling analysis (Amdahl vs Gustafson) with POV-Ray & Task Distributor. |
| **Task 5** | [Monitoring](tasks/task-05-monitoring.md) | Prometheus, Grafana, and system health status. |
| **Task 6** | [Model Training](tasks/task-06-model-training.md) | Custom YOLO model training and threat detection weights. |
| **Task 7** | [Backend API](tasks/task-07-backend.md) | Load-balanced FastAPI replicas with MinIO S3 and Postgres integration. |
| **Task 8** | [Frontend Dashboard](tasks/task-08-frontend.md) | React web console displaying node stats and live threat streams. |
| **Task 9** | [Telegram Notifications](tasks/task-09-telegram.md) | Telemetry bot alert integration. |

---
*Cloud Computing Course SS2026 — Frankfurt University of Applied Sciences*  
*Project Repository: [Threat-Detection-System](https://github.com/javierdesant/Threat-Detection-System)*
