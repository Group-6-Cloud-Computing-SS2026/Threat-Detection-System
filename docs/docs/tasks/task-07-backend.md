# Task 7 — Backend High-Availability & MinIO S3 Object Storage

This page documents the automated deployment, configuration, and maintenance of high-availability cloud storage at the edge using a distributed **MinIO S3 Object Storage** cluster across our Raspberry Pi workers. The objective was to pool individual diskless worker directories into a single redundant object bucket to store alert snapshots and operational log files safely.

---

## 1. Storage Backend Architecture

Traditional single-node network storage configurations represent a single point of failure within edge monitoring systems. To safeguard incoming alert metrics against arbitrary hardware failure, our storage pool operates as a distributed peer-to-peer subsystem.

### Distributed Directory Pooling

MinIO aggregates designated data subdirectories across active network endpoints into a unified virtual storage drive.

- **Physical Target Paths:** Each node hosts its dedicated block at `/mnt/data` inside its respective system allocation tree on the Master's SSD (e.g., `/nfs/nodeX/mnt/data` physically mapped on the Pi 5).
- **Logical Mount Array:** MinIO links these nodes concurrently, forming an active peer-to-peer data replication grid.

---

## 2. Automated MinIO Cluster Deployment via Ansible

Instead of building storage listeners manually across independent terminals, we utilize **Ansible** playbooks running from the `pi5-master` control engine to provision, configure, and maintain the storage nodes.

The configuration playbook is saved on the master node at `~/pi-cluster/start_minio.yml`:

```yaml
---
- name: Deploy Distributed MinIO Cluster on Workers
  hosts: workers
  become: yes
  vars:
    minio_version: "20240524"  # Pin release profile for stability
  tasks:
    - name: Ensure Local Storage Mount Target Directory Exists
      file:
        path: /mnt/data
        state: directory
        mode: '0755'

    - name: Configure Master Cluster Environment Variables
      copy:
        dest: /etc/default/minio
        content: |
          MINIO_ROOT_USER=admin
          MINIO_ROOT_PASSWORD=password123
          MINIO_VOLUMES="http://192.168.1.58/mnt/data http://192.168.1.54/mnt/data http://192.168.1.104/mnt/data http://192.168.1.136/mnt/data http://192.168.1.86/mnt/data http://192.168.1.117/mnt/data http://192.168.1.83/mnt/data"
          MINIO_OPTS="--address :9000 --console-address :9001"

    - name: Create Systemd Service Configuration Unit
      copy:
        dest: /etc/systemd/system/minio.service
        content: |
          [Unit]
          Description=MinIO Distributed Object Storage
          Documentation=https://docs.min.io
          Wants=network-online.target
          After=network-online.target

          [Service]
          Type=simple
          EnvironmentFile=/etc/default/minio
          ExecStart=/usr/local/bin/minio server $MINIO_OPTS $MINIO_VOLUMES
          Restart=always
          LimitNOFILE=65536

          [Install]
          WantedBy=multi-user.target

    - name: Force Daemon Reload and Enable MinIO Background Service
      systemd:
        name: minio
        state: restarted
        daemon_reload: yes
        enabled: yes
```

### Launching the Infrastructure

To execute the multi-node provisioning matrix across your private LAN network, run:

```bash
ansible-playbook -i ~/pi-cluster/hosts.ini ~/pi-cluster/start_minio.yml
```

---

## 3. Operational Cluster Management & Maintenance

Once deployed, the MinIO cluster coordinates traffic automatically over the network. Use the following operational patterns to monitor and maintain the health of the storage cluster.

### Essential Health Assessment Commands

| Task | Ansible Orchestration Command | Purpose |
|------|-------------------------------|---------|
| **Check Service Status** | `ansible workers -i hosts.ini -a "systemctl status minio"` | Verifies if the MinIO storage process is running normally across workers. |
| **Audit Storage Space** | `ansible workers -i hosts.ini -m shell -a "df -h /mnt/data"` | Displays remaining volume metrics for individual network-backed overlays. |
| **Synchronize Cluster Clocks** | `ansible workers -i hosts.ini -m shell -a "date -s '$(date -u +'%Y-%m-%d %H:%M:%S')'"` | Performs immediate cluster-wide clock adjustments to prevent authentication token drops. |
| **Restart Storage Array** | `ansible workers -i hosts.ini -m systemd -a "name=minio state=restarted" --become` | Restarts storage processes across all worker nodes simultaneously. |

### Accessing the Web Administration Console

MinIO includes a web-based administration console to manage buckets, inspect storage capacity, and manage credentials visually.

- **URL:** `http://<ANY_WORKER_IP>:9001` (e.g., `http://192.168.1.58:9001`)
- **Username:** `admin`
- **Password:** `password123`

---

## 4. Verification Checklist

Verify the following storage conditions are met before routing live camera alerts to the backend:

- [ ] **Port Availability:** Ensure port `9000` (S3 API) and port `9001` (Web Dashboard) are unblocked by firewalls.
- [ ] **Peer Communication:** Confirm that system logs (`journalctl -u minio`) show all nodes connecting to each other successfully without errors.
- [ ] **Directory Integrity:** Verify that directories listed within `MINIO_VOLUMES` match your actual hardware layout exactly to prevent runtime errors.
