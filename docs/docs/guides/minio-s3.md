# MinIO S3 Object Storage Integration

This guide details how the S3-compatible **MinIO** object storage service is configured, deployed, and integrated as a **True 4-Node Distributed Cluster** within the K3s Kubernetes cluster to store high-resolution AI threat detection images.

---

## 1. Storage Architecture

MinIO is deployed inside Kubernetes as a **4-node Distributed StatefulSet cluster** utilizing erasure coding. Example:

```mermaid
graph TD
    API["9x tds-api Backend Pods"]
    SVC["minio:9000 (K8s Service DNS)"]
    M0["tds-minio-0<br/><i>pi5-master</i>"]
    M1["tds-minio-1<br/><i>worker6</i>"]
    M2["tds-minio-2<br/><i>worker4</i>"]
    M3["tds-minio-3<br/><i>worker7</i>"]
    PVC0["PVC data-0<br/>5Gi"]
    PVC1["PVC data-1<br/>5Gi"]
    PVC2["PVC data-2<br/>5Gi"]
    PVC3["PVC data-3<br/>5Gi"]
    NFS["SSD-Backed NFS Storage"]

    API -->|S3 API| SVC
    SVC --> M0 & M1 & M2 & M3
    M0 --> PVC0
    M1 --> PVC1
    M2 --> PVC2
    M3 --> PVC3
    PVC0 & PVC1 & PVC2 & PVC3 --> NFS
```

### Key Integration Highlights:
* **True Hardware Redundancy**: By enforcing strict `podAntiAffinity` rules, Kubernetes distributes the 4 MinIO pods across **4 separate physical Raspberry Pi nodes**.
* **Headless Network Topology**: The pods are coordinated via a headless network service `minio-sys` using their native cluster DNS names:
  `http://tds-minio-{0...3}.minio-sys.default.svc.cluster.local/data`
* **Erasure Coding & Self-Healing**: MinIO automatically pools the 4 independent drives into a single, high-availability S3 storage bucket. The cluster can tolerate the complete physical crash of any worker node with zero data loss or service disruption!
* **Auto-ensured Buckets**: The FastAPI application automatically checks and creates the target bucket `detection-images` at startup, guaranteeing a zero-configuration environment.

---

## 2. Deploying the Distributed Cluster

The storage configuration is defined as infrastructure-as-code under [minio.yaml](../../k8s/minio.yaml).

### Manifest Breakdown:
1. **Headless Service (`minio-sys`)**: Facilitates internal cluster routing and disk peer communication between MinIO nodes.
2. **StatefulSet (`tds-minio`)**: Manages the 4 persistent MinIO container replicas, utilizing strict `podAntiAffinity` and mounting the unique auto-created PVC volumes.
3. **Lightweight Resource Limits**: Tuned to run at maximum efficiency on Raspberry Pi 3 workers with `128Mi` RAM requests.
4. **Public Service (`minio`)**: Exposes the cluster externally via `LoadBalancer`:
   * **Port 9000** (S3 API Endpoint) -> used by the backend pods.
   * **Port 9091** (Web Console UI) -> exposed on host for developers to audit files (avoiding port 9001 collision).

### NFS Compatibility Environment Variables
Because all worker nodes are **diskless PXE/NFS-booted Raspberry Pis**, the MinIO StatefulSet requires two special environment variables to operate correctly on NFS-backed PersistentVolumes:

| Variable | Value | Purpose |
|---|---|---|
| `MINIO_API_ODIRECT` | `off` | NFS does not support POSIX Direct I/O (`O_DIRECT`). Disabling it allows MinIO to use the standard Linux page cache for reads and writes. |
| `MINIO_CI_CD` | `on` | On NFS-booted workers, both `/` and `/data` report device `major: 0` (NFS pseudo-device). MinIO's safety check falsely detects `/data` as part of the root drive and refuses to use it. This variable disables that check. |

> ⚠️ **Note**: These variables are **only required** because the cluster uses NFS-backed storage.

To apply or update the MinIO setup:
```bash
# 1. Apply the new distributed configuration
kubectl apply -f k8s/minio.yaml
```

---

