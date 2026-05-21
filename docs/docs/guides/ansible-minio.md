# Ansible & MinIO Setup Guide

This guide covers the deployment of **Ansible** on the Raspberry Pi 5 "Master" and the subsequent installation and configuration of a distributed **MinIO** cluster across the Raspberry Pi 3 nodes.

---

## Part 1: Ansible Orchestration

### Step 1 — Install Ansible on Pi 5

Run this on your Pi 5 Master to install the orchestration engine.

```bash
sudo apt update
sudo apt install ansible sshpass -y
```

!!! note
    `sshpass` is used for initial password authentication. Once SSH keys are exchanged, it can be removed.

### Step 2 — Create Your Inventory

The inventory file tells Ansible which nodes to control.

```bash
mkdir ~/pi-cluster && cd ~/pi-cluster
nano hosts.ini
```

Paste the following configuration (update IPs to match your specific nodes):

```ini
[workers]
worker1 ansible_host=192.168.1.101
worker2 ansible_host=192.168.1.102
worker3 ansible_host=192.168.1.103
worker4 ansible_host=192.168.1.104
# Add other working nodes here...

[workers:vars]
ansible_user=pi
ansible_ssh_pass=raspberry
ansible_ssh_common_args='-o StrictHostKeyChecking=no'
```

### Step 3 — Connection Test ("The First Salute")

Verify connectivity to your nodes using the Ansible ping module:

```bash
ansible workers -i hosts.ini -m ping
```

- **SUCCESS (Green):** The node is ready.
- **UNREACHABLE (Red):** Check network connectivity or passwords.

### Step 4 — Configure SSH Key-Based Authentication

To improve security and speed, move from passwords to a "digital handshake."

Generate the key on Pi 5:

```bash
ssh-keygen -t ed25519
```

Push the key to workers (repeat for each worker IP):

```bash
ssh-copy-id pi@192.168.1.101
```

!!! tip
    Once keys are copied, you may remove `ansible_ssh_pass` from your `hosts.ini`.

---

## Part 2: Preparing Storage for MinIO

Since the Pi 3 nodes boot via PXE/NFS, their local SD cards are unused. We will repurpose them as high-speed storage for MinIO.

### Step 1 — Create Mount Points on Master

Create the directory in the shared NFS root so it exists for all nodes:

```bash
sudo mkdir -p /nfs/rootfs/mnt/minio_data
```

### Step 2 — Create the Disk Preparation Playbook

```bash
nano prepare_disks.yml
```

Paste the following:

```yaml
---
- name: Prepare RPi3 SD Cards for MinIO
  hosts: workers
  become: yes
  tasks:
    - name: Create ext4 filesystem on the SD card
      filesystem:
        fstype: ext4
        dev: /dev/mmcblk0
        force: yes

    - name: Mount SD card to /mnt/minio_data
      mount:
        path: /mnt/minio_data
        src: /dev/mmcblk0
        fstype: ext4
        state: mounted
```

### Step 3 — Run the Preparation Playbook

```bash
ansible-playbook -i hosts.ini prepare_disks.yml
```

---

## Part 3: Installing MinIO

### Step 1 — Install MinIO on the Golden Image

We install the binary once on the shared root; all nodes will see it instantly.

```bash
# Download ARM version for Raspberry Pi
sudo wget https://dl.min.io/server/minio/release/linux-arm/minio -O /nfs/rootfs/usr/local/bin/minio

# Set permissions
sudo chmod +x /nfs/rootfs/usr/local/bin/minio
```

### Step 2 — Verify Visibility

Ask the cluster if they can "see" the binary:

```bash
ansible workers -i hosts.ini -a "minio --version"
```

### Step 3 — Create the Startup Playbook

```bash
nano start_minio.yml
```

Paste the following configuration:

```yaml
---
- name: Deploy Distributed MinIO Service
  hosts: workers
  become: yes
  vars:
    # Update this range to match your actual worker IPs
    minio_nodes: "http://192.168.1.{101...107}/mnt/minio_data"
    minio_user: "admin"
    minio_pass: "password123"
  tasks:
    - name: Create MinIO environment file
      copy:
        dest: /etc/default/minio
        content: |
          MINIO_ROOT_USER="{{ minio_user }}"
          MINIO_ROOT_PASSWORD="{{ minio_pass }}"
          MINIO_VOLUMES="{{ minio_nodes }}"
          MINIO_OPTS="--address :9000 --console-address :9001"

    - name: Create Systemd service file
      copy:
        dest: /etc/systemd/system/minio.service
        content: |
          [Unit]
          Description=MinIO
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

    - name: Reload systemd and start MinIO
      systemd:
        name: minio
        state: restarted
        daemon_reload: yes
        enabled: yes
```

### Step 4 — Launch the Cluster

```bash
ansible-playbook -i hosts.ini start_minio.yml
```

---

## Part 4: Management & Maintenance

### Monitoring

- **Service Status:**
  ```bash
  ansible workers -i hosts.ini -a "systemctl status minio"
  ```
- **Web Dashboard:** Access `http://<ANY_WORKER_IP>:9001` (Login: `admin` / `password123`)

### Common Admin Commands

| Action             | Command                                                                                         |
| :----------------- | :---------------------------------------------------------------------------------------------- |
| **Restart MinIO**  | `ansible workers -i hosts.ini -m systemd -a "name=minio state=restarted" --become`              |
| **Sync Date/Time** | `ansible workers -i hosts.ini -m shell -a "date -s '$(date -u +'%Y-%m-%d %H:%M:%S')'" --become` |
| **Check Disk**     | `ansible workers -i hosts.ini -a "df -h /mnt/minio_data"`                                       |

---

## Quick Reference: Cluster Directory (Pi 5)

```text
~/pi-cluster/
├── hosts.ini           ← Inventory (Node IPs)
├── prepare_disks.yml   ← Storage setup script
└── start_minio.yml     ← Cluster deployment script
```
