# Basic User Guide

Day-to-day operations reference for the Raspberry Pi cluster, covering Ansible command patterns, MinIO management, directory layout, and troubleshooting.

---

## 1. Running in Batch (The "All-at-Once" Way)

This is the default. It is the fastest way to update the whole cluster.

### Ad-Hoc Commands

If you just want to run a quick shell command on every worker:

```bash
ansible workers -i hosts.ini -a "uptime"
```

Ansible opens 5 parallel connections and runs the command simultaneously.

### Installing a Package (Batch)

To install something like `htop` on every node at once:

```bash
ansible workers -i hosts.ini -m apt -a "name=htop state=present" --become
```

!!! note
    The `-m apt` flag tells Ansible to use the package manager module.

---

## 2. Running "One-by-One" (Serial Execution)

Sometimes running a command on all Pi 3s at once can lag the network (since they are all booting/loading from the Pi 5's disk). To fix this, use the **Serial** limit.

### One-by-One Ad-Hoc

```bash
ansible workers -i hosts.ini -a "reboot" --become --forks 1
```

The `--forks 1` flag tells Ansible to only talk to **one node at a time**. It will finish Worker 1, then move to Worker 2.

### Using a Playbook (Professional Way)

If you are writing a `.yml` file, you can bake the "one-by-one" logic into the script using the `serial` keyword.

Create a file called `update.yml`:

```yaml
- name: Update workers one by one
  hosts: workers
  serial: 1  # This forces one-at-a-time execution
  tasks:
    - name: Update apt cache
      apt:
        update_cache: yes

    - name: Install a package
      apt:
        name: git
        state: present
```

Run it:

```bash
ansible-playbook -i hosts.ini update.yml --become
```

---

## 3. Running on a Specific Node (Targeting)

If you only want to touch **Worker 3**, use the specific name from your `hosts.ini` instead of the `workers` group name:

```bash
ansible worker3 -i hosts.ini -a "df -h"
```

### Summary: Which Method to Use?

| Goal          | Command Logic                   | Best For                                  |
| :------------ | :------------------------------ | :---------------------------------------- |
| **Speed**     | `ansible workers ...`           | Quick checks, status updates.             |
| **Stability** | `ansible workers ... --forks 1` | Reboots, heavy installs, kernel updates.  |
| **Precision** | `ansible worker1 ...`           | Troubleshooting a single failing node.    |

---

## 4. Health Checks

### Disk Space

Shows how much disk space is left on the network-booted drives:

```bash
ansible workers -i hosts.ini -a "df -h /"
```

### Memory Usage

Shows RAM usage on the Pi 3s:

```bash
ansible workers -i hosts.ini -a "free -m"
```

### Verifying Time Synchronization

!!! warning
    MinIO will crash if the time is wrong. All workers **must** show the same date and time as the Pi 5. If one is off by more than a few seconds, MinIO will fail.

Check time across all nodes:

```bash
ansible workers -i hosts.ini -a "date"
```

Manually re-sync time (the "hammer" fix) — use this if the dashboard is inaccessible due to "Time Skew":

```bash
ansible workers -i hosts.ini -m shell -a "date -s '$(date -u +'%Y-%m-%d %H:%M:%S')'" --become
```

---

## 5. MinIO Storage & Dashboard

### Check MinIO Service Status

Ensures the MinIO background process is running on all workers:

```bash
ansible workers -i hosts.ini -m systemd -a "name=minio state=started"
```

### Accessing the Dashboard (Web Browser)

Open a browser and go to:

- **URL:** `http://192.168.1.104:9001`
- **Port 9000:** Used for API/Data traffic.
- **Port 9001:** Used for the visual User Interface (Dashboard).

---

## 6. Cluster Directory Architecture

### The Master Directory (`~/pi-cluster`)

This is your **Command Center**. It lives in the home folder of the `cc123` user on the Pi 5.

- **Path:** `/home/cc123/pi-cluster/`
- **Key Files:**
    - `hosts.ini` — The "address book" containing the IPs of all your workers.
    - `*.yml` files — Your Ansible Playbooks (the scripts that automate the cluster).

!!! tip
    Always `cd ~/pi-cluster` before running any `ansible` commands.

### The Network Boot Directory (`/nfs`)

This is where the "Brains" of the Worker nodes live. Since the Pi 3s have no SD cards, they look here to load their Operating System.

- **Path:** `/nfs/`
- **Structure:**
    - `/nfs/root` — The "Golden Image." This is the template OS. Changes here can affect how new nodes boot.
    - `/nfs/<serial>/` — Individual file systems for each worker.

!!! info "Worker Serial Numbers"
    | Serial     | Hostname     |
    | :--------- | :----------- |
    | `a7b7e022` | pi3-worker1  |
    | `2c900aeb` | pi3-worker2  |
    | `2f14a0f1` | pi3-worker3  |
    | `33cc973b` | pi3-worker4  |
    | `5ee65e7e` | pi3-worker5  |
    | `c4ff9387` | pi3-worker6  |
    | `f2893559` | pi3-worker7  |
    | `c782ffc3` | pi3-worker8  |

!!! note
    If worker1 creates a file in its own `/home` directory, that file is actually physically sitting on the Pi 5 at `/nfs/<serial>/home/cc123/`.

### The MinIO Data Directory (Storage)

This is where the actual data (the objects/files you upload to MinIO) is stored.

- **Path on Workers:** `/mnt/data`
- **Physical Path on Pi 5:** `/nfs/nodeX/mnt/data`
- MinIO pools these directories together across all nodes to create one large, redundant storage drive.

---

## 7. Essential Directory Commands

**See what the workers see** — check a file inside Worker 3 without SSHing into it:

```bash
ls /nfs/<serial>/etc/
```

**Check disk usage across the cluster:**

```bash
ansible workers -i hosts.ini -m shell -a "df -h /"
```

**Update a file on ALL nodes (the Ansible way):**

```bash
ansible workers -i hosts.ini -m copy -a "src=/home/cc123/new_config.txt dest=/etc/config.txt" --become
```

---

## 8. Troubleshooting Checklist

If the system isn't working, follow these steps in order:

1. **Network:** Can you `ping 192.168.1.104`?
2. **Time:** Run `ansible workers -i hosts.ini -a "date"` — Is it today's date?
3. **Services:** Run `ansible workers -i hosts.ini -m shell -a "systemctl status minio"` — Is it "active (running)"?
4. **Logs:** If a node is failing, check the error:
   ```bash
   ansible worker1 -i hosts.ini -a "journalctl -u minio -n 50"
   ```

!!! danger "Critical Rules"
    - **Don't delete folders in `/nfs`:** If you delete `/nfs/node1`, Worker 1 will "die" instantly because its entire Operating System just vanished.
    - **The `--become` flag:** When using Ansible to look at system directories (like `/etc` or `/root`), always add `--become` to get sudo privileges.
    - **Path consistency:** Remember that `/home/cc123` on the **Master** is different from `/home/cc123` on a **Worker**, even though they look the same.
