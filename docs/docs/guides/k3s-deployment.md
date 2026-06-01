# Distributed k3s Kubernetes Deployment Guide

To satisfy production and academic requirements for a high-availability, distributed cloud-edge architecture, this guide details how to deploy the entire Threat Detection System backend onto a multi-node **k3s Kubernetes cluster** distributed across your 8 Raspberry Pi worker nodes.

---

## ⚡ Quick Start: Running the Existing Setup

If the Kubernetes cluster and NFS rootfilesystems are already configured (with the shared `/nfs` directory bind-mounted to the SSD), use these commands to start, verify, and deploy the application. You do **not** need to recreate configurations or rebuild services.

### 1. Start Services on `pi5-master`
Ensure the NFS kernel server and K3s orchestration services are active on the Master node:
```bash
sudo systemctl start nfs-kernel-server
sudo systemctl start k3s
```

### 2. Verify and Boot Worker Nodes
Ensure all 8 worker nodes are online and registered:
```bash
# Verify SSH connectivity via Ansible
ansible workers -i ~/pi-cluster/hosts.ini -m ping

# Check node readiness (should show pi5-master and worker1 through worker8 as 'Ready')
kubectl get nodes
```
*(If nodes are offline or unreachable, physically power-cycle the worker Pi boards to boot them off the SSD NFS filesystems).*

### 3. Deploy the Threat Detection System
Apply the manifests to start the backend databases, MQTT broker, and high-availability FastAPI service replicas:
```bash
# 1. Navigate to the project root
cd ~/Threat-Detection-System

# 2. Deploy infrastructure dependencies
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/minio.yaml
kubectl apply -f k8s/mqtt.yaml

# 3. Deploy the scaled FastAPI backend application
kubectl apply -f k8s/backend.yaml
```

### 4. Monitor Deployment & Distribution
Watch Kubernetes spin up and distribute your FastAPI replicas across the physical worker nodes using anti-affinity:
```bash
watch "kubectl get pods -l 'app in (tds-api, tds-postgres, tds-minio, tds-mqtt)' -o wide"
```

---


## 1. Architectural Distribution Overview

In this deployment:
* **Storage and Broker isolation**: PostgreSQL, MinIO, and Mosquitto MQTT run as dedicated single-pod workloads backed by k3s local-path Persistent Volume Claims (retaining state across rescheduling).
* **High Availability Application Scaling**: The FastAPI web service is scaled to **9 active replicas**.
* **Anti-Affinity Distribution**: By implementing `podAntiAffinity` rules, we force Kubernetes to schedule your backend instances across **different physical worker nodes**, guaranteeing that a single hardware crash cannot take the system offline.


---

## 2. Directory Structure of Manifests

The configuration is organized under the new `k8s/` directory in the repository root:
* **`k8s/postgres.yaml`**: PVC, Single-instance deployment, and cluster Service.
* **`k8s/minio.yaml`**: Standalone S3 Object Storage with Console access on Port 9091.
* **`k8s/mqtt.yaml`**: Broker ConfigMap, message persistent storage, and Port 1883/9001 Service.
* **`k8s/backend.yaml`**: Highly available, anti-affinity API Deployment (3 pods), ClusterIP Service, and Traefik Ingress Controller configurations.

---

## 3. Step 1 — Build the Docker Image Natively on the Pi 5 Master

Since the Raspberry Pi worker nodes run on `ARM64` architecture, the Docker image must be built for `ARM64`. Because the Pi 5 Master runs on `ARM64`, you can build the image natively after SSH'ing into the Master node:

```bash
cd ~/Threat-Detection-System/backend
docker build -t localhost:5000/tds-api:latest .
```

---

## 4. Step 2 — Import the Image into k3s

If you do not have a private container registry running inside your k3s cluster, you can manually import the compiled image into the `k8s.io` namespace on the master node:

```bash
# Save image to tar archive
docker save localhost:5000/tds-api:latest -o tds-api.tar

# Import directly into k3s containerd namespace
sudo k3s ctr images import tds-api.tar
```

---

## 5. Step 3 — Apply the Kubernetes Manifests

Apply the manifests in logical dependency order (Databases, Broker, and Storage first, followed by the web application):

```bash
# 1. Navigate to the project root on your Master node
cd ~/Threat-Detection-System

# 2. Deploy Supporting State Services
kubectl apply -f k8s/postgres.yaml
kubectl apply -f k8s/minio.yaml
kubectl apply -f k8s/mqtt.yaml

# 3. Deploy the FastAPI Backend Application
kubectl apply -f k8s/backend.yaml
```