## 3. Accessing the MinIO Web Console

You can audit uploaded threat images and browse the S3 bucket contents directly in your browser.

### Step 1 — Verify Distributed Pod Status
Ensure all 4 replicas are successfully running and distributed across different nodes:
```bash
kubectl get pods -l "app=tds-minio" -o wide
```

### Step 2 — Open the Console
Open a browser on your PC workstation and navigate to:
👉 **`http://192.168.1.50:9091`**

### Step 3 — Log In
Enter the pre-configured credentials:
* **Access Key / Username**: `admin`
* **Secret Key / Password**: `password123`

After login, the console opens the **Object Browser** view. You should see the `detection-images` bucket (auto-created by the FastAPI backend on startup). From here you can browse, upload, and download stored threat detection images.

---

## 4. Verifying Distributed Cluster Health (CLI)

The MinIO web console looks identical in single-node and distributed modes. Use the CLI to confirm the erasure-coded cluster is healthy:

### Check Cluster Health Endpoint
```bash
kubectl exec -it tds-minio-0 -- curl -s -o /dev/null -w "%{http_code}" http://localhost:9000/minio/health/cluster
# Expected output: 200
```

### Verify Startup Logs
The most definitive proof of distributed mode is in the pod startup logs:
```bash
kubectl logs tds-minio-0 --tail=20
```

Look for these key lines:
```text
INFO: Formatting 1st pool, 1 set(s), 4 drives per set.      ← Erasure coding across 4 nodes
INFO: All MinIO sub-systems initialized successfully          ← Cluster quorum achieved
```

A single-node MinIO would report `1 drive per set`. Seeing `4 drives per set` confirms the distributed erasure-coded cluster is fully operational.

---

## 5. Scaling Constraints & RAM Limitations

### Why the cluster is pinned to 4 MinIO replicas:

1. **Hardware Memory Constraints**: The Raspberry Pi 3 worker nodes are equipped with only **1GB of RAM** and boot diskless over NFS. MinIO's distributed erasure coding requires significant memory cache to orchestrate disk queries and network peer synchronization. Restricting the cluster to 4 MinIO pods prevents worker nodes from running out of memory (OOM) and crashing.
2. **Optimizing API High Availability**: By deploying MinIO on only 4 nodes (e.g. `pi5-master`, `worker6`, `worker4`, and `worker7`), the remaining 4 worker nodes are left free of heavy storage workloads. This allows the lightweight FastAPI `tds-api` backend replica pods to scale to 9 pods across the cluster with maximum availability and responsiveness.
3. **Future Hardware Upgrade Path**: If the cluster is upgraded with more powerful hardware (e.g., Raspberry Pi 4 or 5 nodes with 4GB or 8GB of RAM), the StatefulSet can be safely scaled to 8 replicas. 

To upgrade to an 8-node MinIO cluster:
1. Increase `replicas: 8` in [minio.yaml](../../k8s/minio.yaml).
2. Update the startup args to reflect the larger pool:
   `http://tds-minio-{0...7}.minio-sys.default.svc.cluster.local/data`
3. *Note: Changing erasure coding layout requires re-initializing the persistent volumes (PVs) as MinIO cannot dynamically expand an existing set size.*

---

## 6. Auditing Physical Image Files on the Master Node

Because all worker nodes network-boot (PXE) their operating systems and run diskless, any data written to their local persistent volumes (including MinIO local storage paths) is physically stored on the Master Pi 5's SSD inside the shared NFS root directories.

You can audit, find, or count the physical `annotated.jpg` files directly from the **Pi 5 Master** terminal:

### Find all saved threat detection images:
```bash
sudo find /nfs/nodes/ -name "annotated.jpg"
```

### Count the total number of saved threat detection images:
```bash
sudo find /nfs/nodes/ -name "annotated.jpg" | wc -l
```

### Path structure breakdown:
The files are stored inside each worker's local storage PV volume root:
`/nfs/nodes/<worker-hostname-hash>/var/lib/rancher/k3s/storage/pvc-<pvc-uuid>_default_data-tds-minio-<pod-index>/detection-images/detections/<event-uuid>/annotated.jpg`


