# Task 5 — Monitoring

The monitoring system provides complete observability across the master node (`pi5-master`) and all 8 Raspberry Pi 3 worker nodes. It uses Prometheus for metrics collection, Node Exporters for hardware status, Alertmanager for notification routing, and Grafana for dashboards.

---

## 1. Monitoring Architecture & Resource Optimization

Raspberry Pi 3 worker nodes have severe memory constraints (1GB RAM) and boot diskless over NFS. To ensure cluster stability, we consolidated all heavy JVM/Go-based monitoring applications onto the more powerful Master Node (`pi5-master`) while maintaining lightweight exporters on the workers.

* **Master Observability Engine**: Prometheus, Alertmanager, and Grafana are strictly pinned to run only on `pi5-master` using Kubernetes `nodeSelector` constraints:
  ```yaml
  nodeSelector:
    kubernetes.io/hostname: pi5-master
  ```
* **Worker Observation**: Lightweight `prometheus-node-exporter` DaemonSet pods run on all 8 workers, exposing CPU, memory, filesystem status, and hardware temperature metrics without degrading NFS disk or RAM performance.

---

## 2. Troubleshooting & Recovery History

During deployment, two major failures blocked the monitoring system:

### 2.1 — Helm Release Deadlock & Rollback
- **Problem**: The Helm release of `kube-prometheus-stack` became corrupted during a failed upgrade, leaving custom hooks and service accounts in an inconsistent state, preventing further updates.
- **Fix**: Safely rolled back the Helm release to Revision 7 (the last clean state):
  ```bash
  helm rollback monitoring 7 -n monitoring
  ```

### 2.2 — Grafana Container Layer Corruption
- **Problem**: Grafana was stuck in `ImagePullBackOff` on `pi5-master` with a containerdNativeSnapshotter error (`FailedPrecondition`), indicating a corrupted container cached layer on the master's disk.
- **Fix**: Bypassed containerd's corrupted cache by downloading the image via Docker on the master and importing it directly into the K3s containerd namespace:
  ```bash
  docker pull grafana/grafana:10.4.3
  docker save grafana/grafana:10.4.3 -o ~/grafana.tar
  sudo k3s ctr images import ~/grafana.tar
  ```
- **Result**: Grafana immediately transitioned to `3/3 Running`.

---

## 3. Operational Reference & Dashboard Access

### 3.1 — Accessing Grafana
1. Run port-forwarding from the master node:
   ```bash
   kubectl port-forward -n monitoring svc/monitoring-grafana 3000:80 --address 0.0.0.0
   ```
2. Navigate to: **`http://192.168.1.50:3000`**
3. Log in using the credentials:
   - **Username:** `admin`
   - **Password:** `nFgIDeBUeExkYHDJTUzz3HU8XG3MGNVypGoRoLxC`
4. Go to the top-left sidebar menu -> **Dashboards** to view metrics.