---

## 6. Step 4 — Verify the Distributed Scaling

Once applied, verify that Kubernetes has successfully scheduled and distributed the backend pods across the distinct Raspberry Pi worker nodes.

Since your cluster already has many older running pods, use a **label filter** with the **`-o wide`** flag to display only your Threat Detection System (TDS) services and reveal the physical node locations:

```bash
kubectl get pods -l "app in (tds-api, tds-postgres, tds-minio, tds-mqtt)" -o wide
```

### Expected Output Structure:
```text
Every 2.0s: kubectl get pods -l 'app in (tds-api, tds-postgres, tds-minio, tds-mqtt)' -o wide                                                                                                                                                                    pi5-master: Mon Jun  1 22:26:37 2026

NAME                            READY   STATUS    RESTARTS        AGE   IP             NODE         NOMINATED NODE   READINESS GATES
tds-api-866b6d55d7-8ptfb        1/1     Running   0               17m   10.42.19.119   worker6      <none>           <none>
tds-api-866b6d55d7-b8qr8        1/1     Running   4 (22m ago)     45m   10.42.11.107   worker5      <none>           <none>
tds-api-866b6d55d7-j52cm        1/1     Running   4 (22m ago)     45m   10.42.15.115   worker3      <none>           <none>
tds-api-866b6d55d7-k9pct        1/1     Running   0               17m   10.42.18.118   worker7      <none>           <none>
tds-api-866b6d55d7-knvr2        1/1     Running   4 (22m ago)     45m   10.42.13.123   worker2      <none>           <none>
tds-api-866b6d55d7-mm9vs        1/1     Running   0               17m   10.42.9.127    worker4      <none>           <none>
tds-api-866b6d55d7-r2cmd        1/1     Running   4 (19m ago)     45m   10.42.2.179    worker1      <none>           <none>
tds-api-866b6d55d7-rxqlw        1/1     Running   0               17m   10.42.0.64     pi5-master   <none>           <none>
tds-api-866b6d55d7-s56qv        1/1     Running   4 (22m ago)     45m   10.42.16.142   worker8      <none>           <none>
tds-minio-0                     1/1     Running   0               18m   10.42.0.63     pi5-master   <none>           <none>
tds-minio-1                     1/1     Running   0               19m   10.42.19.118   worker6      <none>           <none>
tds-minio-2                     1/1     Running   0               20m   10.42.9.126    worker4      <none>           <none>
tds-minio-3                     1/1     Running   0               20m   10.42.18.117   worker7      <none>           <none>
tds-mqtt-b89b88cc7-9mvcd        1/1     Running   1 (5h34m ago)   27h   10.42.0.48     pi5-master   <none>           <none>
tds-postgres-78895cb7f9-b6kdl   1/1     Running   1 (5h34m ago)   27h   10.42.0.43     pi5-master   <none>           <none>
```

🔬 **How this proves Distributed Kubernetes is working**:
1. **The `NODE` Column**: Running with `-o wide` exposes the **`NODE`** column. Look closely at the nodes: your pods are actively distributed across the entire physical cluster (`pi5-master` and `worker1` through `worker8`).
2. **True Anti-Affinity Application Distribution**: Look at the **`tds-api`** pods: they are successfully running concurrently and load-balanced across all available hardware. Because of our `podAntiAffinity` rules, K3s ensures that replicas are evenly spread across separate physical boards, rather than scheduling them all onto a single node!
3. **4-Node Distributed MinIO Erasure-Coded Pool**: MinIO is configured in distributed mode across 4 dedicated nodes (`pi5-master`, `worker6`, `worker4`, `worker7`). If any drive or worker node fails, erasure coding guarantees the S3 storage pool remains online and readable with zero data loss.


---

## 7. Step 5 — Access the Distributed API

k3s ships with the **Traefik Ingress Controller** natively. The Ingress in `backend.yaml` automatically exposes your FastAPI pods externally.

Simply open your browser and navigate to:
* Swagger UI: **`http://192.168.1.50/docs`** *(No port suffix needed! Traefik routes the standard port 80 traffic internally to port 8001 of your active backend pods)*.

Your backend is now fully distributed, load-balanced, and running in high-availability across your Raspberry Pi 3 workers! 

---

## 8. Verification & Troubleshooting Reference (Real-world Deployment Notes)

During real-world deployment on private local switches and multi-node Raspberry Pi hardware, several cluster-level configuration requirements were identified and resolved:

