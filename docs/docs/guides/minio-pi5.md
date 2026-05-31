# Distributed MinIO Storage Setup

A complete deployment and troubleshooting reference for running a 7-node distributed MinIO object storage cluster across diskless PXE-booted Raspberry Pi 3 workers using the Pi 5's attached SSD.

---

## Architecture Overview

In our network-booted cluster, the worker nodes operate **completely diskless** (no physical SD cards). Instead of writing to local disks, they mount dedicated, hardware-matched workspace directories from the Pi 5's attached external SSD over NFS.

```
       [ Pi 5 Master Node ]                   [ 8x Pi 3 Worker Nodes ]
       +------------------+                   +----------------------+
       |  Attached SSD    |                   |                      |
       |  /mnt/ssd/       |                   |                      |
       |  └── workspaces/ |===[ NFS Mount ]==>|  /mnt/workspace/     |
       |      ├── a7b7e022|                   |  (Unique per node)   |
       |      ├── 2c900aeb|                   |                      |
       |      └── ...     |                   |  /mnt/minio_data/    |
       +------------------+                   |  (Symlinked to SSD)  |
                                              +----------------------+
```

This design guarantees that MinIO data is physically isolated for each node on the Master's SSD, while logically appearing as standard independent local paths inside the worker nodes.

---

## 1. Authorizing the SSD in NFS exports

!!! success "Already Completed (Skip)"
    The external SSD parent directory `/mnt/ssd/cluster_workspace` has already been exported with the correct options (including the `insecure` flag) in `/etc/exports` on the Pi 5 Master, and the NFS server configuration has been reloaded. You can **skip** this section.

Before workers can mount their SSD workspaces, the Pi 5 Master must authorize the parent directory.

### Step 1 — Add Export Entry
Run on the **Pi 5 Master**:
```bash
echo "/mnt/ssd/cluster_workspace 192.168.1.0/24(rw,sync,no_subtree_check,no_root_squash,insecure)" | sudo tee -a /etc/exports
```

### Step 2 — Reload Exports & Restart NFS Service
```bash
sudo exportfs -arv
sudo systemctl restart nfs-kernel-server
```

---

## 2. Mount the SSD Workspaces on Workers

!!! success "Already Completed (Skip)"
    The shared mount point exists and the `mount_ssd.yml` playbook has been successfully executed on the cluster. All 8 active worker nodes have their private network-attached workspaces mounted under `/mnt/workspace`. You can **skip** this section.

Because the workers boot diskless, the SSD must be mounted at runtime via Ansible.

### Step 1 — Verify SSD is Mounted on Pi 5
Before running the cluster mount playbook, ensure the physical SSD `/dev/sda1` is mounted to `/mnt/ssd` on the Pi 5 Master:
```bash
sudo mount /dev/sda1 /mnt/ssd
```

### Step 2 — Create the Shared Mount Point in Rootfs
Ensure the mount target directory exists inside your shared OS image:
```bash
sudo mkdir -p /nfs/rootfs64/mnt/workspace
```

### Step 3 — Run the Mount Playbook
From the `~/pi-cluster` directory, execute:
```bash
ansible-playbook -i hosts.ini mount_ssd.yml
```
*(Each worker will now have `/mnt/workspace` mounted to its own private folder on the SSD).*

!!! important "NFS Remote Locking Workaround (`nolock` option)"
    PXE network-booted nodes may occasionally fail to initialize the remote RPC locking daemon `rpc-statd` on startup (resulting in mount failure code `rc=32`). To make mounts 100% resilient across all workers (specifically tested and resolved on `worker8`), the playbook is configured to bypass remote locking by adding the `nolock` option to the NFS mount command:
    ```bash
    mount -t nfs -o rw,vers=3,nolock,noatime,_netdev 192.168.1.50:/mnt/ssd/cluster_workspace/$SERIAL /mnt/workspace
    ```

---

## 3. Direct Storage Architecture (Zero-Symlink Native Routing)

!!! success "Best Practice Implemented (Skip)"
    To avoid complex symbolic links or manual bind mounts, we configured the cluster to write directly to `/mnt/workspace` (the genuine network SSD mount). No symlinks or bind mounts are needed!

Historically, playbooks mapped paths through symbolic links because MinIO requires native directory endpoints and explicitly rejects symbolic links for distributed storage (throwing `Drive '/mnt/minio_data' is not a directory`).

By updating `start_minio.yml` to use `/mnt/workspace` directly across the worker nodes in `minio_nodes`, we completely bypassed this limitation. This provides high-performance, robust, and reboot-safe network storage out of the box with zero runtime mapping overhead.

---

## 4. Install the MinIO Binary on the Shared OS

!!! success "Already Completed (Skip)"
    The 64-bit ARM (`arm64`) MinIO executable has already been downloaded to `/nfs/rootfs64/usr/local/bin/minio` and verified across all worker nodes. You can **skip** this section.

Since the workers share a single 64-bit OS rootfs, we only need to install the **64-bit ARM (`arm64`)** MinIO executable once on the Pi 5 Master:

```bash
# 1. Download 64-bit ARM binary into the shared bin folder
sudo wget https://dl.min.io/server/minio/release/linux-arm64/minio -O /nfs/rootfs64/usr/local/bin/minio

# 2. Make it executable
sudo chmod +x /nfs/rootfs64/usr/local/bin/minio
```

To verify it is visible on all workers, run:
```bash
ansible workers -i hosts.ini -a "/usr/local/bin/minio --version"
```

---

## 5. Launch the Distributed MinIO Cluster

Trigger the deployment playbook using your Ansible configuration:

```bash
ansible-playbook -i hosts.ini start_minio.yml
```

Once completed, the distributed S3-compatible cluster is running!
* **API/Data traffic:** Port `9000` on any worker.
* **Console/UI Dashboard:** Port `9001` on any worker (e.g., `http://192.168.1.58:9001` with user `admin` and password `password123`).

---

