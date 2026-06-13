# Ansible Setup Guide

This guide covers the deployment of **Ansible** on the Raspberry Pi 5 "Master"

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