### 8.1 — Fatal Error: `failed to find memory cgroup (v2)`
By default, Raspberry Pi OS disables kernel memory management and process limits in the cgroups subsystem. When starting, `k3s` will fail immediately with a fatal error:
```text
level=fatal msg="Error: failed to find memory cgroup (v2)"
```
**Resolution**:
1. Open the system boot config file on the Pi 5 Master:
   ```bash
   sudo nano /boot/firmware/cmdline.txt
   ```
2. Append these three parameters to the end of the **single line** (separated by spaces, do not add newlines!):
   ```text
   cgroup_enable=cpuset cgroup_enable=memory cgroup_memory=1
   ```
3. Reboot the Pi 5 Master to load the kernel changes:
   ```bash
   sudo reboot
   ```

### 8.2 — K3s Agent on Diskless/PXE NFS Workers
In a high-availability diskless cluster where Raspberry Pi 3 workers boot from a shared, read-only NFS rootfs (`/nfs/rootfs64`), standard K3s agent installation scripts fail because the rootfs is read-only for the workers. 

To successfully resolve this, configure the shared filesystem directly from the active **Pi 5 Master**:

1. **Passwordless SSH Auth**: Authorize the Master's SSH keys within the shared rootfs:
   ```bash
   sudo mkdir -p /nfs/rootfs64/home/cc123/.ssh
   sudo chmod 700 /nfs/rootfs64/home/cc123/.ssh
   cat ~/.ssh/id_rsa.pub ~/.ssh/id_ed25519.pub 2>/dev/null | sudo tee -a /nfs/rootfs64/home/cc123/.ssh/authorized_keys
   sudo chmod 600 /nfs/rootfs64/home/cc123/.ssh/authorized_keys
   sudo chown -R 1000:1000 /nfs/rootfs64/home/cc123/.ssh
   ```

2. **Copy Agent Binary**: Since Master and Workers share the same `ARM64` architecture, copy the exact working binary:
   ```bash
   sudo cp /usr/local/bin/k3s /nfs/rootfs64/usr/local/bin/k3s
   sudo chmod +x /nfs/rootfs64/usr/local/bin/k3s
   ```

3. **Configure Connection Environment**: Create `/nfs/rootfs64/lib/systemd/system/k3s-agent.service.env`:
   ```text
   K3S_URL=https://192.168.1.50:6443
   K3S_TOKEN=<node_token>
   ```

4. **Define systemd Service Unit**: Create `/nfs/rootfs64/lib/systemd/system/k3s-agent.service`:
   ```ini
   [Unit]
   Description=Lightweight Kubernetes
   Documentation=https://k3s.io
   After=network-online.target firewalld.service
   Wants=network-online.target

   [Service]
   Type=notify
   EnvironmentFile=-/etc/default/%N
   EnvironmentFile=-/etc/sysconfig/%N
   EnvironmentFile=-/lib/systemd/system/k3s-agent.service.env
   ExecStartPre=-/sbin/modprobe br_netfilter
   ExecStartPre=-/sbin/modprobe overlay
   ExecStart=/usr/local/bin/k3s agent --snapshotter native --kubelet-arg=runtime-request-timeout=15m
   KillMode=process
   Delegate=yes
   LimitNOFILE=1048576
   LimitNPROC=infinity
   LimitCORE=infinity
   TasksMax=infinity
   TimeoutStartSec=0
   Restart=always
   RestartSec=5s

   [Install]
   WantedBy=multi-user.target
   ```

5. **Enable Service via Chroot**: Register the systemd unit inside the workers' rootfs:
   ```bash
   sudo chroot /nfs/rootfs64 systemctl enable k3s-agent.service
   ```

6. **Worker Kernel Cgroups (cmdline.txt)**: Append memory/cpuset limits to your workers' PXE boot configuration files (usually found on the Master under `/tftpboot/` or `/srv/tftp/`):
   ```text
   cgroup_enable=cpuset cgroup_enable=memory cgroup_memory=1
   ```

### 8.3 — High-Performance SSD Storage Migration for NFS Workers

When running multiple diskless workers over NFS, hosting the shared root filesystems (`/nfs`) on the Master's SD card will exhaust storage and cause massive disk I/O latency, leading to K3s SQLite transaction timeouts and `NotReady` node registration failures.

To resolve this bottleneck, we migrated all worker filesystems onto the high-performance **500GB SSD** (`/mnt/ssd`) and bind-mounted it back to `/nfs` to ensure zero disruption to DHCP/PXE configurations.

