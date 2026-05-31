# Task 7 — Backend

!!! success "Task Completed"
    The backend architecture has been fully developed, containerized, and integrated with distributed storage and k3s Kubernetes orchestration.

## Completed Objectives

- **FastAPI Core**: Developed a highly modular asynchronous FastAPI backend managing users (JWT), sensor node heartbeat ingestion, real-time threat telemetry routing, and historical logs.
- **Distributed Storage Integration**: Successfully integrated **MinIO (S3-compatible object storage)** to handle high-resolution AI-captured frames, cataloged in PostgreSQL.
- **Docker Containerization**: Authored a multi-stage, production-hardened `Dockerfile` mapping non-root privileges (`tds:tds`) and lightweight runtimes.
- **k3s Kubernetes Orchestration**: Created a full deployment suite inside the new **`k8s/`** directory. Scheduled **3 replicas** of the API, load-balanced via Traefik Ingress, and dynamically distributed across different physical workers using `podAntiAffinity` rules for true high availability.

## References & Artifacts
* **Kubernetes Manifests Folder**: `k8s/`
* **Multi-stage Dockerfile**: `backend/Dockerfile`
* **Full Deployment Guide**: [Distributed k3s Kubernetes Deployment Guide](../guides/k3s-deployment.md)

