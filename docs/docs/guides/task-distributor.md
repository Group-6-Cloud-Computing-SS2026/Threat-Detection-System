# Task 4: Task Distributor Guide

## Overview

This document covers the complete setup, and configuration for our system based on
[Task Distributor](https://github.com/christianbaun/task-distributor) to demonstrate
**Amdahl's Law** and **Gustafson's Law** on our Raspberry Pi cluster.

Task Distributor is a bash-based parallel image rendering tool that splits a POV-Ray
render job across multiple cluster nodes. The scene file used is `blob.pov` — a
built-in POV-Ray mathematical 3D scene (a metaball/blob shape) that ships with the
`povray-examples` package. No custom image is needed; POV-Ray generates the PNG from
the scene description. Each worker renders a horizontal strip of the final image,
making it ideal for demonstrating parallel computing laws.

---

## System Architecture

| Component | Hardware | IP | Role |
|-----------|----------|----|------|
| Master | Raspberry Pi 5 (8GB) | 192.168.1.50 | NFS Server, Job Coordinator |
| Worker 1 | Raspberry Pi 3 B+ | 192.168.1.58 | POV-Ray Renderer |
| Worker 2 | Raspberry Pi 3 B+ | 192.168.1.54 | POV-Ray Renderer |
| Worker 3 | Raspberry Pi 3 B+ | 192.168.1.104 | POV-Ray Renderer |
| Worker 4 | Raspberry Pi 3 B+ | 192.168.1.136 | POV-Ray Renderer |
| Worker 5 | Raspberry Pi 3 B+ | 192.168.1.86 | POV-Ray Renderer |
| Worker 6 | Raspberry Pi 3 B+ | 192.168.1.117 | POV-Ray Renderer |
| Worker 7 | Raspberry Pi 3 B+ | 192.168.1.83 | POV-Ray Renderer |
| Worker 8 | Raspberry Pi 3 B+ | 192.168.1.133 | POV-Ray Renderer |

> Workers are **diskless PXE-boot nodes** — they boot their entire OS from the
> master's SSD over NFS. All software installations must go through the master.

---

## How Task Distributor Works

```
Master Node
    │
    ├── Creates lockfile on shared NFS path
    ├── SSHs into each worker node in parallel
    │       Each worker:
    │         1. Renders its assigned rows using POV-Ray
    │         2. Crops its image strip using ImageMagick
    │         3. Saves strip to shared NFS folder
    │         4. Writes its IP into the lockfile
    ├── Master waits until all IPs appear in lockfile
    └── Master assembles all strips into final image
```

The image is split by rows. For N nodes, each node renders 1/N of the total rows.
The sequential portions are lockfile creation and final image assembly.

---

## Setup Guide (Quick Reference)

### 1. Boot Sequence
```bash
# Always boot master first, then workers
systemctl is-active dnsmasq nfs-kernel-server  # must both be active
```

### 2. Clone and Configure
```bash
cd ~
git clone https://github.com/christianbaun/task-distributor.git
cd task-distributor

# Update hardcoded hostnames to your worker IPs (line 67)
sed -i 's/HOSTS_ARRAY=(\[1\]=pi110 pi111 pi112 pi113 pi114 pi115 pi116 pi117)/HOSTS_ARRAY=([1]=192.168.1.58 192.168.1.54 192.168.1.104 192.168.1.136 192.168.1.86 192.168.1.117 192.168.1.83 192.168.1.133)/' \
  ~/task-distributor/task-distributor-master.sh

# Fix ImageMagick binary (Pi5 uses v7, not v6)
sed -i 's|/usr/bin/convert-im6.q16|/usr/bin/convert-im7.q16|g' \
  ~/task-distributor/task-distributor-master.sh
```

### 3. Install Dependencies on Workers
```bash
# Install via chroot (affects shared rootfs for all workers)
sudo chroot /nfs/rootfs64 /bin/bash -c \
  "apt-get update && apt-get install -y povray povray-examples imagemagick bc"

# Create and export shared workspace
sudo mkdir -p /mnt/ssd/nfs/hpl-results/task-distributor/workspace_{2n,4n,8n}
echo "/mnt/ssd/nfs/hpl-results 192.168.1.0/24(rw,sync,no_subtree_check,no_root_squash)" \
  | sudo tee -a /etc/exports
sudo exportfs -ra

# Fix permissions so workers (pi user) can write
sudo chmod -R 777 /mnt/ssd/nfs/hpl-results/task-distributor/

# Mount on all workers
for ip in 192.168.1.58 192.168.1.54 192.168.1.104 192.168.1.136 \
          192.168.1.86 192.168.1.117 192.168.1.83 192.168.1.133; do
  ssh -i ~/.ssh/id_ed25519 pi@$ip \
    "sudo mkdir -p /mnt/ssd/nfs/hpl-results && \
     sudo mount -o rw,soft,nolock 192.168.1.50:/mnt/ssd/nfs/hpl-results /mnt/ssd/nfs/hpl-results"
done
```

### 4. Deploy Worker Script
```bash
# SCP the modified worker script to all workers
for ip in 192.168.1.58 192.168.1.54 192.168.1.104 192.168.1.136 \
          192.168.1.86 192.168.1.117 192.168.1.83 192.168.1.133; do
  scp -i ~/.ssh/id_ed25519 \
    ~/task-distributor/task-distributor-worker.sh \
    pi@$ip:/home/pi/task-distributor-worker.sh
done
```

> Key modifications to the worker script:
> - Use `TERM=dumb` before POV-Ray to suppress terminal errors over SSH
> - Write worker IP (not hostname) to lockfile so master can match it
> - Use full path `/usr/bin/povray` and `/usr/bin/convert-im6.q16`

---

## Experiment 1: Amdahl's Law

### Theory

Amdahl's Law states that the speedup from parallelisation is limited by the
sequential fraction of the program:

```
Speedup(N) = 1 / (S + (1-S)/N)
```

Where S = sequential fraction, N = number of processors.

**Approach:** Keep the image size **fixed** at 320×240. Vary the number of nodes
(1, 2, 4, 8). Measure how much faster the parallel portion completes.

### Benchmark Commands

```bash
cd ~/task-distributor

# 1-node baseline
./task-distributor-master.sh -n 1 -x 320 -y 240 \
  -p /mnt/ssd/nfs/hpl-results/task-distributor/workspace_2n \
  -f -c | tee /mnt/ssd/nfs/hpl-results/task-distributor/amdahl_1node.txt

# 2-node run
./task-distributor-master.sh -n 2 -x 320 -y 240 \
  -p /mnt/ssd/nfs/hpl-results/task-distributor/workspace_2n \
  -f -c | tee /mnt/ssd/nfs/hpl-results/task-distributor/amdahl_2nodes.txt

# 4-node run
./task-distributor-master.sh -n 4 -x 320 -y 240 \
  -p /mnt/ssd/nfs/hpl-results/task-distributor/workspace_4n \
  -f -c | tee /mnt/ssd/nfs/hpl-results/task-distributor/amdahl_4nodes.txt

# 8-node run
./task-distributor-master.sh -n 8 -x 320 -y 240 \
  -p /mnt/ssd/nfs/hpl-results/task-distributor/workspace_8n \
  -f -c | tee /mnt/ssd/nfs/hpl-results/task-distributor/amdahl_8nodes.txt
```

### Alternatively you can also use the [run_task_distributor](../../../benchmark/run_task_distributor.sh) script  

# Usage: ./run_task_distributor.sh <nodes> <x_res> <y_res> <workspace_dir> <setup_flag> <runs>

```bash
./run_task_distributor.sh 8 1600 1200 /mnt/ssd/nfs/hpl-results/task-distributor/workspace_8n no 8
```

### Single-Run Results (Empirical — Measured on Physical Cluster)

| Nodes | Seq Part 1 | Parallel Part | Seq Part 2 | Total Time |
|-------|-----------|---------------|-----------|------------|
| 1     | 0.004s    | 4.018s        | 0.005s    | 4.027s     |
| 2     | 0.004s    | 3.018s        | 0.035s    | 3.057s     |
| 4     | 0.004s    | 3.028s        | 0.037s    | 3.069s     |
| 8     | 0.004s    | 4.056s        | 0.037s    | 4.097s     |

### Speedup Analysis (Single Run)

| Nodes | Total Time | Observed Speedup | Theoretical Speedup (S=0.002) |
|-------|-----------|-----------------|-------------------------------|
| 1     | 4.027s    | 1.00x (baseline) | 1.00x |
| 2     | 3.057s    | **1.32x**        | 1.99x |
| 4     | 3.069s    | **1.31x**        | 3.97x |
| 8     | 4.097s    | **0.98x**        | 7.84x |

---

## Experiment 2: Gustafson's Law

### Theory

Gustafson's Law addresses Amdahl's pessimism by noting that in practice, larger
problems benefit more from parallelism:

```
Scaled Speedup(N) = N - S × (N - 1)
```

**Approach:** Scale the image size proportionally with the number of nodes, keeping
the work per node constant (each node always renders 120 rows).

| Nodes | Image Size | Rows per Node |
|-------|-----------|---------------|
| 1     | 160×120   | 120 rows      |
| 2     | 160×240   | 120 rows each |
| 4     | 160×480   | 120 rows each |
| 8     | 160×960   | 120 rows each |


### Single-Run Results (Empirical — Measured on Physical Cluster)

| Nodes | Image Size | Seq Part 1 | Parallel Part | Seq Part 2 | Total Time |
|-------|-----------|-----------|---------------|-----------|------------|
| 1     | 160×120   | 0.004s    | 3.014s        | 0.006s    | 3.024s     |
| 2     | 160×240   | 0.004s    | 3.019s        | 0.034s    | 3.057s     |
| 4     | 160×480   | 0.004s    | 3.030s        | 0.044s    | 3.078s     |
| 8     | 160×960   | 0.004s    | 4.063s        | 0.088s    | 4.155s     |

---

## Troubleshooting Reference

| Problem | Cause | Fix |
|---------|-------|-----|
| `ssh: No route to host` | Workers not booted | Follow golden boot sequence |
| `Could not resolve hostname pi110` | Hardcoded hostnames in script | Update `HOSTS_ARRAY` in master script |
| `lockfile already exists` | Previous run failed | `rm -f workspace_*/lockfile` |
| `Permission denied on workspace` | Workers (pi user) can't write to cc123 folder | `sudo chmod -R 777 /mnt/ssd/nfs/hpl-results/task-distributor/` |
| `convert: command not found` | Wrong ImageMagick binary name | Use `convert-im6.q16` on workers, `convert-im7.q16` on master |
| `Error opening terminal: unknown` | POV-Ray needs TTY | Add `TERM=dumb` before povray command |
| `No such file or directory: blob.png` | POV-Ray not rendering | Check `TERM=dumb` and correct `+I` path |
| `*pi*.png: No such file` | Master looking for wrong filename | Worker writes IP.png not hostname.png |
| Workers write wrong name to lockfile | Script uses `hostname` | Change to `hostname -I \| awk '{print $1}'` |

---

## File Locations

```
~/task-distributor/
├── task-distributor-master.sh    # Modified master script
└── task-distributor-worker.sh    # Modified worker script
└── gustafsons_results            # results in csv
└── amdahl_results                # in the format results_[WxH]_[count_of_nodes]_nodes.csv

/mnt/ssd/nfs/hpl-results/task-distributor/
├── amdahl_1node.txt              # Amdahl 1-node logs
├── amdahl_2nodes.txt             # Amdahl 2-node logs
├── amdahl_4nodes.txt             # Amdahl 4-node logs
├── amdahl_8nodes.txt             # Amdahl 8-node logs
├── gustafson_1node.txt           # Gustafson 1-node logs
├── gustafson_2nodes.txt          # Gustafson 2-node logs
├── gustafson_4nodes.txt          # Gustafson 4-node logs
├── gustafson_8nodes.txt          # Gustafson 8-node logs
├── workspace_2n/                 # 2-node workspace
├── workspace_4n/                 # 4-node workspace
└── workspace_8n/                 # 8-node workspace
```

You can also find some logs in the benchmark folder

---

*Cloud Computing Course SS2026 — Frankfurt University of Applied Sciences*
*Date: July 12, 2026*

## Issues and Fixes
#### Memory issues
These occur for larger image sizes 6400 x 4800 especially if the number of nodes are less. We added a storage space for workers for support via changes to [task-distributor-worker](../../../benchmark/task-distributor-worker.sh). The script uses a storage space for each worker if the size exceeds 3200 x 2400. All the 6400 x H results were obtained after this updated.

#### Unordered composed image
Added a fix where the image composed of image cuts generated by worker hosts produce an unordered image 

![Before](../assets/output_400x300_8_nodes_2026_07_12_06:23:07.png)
![After](../assets/output_400x300_8_nodes_2026_07_12_07:21:14.png)


#### Failed runs

#### 5400x2400 / 4 nodes
![5400x2400_4_nodes](../assets/output_5400x2400_4_nodes_2026_07_13_10:29:10.png)
#### 6400x2400 / 4 nodes
![6400x2400_4_nodes](../assets/output_6400x2400_4_nodes_2026_07_13_09:27:03.png)
#### 6400x2400 / 4 nodes
![6400x2400_4_nodes](../assets/output_6400x2400_4_nodes_2026_07_13_09:41:18.png)