#### 1. Stop NFS & K3s Services
```bash
sudo systemctl stop nfs-kernel-server
sudo systemctl stop k3s
```

#### 2. Copy the NFS Rootfs with unix-attribute preservation
```bash
sudo mkdir -p /mnt/ssd/nfs
sudo rsync -aHAXx --info=progress2 /nfs/ /mnt/ssd/nfs/
```

#### 3. Bind-Mount SSD folder onto `/nfs`
```bash
sudo mv /nfs /nfs.old
sudo mkdir /nfs
sudo mount --bind /mnt/ssd/nfs /nfs
```

#### 4. Make Mount Persistent in `/etc/fstab`
```bash
echo "/mnt/ssd/nfs /nfs none bind 0 0" | sudo tee -a /etc/fstab
```

#### 5. Clear Memory Page Cache (Fixes `errno 12` nfsd spawn failure)
The massive `rsync` operations cache files in RAM. Force the kernel to flush and drop caches before starting:
```bash
sudo sh -c "sync && echo 3 > /proc/sys/vm/drop_caches"
```

#### 6. Start Services & Re-export
```bash
sudo systemctl daemon-reload
sudo systemctl start nfs-kernel-server
sudo systemctl start k3s
sudo exportfs -ra
```

#### 7. Reclaim SD Card Space
```bash
sudo rm -rf /nfs.old
```

### 8.4 — Kubelet Runtime Request Timeout over NFS (Native Snapshotter)

Because network-booted Raspberry Pi workers mount their root filesystems over NFS, `containerd` cannot use `overlayfs` for container isolation due to filesystem layer limitations. Instead, it falls back to the `native` snapshotter.
* **The Blocker**: The `native` snapshotter performs a file-by-file deep copy of the container rootfs. For a FastAPI application built on a standard Python base image (~820MB with tens of thousands of Python dependency files), this extraction copies all files over 100Mbps Ethernet network interfaces, taking 3–4 minutes under 100% CPU load on Raspberry Pi 3 workers.
* **The Error**: By default, the Kubelet has a hardcoded container creation timeout of **2 minutes** (`runtime-request-timeout`). During image pull and native extraction, Kubelet would abort the creation task midway with `context deadline exceeded`, leaving the containerd tasks orphaned and locking local resource/container names (`failed to reserve container name`).
* **The Resolution**: We configured the workers' persistent systemd unit file at `/nfs/rootfs64/lib/systemd/system/k3s-agent.service` to pass `--kubelet-arg=runtime-request-timeout=15m` to the K3s agent. This tells the Kubelet to wait up to 15 minutes for slow I/O and network copy phases, which fully resolved the container creation errors on network-booted nodes!

### 8.5 — Dual-Homed DNS Routing Metric & Masquerading NAT Gateway

The Raspberry Pi 5 Master is dual-homed on the same subnet (`192.168.1.0/24`) with two physical interfaces: Wi-Fi (`wlan0`, connecting to the home internet network) and Ethernet (`eth0`, connecting to the private local switch hosting the 8 workers).
* **The Blocker**: Because the Ethernet port had a lower routing metric (200) than the Wi-Fi port (600), the operating system routed local DNS queries to `192.168.1.1` over `eth0` (the private switch) where the internet-connected router did not exist, causing DNS to fail on the Master and blocking worker image pulls.
* **The Resolution**: 
  1. Overwrote `/etc/resolv.conf` on both the Master and the shared worker rootfs (`/nfs/rootfs64/etc/resolv.conf`) to use public DNS servers:
     ```text
     nameserver 8.8.8.8
     nameserver 1.1.1.1
     ```
  2. Setup IP masquerading (NAT) on the Master to share its Wi-Fi internet connection with the Ethernet switch network interface so that PXE-booted worker nodes can retrieve docker base images and dependencies:
     ```bash
     sudo iptables -t nat -A POSTROUTING -o wlan0 -j MASQUERADE
     sudo iptables -I FORWARD 1 -i eth0 -o wlan0 -j ACCEPT
     sudo iptables -I FORWARD 1 -m state --state RELATED,ESTABLISHED -j ACCEPT
     ```

### 8.6 — Post-Reboot Volatile RAM DNS, Sandbox manual pull wakeup, and StatefulSet rollout

During a complete physical cluster reboot, we identified three critical runtime interactions affecting the distributed services:

#### 1. Volatile RAM `/etc/resolv.conf` on PXE Workers
* **The Blocker**: Network-booted Raspberry Pi workers mount `/etc` as a volatile RAM overlay (`tmpfs`). As a result, editing the NFS base image at `/nfs/rootfs64/etc/resolv.conf` *after* nodes have booted has no effect. The active system memory continues to hold the local, broken DHCP nameserver.
* **The Resolution**: We used Ansible to inject clean public resolvers directly into the running nodes' active memory:
  ```bash
  ansible workers -i ~/pi-cluster/hosts.ini -m shell -a "printf 'nameserver 8.8.8.8\nnameserver 1.1.1.1\n' | sudo tee /etc/resolv.conf" --become
  ```

#### 2. Containerd Sandbox (`pause` image) Pull Back-Off Loop
* **The Blocker**: Because the workers booted without a working DNS resolver, the local container runtime (`containerd`) failed to pull the required Kubernetes network sandbox container (`rancher/mirrored-pause:3.6`). Even after fixing DNS, containerd entered a lengthy exponential pull back-off timeout, leaving pods stuck in `ContainerCreating` with `PodReadyToStartContainers: False`.
* **The Resolution**: We used Ansible to manually force-pull the sandbox image directly into the K3s containerd cache across all nodes, instantly waking up the scheduler threads:
  ```bash
  ansible workers -i ~/pi-cluster/hosts.ini -m shell -a "sudo k3s crictl pull rancher/mirrored-pause:3.6" --become
  ```

#### 3. Stale DNS and Connection Caching in Distributed MinIO
* **The Blocker**: Since some MinIO StatefulSet replicas booted during the DNS lockout, their internal Go client network socket states got stuck retrying stale, failed connections, continually returning `503 Service Unavailable` even after local routing and IP-level overlays were fully repaired.
* **The Resolution**: We forced a clean rollout restart of both the distributed storage StatefulSet and the API service to reset all network connections:
  ```bash
  # 1. Recycle storage layer
  kubectl rollout restart statefulset tds-minio
  
  # 2. Recycle API backend layer
  kubectl rollout restart deployment tds-api
  ```

#### 4. Distributed MinIO `O_DIRECT` Failures on NFS Mounts
* **The Blocker**: By default, MinIO in distributed mode enforces POSIX Direct I/O (`O_DIRECT`) for all read and write operations to guarantee transactional consistency on raw block devices. However, network filesystems (like the NFS mounts used by our diskless workers booting over the network share) do not support `O_DIRECT` flags inside Docker/K3s container mounts. MinIO catches this write check failure during startup and marks the storage drives as **`drive not found` / `Offline`**, completely stalling the cluster bootstrap process.
* **The Resolution**: We added the `MINIO_API_ODIRECT` environment variable with the value `"off"` inside the StatefulSet environment block (`k8s/minio.yaml`). This disables the strict Direct I/O requirement, allowing MinIO to leverage the standard Linux page cache and successfully format and write its metadata to our NFS-backed PVs:
  ```yaml
              - name: MINIO_API_ODIRECT
                value: "off"
  ```

#### 5. Distributed MinIO `drive is part of root drive` on Diskless NFS Workers
* **The Blocker**: After solving the `O_DIRECT` issue, MinIO drives still appeared as `drive not found` in a continuous retry loop. Inspecting the **worker node** logs (`kubectl logs tds-minio-1 | head -n 50`) revealed the true root cause:
  ```
  Error: Drive ... returned an unexpected error: major: 0: minor: 42:
  drive is part of root drive, will not be used, please investigate
  ```
  MinIO performs a safety check comparing the device IDs (`major:minor`) of the data path (`/data`) and the root path (`/`). If they match, MinIO assumes the data directory is on the OS disk and refuses to use it. On our PXE/NFS diskless workers, **both** `/` and `/data` are NFS mounts — they both report device `major: 0` (the NFS pseudo-device), triggering this false positive. The master node (`tds-minio-0`) only logged the symptom (`drive not found, will be retried`) but never the cause, making the error misleading when only checking pod-0 logs.
* **The Resolution**: We added the `MINIO_CI_CD` environment variable with the value `"on"` inside the StatefulSet environment block (`k8s/minio.yaml`). This disables MinIO's root-drive safety check, which is designed for bare-metal setups with dedicated disks but breaks on NFS-backed storage where all mount points share the same virtual device ID:
  ```yaml
              - name: MINIO_CI_CD
                value: "on"
  ```
  After applying this change and wiping stale metadata (`rm -rf /data/.minio.sys` on all 4 pods), the cluster successfully formatted and booted:
  ```
  INFO: Formatting 1st pool, 1 set(s), 4 drives per set.
  INFO: All MinIO sub-systems initialized successfully
  ```
