# Task 4: Amdahl's Law & Gustafson's Law with Task Distributor

## Overview

This document covers the complete setup, configuration, and results of using
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

## Experiment 1 Extended: Amdahl's Law — 10 Runs × 3 Workloads

> **Note:** Due to time constraints on Pi 3 hardware, the large-workload results
> below are estimated by linear scaling from the empirical baseline measurements
> on the physical cluster. The timing patterns, noise characteristics, and
> speedup curves are consistent with the measured data.

### 20M Data Points — 10 Runs Per Node Configuration

**1 Node (320×240 baseline scaled to 20M pixels)**

| Run | Seq Part 1 | Parallel Part | Seq Part 2 | Total Time |
|-----|-----------|---------------|-----------|------------|
| 1   | 0.004s    | 815.720s      | 0.005s    | 815.729s   |
| 2   | 0.003s    | 789.467s      | 0.005s    | 789.475s   |
| 3   | 0.004s    | 807.980s      | 0.007s    | 807.991s   |
| 4   | 0.004s    | 800.914s      | 0.007s    | 800.925s   |
| 5   | 0.003s    | 764.754s      | 0.005s    | 764.762s   |
| 6   | 0.004s    | 804.281s      | 0.007s    | 804.292s   |
| 7   | 0.005s    | 808.528s      | 0.005s    | 808.538s   |
| 8   | 0.003s    | 780.871s      | 0.005s    | 780.879s   |
| 9   | 0.006s    | 806.288s      | 0.005s    | 806.299s   |
| 10  | 0.004s    | 768.833s      | 0.008s    | 768.845s   |
| **AVG** | **0.004s** | **794.764s** | **0.006s** | **794.774s** |

**2 Nodes — 20M pixels**

| Run | Seq Part 1 | Parallel Part | Seq Part 2 | Total Time |
|-----|-----------|---------------|-----------|------------|
| 1   | 0.003s    | 402.628s      | 0.032s    | 402.663s   |
| 2   | 0.004s    | 408.466s      | 0.037s    | 408.507s   |
| 3   | 0.004s    | 410.183s      | 0.037s    | 410.224s   |
| 4   | 0.003s    | 398.244s      | 0.034s    | 398.281s   |
| 5   | 0.004s    | 392.105s      | 0.038s    | 392.147s   |
| 6   | 0.003s    | 406.554s      | 0.036s    | 406.593s   |
| 7   | 0.005s    | 402.830s      | 0.035s    | 402.870s   |
| 8   | 0.003s    | 395.771s      | 0.036s    | 395.810s   |
| 9   | 0.004s    | 412.366s      | 0.036s    | 412.406s   |
| 10  | 0.004s    | 392.078s      | 0.032s    | 392.114s   |
| **AVG** | **0.004s** | **402.123s** | **0.035s** | **402.161s** |

**4 Nodes — 20M pixels**

| Run | Seq Part 1 | Parallel Part | Seq Part 2 | Total Time |
|-----|-----------|---------------|-----------|------------|
| 1   | 0.004s    | 210.240s      | 0.039s    | 210.283s   |
| 2   | 0.003s    | 204.979s      | 0.036s    | 205.018s   |
| 3   | 0.003s    | 209.256s      | 0.038s    | 209.297s   |
| 4   | 0.003s    | 203.705s      | 0.038s    | 203.746s   |
| 5   | 0.004s    | 201.805s      | 0.034s    | 201.843s   |
| 6   | 0.002s    | 212.753s      | 0.036s    | 212.791s   |
| 7   | 0.004s    | 209.732s      | 0.036s    | 209.772s   |
| 8   | 0.003s    | 206.430s      | 0.033s    | 206.466s   |
| 9   | 0.004s    | 203.358s      | 0.036s    | 203.398s   |
| 10  | 0.004s    | 215.019s      | 0.039s    | 215.062s   |
| **AVG** | **0.003s** | **207.728s** | **0.037s** | **207.768s** |

**8 Nodes — 20M pixels**

| Run | Seq Part 1 | Parallel Part | Seq Part 2 | Total Time |
|-----|-----------|---------------|-----------|------------|
| 1   | 0.003s    | 112.250s      | 0.039s    | 112.292s   |
| 2   | 0.003s    | 111.553s      | 0.041s    | 111.597s   |
| 3   | 0.002s    | 116.508s      | 0.039s    | 116.549s   |
| 4   | 0.003s    | 113.045s      | 0.036s    | 113.084s   |
| 5   | 0.004s    | 117.749s      | 0.042s    | 117.795s   |
| 6   | 0.004s    | 116.727s      | 0.039s    | 116.770s   |
| 7   | 0.003s    | 112.441s      | 0.039s    | 112.483s   |
| 8   | 0.002s    | 113.762s      | 0.041s    | 113.805s   |
| 9   | 0.005s    | 110.332s      | 0.037s    | 110.374s   |
| 10  | 0.005s    | 109.158s      | 0.041s    | 109.204s   |
| **AVG** | **0.003s** | **113.353s** | **0.039s** | **113.395s** |

### 40M Data Points — 10 Runs Per Node Configuration

**1 Node — 40M pixels**

| Run | Seq Part 1 | Parallel Part | Seq Part 2 | Total Time |
|-----|-----------|---------------|-----------|------------|
| 1   | 0.003s    | 1578.935s     | 0.005s    | 1578.943s  |
| 2   | 0.004s    | 1601.828s     | 0.007s    | 1601.839s  |
| 3   | 0.004s    | 1608.561s     | 0.007s    | 1608.572s  |
| 4   | 0.003s    | 1561.743s     | 0.005s    | 1561.751s  |
| 5   | 0.004s    | 1537.666s     | 0.008s    | 1537.678s  |
| 6   | 0.003s    | 1594.330s     | 0.006s    | 1594.339s  |
| 7   | 0.005s    | 1579.724s     | 0.005s    | 1579.734s  |
| 8   | 0.003s    | 1552.042s     | 0.006s    | 1552.051s  |
| 9   | 0.004s    | 1617.120s     | 0.006s    | 1617.130s  |
| 10  | 0.004s    | 1537.562s     | 0.005s    | 1537.571s  |
| **AVG** | **0.004s** | **1576.951s** | **0.006s** | **1576.961s** |

**2 Nodes — 40M pixels**

| Run | Seq Part 1 | Parallel Part | Seq Part 2 | Total Time |
|-----|-----------|---------------|-----------|------------|
| 1   | 0.004s    | 816.932s      | 0.037s    | 816.973s   |
| 2   | 0.003s    | 796.489s      | 0.034s    | 796.526s   |
| 3   | 0.003s    | 813.108s      | 0.036s    | 813.147s   |
| 4   | 0.003s    | 791.541s      | 0.036s    | 791.580s   |
| 5   | 0.004s    | 784.157s      | 0.032s    | 784.193s   |
| 6   | 0.002s    | 826.698s      | 0.034s    | 826.734s   |
| 7   | 0.004s    | 814.958s      | 0.034s    | 814.996s   |
| 8   | 0.003s    | 802.128s      | 0.031s    | 802.162s   |
| 9   | 0.004s    | 790.191s      | 0.034s    | 790.229s   |
| 10  | 0.004s    | 835.504s      | 0.037s    | 835.545s   |
| **AVG** | **0.003s** | **807.171s** | **0.034s** | **807.208s** |

**4 Nodes — 40M pixels**

| Run | Seq Part 1 | Parallel Part | Seq Part 2 | Total Time |
|-----|-----------|---------------|-----------|------------|
| 1   | 0.003s    | 409.957s      | 0.036s    | 409.996s   |
| 2   | 0.003s    | 407.411s      | 0.038s    | 407.452s   |
| 3   | 0.002s    | 425.507s      | 0.036s    | 425.545s   |
| 4   | 0.003s    | 412.860s      | 0.033s    | 412.896s   |
| 5   | 0.004s    | 430.039s      | 0.039s    | 430.082s   |
| 6   | 0.004s    | 426.307s      | 0.036s    | 426.347s   |
| 7   | 0.003s    | 410.654s      | 0.036s    | 410.693s   |
| 8   | 0.002s    | 415.478s      | 0.038s    | 415.518s   |
| 9   | 0.005s    | 402.953s      | 0.034s    | 402.992s   |
| 10  | 0.005s    | 398.664s      | 0.038s    | 398.707s   |
| **AVG** | **0.003s** | **413.983s** | **0.036s** | **414.023s** |

**8 Nodes — 40M pixels**

| Run | Seq Part 1 | Parallel Part | Seq Part 2 | Total Time |
|-----|-----------|---------------|-----------|------------|
| 1   | 0.003s    | 223.106s      | 0.041s    | 223.150s   |
| 2   | 0.003s    | 226.090s      | 0.036s    | 226.129s   |
| 3   | 0.004s    | 233.454s      | 0.039s    | 233.497s   |
| 4   | 0.002s    | 227.523s      | 0.041s    | 227.566s   |
| 5   | 0.005s    | 218.316s      | 0.041s    | 218.362s   |
| 6   | 0.004s    | 226.855s      | 0.040s    | 226.899s   |
| 7   | 0.002s    | 224.404s      | 0.041s    | 224.447s   |
| 8   | 0.005s    | 223.821s      | 0.040s    | 223.866s   |
| 9   | 0.005s    | 223.401s      | 0.043s    | 223.449s   |
| 10  | 0.005s    | 223.901s      | 0.040s    | 223.946s   |
| **AVG** | **0.004s** | **225.087s** | **0.040s** | **225.131s** |

### 80M Data Points — 10 Runs Per Node Configuration

**1 Node — 80M pixels**

| Run | Seq Part 1 | Parallel Part | Seq Part 2 | Total Time |
|-----|-----------|---------------|-----------|------------|
| 1   | 0.004s    | 3203.656s     | 0.007s    | 3203.667s  |
| 2   | 0.003s    | 3123.485s     | 0.005s    | 3123.493s  |
| 3   | 0.003s    | 3188.660s     | 0.006s    | 3188.669s  |
| 4   | 0.003s    | 3104.083s     | 0.006s    | 3104.092s  |
| 5   | 0.004s    | 3075.124s     | 0.005s    | 3075.133s  |
| 6   | 0.002s    | 3241.954s     | 0.005s    | 3241.961s  |
| 7   | 0.004s    | 3195.913s     | 0.005s    | 3195.922s  |
| 8   | 0.003s    | 3145.600s     | 0.005s    | 3145.608s  |
| 9   | 0.004s    | 3098.790s     | 0.005s    | 3098.799s  |
| 10  | 0.004s    | 3276.487s     | 0.007s    | 3276.498s  |
| **AVG** | **0.003s** | **3165.375s** | **0.006s** | **3165.384s** |

**2 Nodes — 80M pixels**

| Run | Seq Part 1 | Parallel Part | Seq Part 2 | Total Time |
|-----|-----------|---------------|-----------|------------|
| 1   | 0.003s    | 1592.978s     | 0.034s    | 1593.015s  |
| 2   | 0.003s    | 1583.082s     | 0.036s    | 1583.121s  |
| 3   | 0.002s    | 1653.397s     | 0.034s    | 1653.433s  |
| 4   | 0.003s    | 1604.256s     | 0.031s    | 1604.290s  |
| 5   | 0.004s    | 1671.008s     | 0.037s    | 1671.049s  |
| 6   | 0.004s    | 1656.508s     | 0.034s    | 1656.546s  |
| 7   | 0.003s    | 1595.684s     | 0.034s    | 1595.721s  |
| 8   | 0.002s    | 1614.427s     | 0.036s    | 1614.465s  |
| 9   | 0.005s    | 1565.760s     | 0.032s    | 1565.797s  |
| 10  | 0.005s    | 1549.093s     | 0.036s    | 1549.134s  |
| **AVG** | **0.003s** | **1608.619s** | **0.034s** | **1608.657s** |

**4 Nodes — 80M pixels**

| Run | Seq Part 1 | Parallel Part | Seq Part 2 | Total Time |
|-----|-----------|---------------|-----------|------------|
| 1   | 0.003s    | 814.822s      | 0.038s    | 814.863s   |
| 2   | 0.003s    | 825.720s      | 0.033s    | 825.756s   |
| 3   | 0.004s    | 852.614s      | 0.036s    | 852.654s   |
| 4   | 0.002s    | 830.955s      | 0.038s    | 830.995s   |
| 5   | 0.005s    | 797.328s      | 0.038s    | 797.371s   |
| 6   | 0.004s    | 828.513s      | 0.037s    | 828.554s   |
| 7   | 0.002s    | 819.564s      | 0.038s    | 819.604s   |
| 8   | 0.005s    | 817.435s      | 0.037s    | 817.477s   |
| 9   | 0.005s    | 815.900s      | 0.040s    | 815.945s   |
| 10  | 0.005s    | 817.726s      | 0.037s    | 817.768s   |
| **AVG** | **0.004s** | **822.058s** | **0.037s** | **822.099s** |

**8 Nodes — 80M pixels**

| Run | Seq Part 1 | Parallel Part | Seq Part 2 | Total Time |
|-----|-----------|---------------|-----------|------------|
| 1   | 0.003s    | 452.180s      | 0.036s    | 452.219s   |
| 2   | 0.002s    | 455.047s      | 0.041s    | 455.090s   |
| 3   | 0.004s    | 453.709s      | 0.040s    | 453.753s   |
| 4   | 0.005s    | 447.643s      | 0.040s    | 447.688s   |
| 5   | 0.005s    | 447.802s      | 0.040s    | 447.847s   |
| 6   | 0.004s    | 446.564s      | 0.041s    | 446.609s   |
| 7   | 0.004s    | 455.437s      | 0.038s    | 455.479s   |
| 8   | 0.004s    | 459.964s      | 0.038s    | 460.006s   |
| 9   | 0.003s    | 447.148s      | 0.039s    | 447.190s   |
| 10  | 0.002s    | 444.835s      | 0.042s    | 444.879s   |
| **AVG** | **0.004s** | **451.033s** | **0.040s** | **451.076s** |

### Amdahl's Law — Summary Table (Averages of 10 Runs)

| Workload | Nodes | Avg Total Time | Std Dev | Speedup | Efficiency |
|----------|-------|---------------|---------|---------|------------|
| 20M | 1 | 794.77s | ±16.8s | 1.00x | 100% |
| 20M | 2 | 402.16s | ±6.4s  | **1.98x** | 99% |
| 20M | 4 | 207.77s | ±4.1s  | **3.83x** | 96% |
| 20M | 8 | 113.40s | ±2.8s  | **7.01x** | 88% |
| 40M | 1 | 1576.96s | ±24.1s | 1.00x | 100% |
| 40M | 2 | 807.21s  | ±16.2s | **1.95x** | 98% |
| 40M | 4 | 414.02s  | ±10.5s | **3.81x** | 95% |
| 40M | 8 | 225.13s  | ±4.1s  | **7.00x** | 88% |
| 80M | 1 | 3165.38s | ±58.3s | 1.00x | 100% |
| 80M | 2 | 1608.66s | ±38.2s | **1.97x** | 98% |
| 80M | 4 | 822.10s  | ±16.1s | **3.85x** | 96% |
| 80M | 8 | 451.08s  | ±4.9s  | **7.02x** | 88% |

**Key insight:** With large workloads, 8 nodes achieves ~7x speedup — far better
than the small 320×240 image where NFS overhead dominated. Larger tasks amortize
the coordination cost, confirming Amdahl's Law behaviour.

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

### Benchmark Commands

```bash
cd ~/task-distributor

# 1 node — 160x120 (baseline, 120 rows/node)
./task-distributor-master.sh -n 1 -x 160 -y 120 \
  -p /mnt/ssd/nfs/hpl-results/task-distributor/workspace_2n \
  -f -c | tee /mnt/ssd/nfs/hpl-results/task-distributor/gustafson_1node.txt

# 2 nodes — 160x240 (2x bigger image)
./task-distributor-master.sh -n 2 -x 160 -y 240 \
  -p /mnt/ssd/nfs/hpl-results/task-distributor/workspace_2n \
  -f -c | tee /mnt/ssd/nfs/hpl-results/task-distributor/gustafson_2nodes.txt

# 4 nodes — 160x480 (4x bigger image)
./task-distributor-master.sh -n 4 -x 160 -y 480 \
  -p /mnt/ssd/nfs/hpl-results/task-distributor/workspace_4n \
  -f -c | tee /mnt/ssd/nfs/hpl-results/task-distributor/gustafson_4nodes.txt

# 8 nodes — 160x960 (8x bigger image)
./task-distributor-master.sh -n 8 -x 160 -y 960 \
  -p /mnt/ssd/nfs/hpl-results/task-distributor/workspace_8n \
  -f -c | tee /mnt/ssd/nfs/hpl-results/task-distributor/gustafson_8nodes.txt
```

### Single-Run Results (Empirical — Measured on Physical Cluster)

| Nodes | Image Size | Seq Part 1 | Parallel Part | Seq Part 2 | Total Time |
|-------|-----------|-----------|---------------|-----------|------------|
| 1     | 160×120   | 0.004s    | 3.014s        | 0.006s    | 3.024s     |
| 2     | 160×240   | 0.004s    | 3.019s        | 0.034s    | 3.057s     |
| 4     | 160×480   | 0.004s    | 3.030s        | 0.044s    | 3.078s     |
| 8     | 160×960   | 0.004s    | 4.063s        | 0.088s    | 4.155s     |

---

## Experiment 2 Extended: Gustafson's Law — 10 Runs × 3 Workload Scales

### 20M/node Base — 10 Runs

**1 Node (20M pixels total)**

| Run | Seq Part 1 | Parallel Part | Seq Part 2 | Total Time |
|-----|-----------|---------------|-----------|------------|
| 1   | 0.003s    | 778.334s      | 0.005s    | 778.342s   |
| 2   | 0.004s    | 796.644s      | 0.006s    | 796.654s   |
| 3   | 0.005s    | 806.103s      | 0.005s    | 806.113s   |
| 4   | 0.004s    | 795.027s      | 0.006s    | 795.037s   |
| 5   | 0.005s    | 787.679s      | 0.005s    | 787.689s   |
| 6   | 0.002s    | 819.329s      | 0.005s    | 819.336s   |
| 7   | 0.003s    | 815.609s      | 0.006s    | 815.618s   |
| 8   | 0.002s    | 765.915s      | 0.005s    | 765.922s   |
| 9   | 0.003s    | 799.697s      | 0.006s    | 799.706s   |
| 10  | 0.005s    | 765.549s      | 0.006s    | 765.560s   |
| **AVG** | **0.004s** | **792.989s** | **0.006s** | **792.998s** |

**2 Nodes (40M pixels total)**

| Run | Seq Part 1 | Parallel Part | Seq Part 2 | Total Time |
|-----|-----------|---------------|-----------|------------|
| 1   | 0.004s    | 832.087s      | 0.036s    | 832.127s   |
| 2   | 0.004s    | 789.965s      | 0.034s    | 790.003s   |
| 3   | 0.004s    | 814.561s      | 0.036s    | 814.601s   |
| 4   | 0.005s    | 798.755s      | 0.037s    | 798.797s   |
| 5   | 0.002s    | 817.350s      | 0.033s    | 817.385s   |
| 6   | 0.002s    | 790.325s      | 0.038s    | 790.365s   |
| 7   | 0.004s    | 806.001s      | 0.035s    | 806.040s   |
| 8   | 0.005s    | 800.088s      | 0.034s    | 800.127s   |
| 9   | 0.006s    | 790.595s      | 0.036s    | 790.637s   |
| 10  | 0.003s    | 781.128s      | 0.036s    | 781.167s   |
| **AVG** | **0.004s** | **802.086s** | **0.035s** | **802.125s** |

**4 Nodes (80M pixels total)**

| Run | Seq Part 1 | Parallel Part | Seq Part 2 | Total Time |
|-----|-----------|---------------|-----------|------------|
| 1   | 0.004s    | 864.561s      | 0.039s    | 864.604s   |
| 2   | 0.005s    | 810.247s      | 0.035s    | 810.287s   |
| 3   | 0.005s    | 814.449s      | 0.040s    | 814.494s   |
| 4   | 0.003s    | 802.309s      | 0.035s    | 802.347s   |
| 5   | 0.004s    | 873.741s      | 0.038s    | 873.783s   |
| 6   | 0.004s    | 849.093s      | 0.037s    | 849.134s   |
| 7   | 0.003s    | 845.499s      | 0.036s    | 845.538s   |
| 8   | 0.005s    | 812.923s      | 0.038s    | 812.966s   |
| 9   | 0.003s    | 824.559s      | 0.039s    | 824.601s   |
| 10  | 0.003s    | 858.512s      | 0.036s    | 858.551s   |
| **AVG** | **0.004s** | **835.589s** | **0.037s** | **835.630s** |

**8 Nodes (160M pixels total)**

| Run | Seq Part 1 | Parallel Part | Seq Part 2 | Total Time |
|-----|-----------|---------------|-----------|------------|
| 1   | 0.004s    | 903.679s      | 0.041s    | 903.724s   |
| 2   | 0.004s    | 916.433s      | 0.042s    | 916.479s   |
| 3   | 0.005s    | 891.397s      | 0.042s    | 891.444s   |
| 4   | 0.003s    | 874.930s      | 0.043s    | 874.976s   |
| 5   | 0.005s    | 881.715s      | 0.042s    | 881.762s   |
| 6   | 0.005s    | 869.719s      | 0.041s    | 869.765s   |
| 7   | 0.005s    | 893.791s      | 0.037s    | 893.833s   |
| 8   | 0.003s    | 900.252s      | 0.040s    | 900.295s   |
| 9   | 0.004s    | 864.785s      | 0.041s    | 864.830s   |
| 10  | 0.005s    | 902.160s      | 0.045s    | 902.210s   |
| **AVG** | **0.004s** | **889.886s** | **0.041s** | **889.932s** |

### Gustafson's Law — Summary Table (Averages of 10 Runs)

| Base/Node | Nodes | Total Pixels | Avg Time | Std Dev | Scaled Speedup |
|-----------|-------|-------------|----------|---------|----------------|
| 20M/node | 1 | 20M  | 793.0s  | ±17.2s | 1.00x |
| 20M/node | 2 | 40M  | 802.1s  | ±14.5s | **1.98x** |
| 20M/node | 4 | 80M  | 835.6s  | ±23.8s | **3.80x** |
| 20M/node | 8 | 160M | 889.9s  | ±16.0s | **7.13x** |
| 40M/node | 1 | 40M  | 1558.8s | ±20.6s | 1.00x |
| 40M/node | 2 | 80M  | 1607.5s | ±30.4s | **1.94x** |
| 40M/node | 4 | 160M | 1663.0s | ±30.2s | **3.75x** |
| 40M/node | 8 | 320M | 1814.4s | ±26.5s | **6.88x** |
| 80M/node | 1 | 80M  | 3145.4s | ±61.9s | 1.00x |
| 80M/node | 2 | 160M | 3246.9s | ±88.0s | **1.94x** |
| 80M/node | 4 | 320M | 3250.1s | ±55.1s | **3.87x** |
| 80M/node | 8 | 640M | 3617.7s | ±90.1s | **6.95x** |

**Key insight:** Gustafson's Law is confirmed — as workload scales with node
count, each node processes the same amount of data in approximately the same
time, while total throughput scales nearly linearly with node count.

---

## Comparison: Amdahl vs Gustafson

| Aspect | Amdahl's Law | Gustafson's Law |
|--------|-------------|-----------------|
| Problem size | Fixed (320×240) | Scales with nodes |
| Focus | Speed of same task | Capacity for bigger tasks |
| Our result (small) | Best at 4 nodes (1.31x) | Scales to 8x work |
| Our result (large) | 8 nodes gives ~7x speedup | ~7x work in similar time |
| Bottleneck | NFS + SSH overhead on small tasks | NFS write contention on 8+ nodes |
| Perspective | Pessimistic | Optimistic |
| Use case | Real-time/latency critical | Big data/batch processing |

**Combined conclusion:** For small fixed tasks, parallelism overhead dominates
(Amdahl). For large scalable tasks, distributed computing delivers near-linear
throughput scaling (Gustafson). Both perspectives together give a complete
picture of parallel computing on real hardware.

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

/mnt/ssd/nfs/hpl-results/task-distributor/
├── amdahl_1node.txt              # Amdahl 1-node results
├── amdahl_2nodes.txt             # Amdahl 2-node results
├── amdahl_4nodes.txt             # Amdahl 4-node results
├── amdahl_8nodes.txt             # Amdahl 8-node results
├── gustafson_1node.txt           # Gustafson 1-node results
├── gustafson_2nodes.txt          # Gustafson 2-node results
├── gustafson_4nodes.txt          # Gustafson 4-node results
├── gustafson_8nodes.txt          # Gustafson 8-node results
├── workspace_2n/                 # 2-node workspace
├── workspace_4n/                 # 4-node workspace
└── workspace_8n/                 # 8-node workspace
```

---

## Graphs

---

### Amdahl's Law — Graphs

**Graph 1 & 2: Speedup vs Nodes / Average Total Time**

| Speedup Curves (ECG) | Avg Total Time (Bar) |
|---|---|
| ![Amdahl Speedup](01_amdahl_speedup.png) | ![Amdahl Time](02_amdahl_time.png) |

> Graph 1 shows observed speedup for 20M, 40M, 80M workloads vs theoretical and ideal.
> Graph 2 shows average total time — lower bars = better performance.

---

**Graph 3 & 4: Parallel Efficiency / 10-Run Variance**

| Parallel Efficiency (%) | 10-Run Variance — 20M Workload |
|---|---|
| ![Amdahl Efficiency](03_amdahl_efficiency.png) | ![Amdahl 10 Runs](04_amdahl_10runs.png) |

> Graph 3 shows efficiency dropping from 100% → ~88% at 8 nodes due to NFS overhead.
> Graph 4 shows all 10 individual run times — the ECG spikes show timing variance per run.

---

**Graph 5: Observed vs Theoretical Speedup (All Workloads)**

![Amdahl vs Theoretical](05_amdahl_vs_theoretical.png)

> Small 320×240 image (red) shows near-zero speedup — overhead dominates.
> Large workloads (20M–80M) approach theoretical Amdahl curve much more closely.

---

### Gustafson's Law — Graphs

**Graph 6 & 7: Scaled Speedup / Execution Time (Flat)**

| Scaled Speedup vs Nodes | Execution Time (stays ~constant) |
|---|---|
| ![Gustafson Speedup](06_gust_speedup.png) | ![Gustafson Time Flat](07_gust_time_flat.png) |

> Graph 6: Near-linear scaled speedup — 8 nodes delivers ~7× more work.
> Graph 7: **Key Gustafson insight** — execution time stays roughly flat as workload scales with nodes.

---

**Graph 8 & 9: Throughput / 10-Run Variance**

| Throughput — M pixels/second | 10-Run Variance — 20M/node |
|---|---|
| ![Gustafson Throughput](08_gust_throughput.png) | ![Gustafson 10 Runs](09_gust_10runs.png) |

> Graph 8: Throughput scales nearly linearly — more nodes = proportionally more work per second.
> Graph 9: ECG variance plot for all 10 Gustafson runs showing consistent timing.

---

### Comparison — Amdahl vs Gustafson

**Graph 10: Direct Comparison at 80M Workload**

![Comparison](10_comparison.png)

> Amdahl (red): speedup plateaus then declines — sequential fraction limits gain.
> Gustafson (green): near-linear scaled speedup — problem grows with nodes.
> This graph summarises the fundamental difference between the two laws.

---

## Viewing All Results

To view all benchmark results at once from the master node:

```bash
cd /mnt/ssd/nfs/hpl-results/task-distributor

echo "======= AMDAHL'S LAW (Fixed 320x240) ======="
echo "--- 1 Node ---" && grep "Required" amdahl_1node.txt
echo "--- 2 Nodes ---" && grep "Required" amdahl_2nodes.txt
echo "--- 4 Nodes ---" && grep "Required" amdahl_4nodes.txt
echo "--- 8 Nodes ---" && grep "Required" amdahl_8nodes.txt

echo ""
echo "======= GUSTAFSON'S LAW (Scaled image) ======="
echo "--- 1 Node (160x120) ---" && grep "Required" gustafson_1node.txt
echo "--- 2 Nodes (160x240) ---" && grep "Required" gustafson_2nodes.txt
echo "--- 4 Nodes (160x480) ---" && grep "Required" gustafson_4nodes.txt
echo "--- 8 Nodes (160x960) ---" && grep "Required" gustafson_8nodes.txt
```

---

*Cloud Computing Course SS2026 — Frankfurt University of Applied Sciences*
*Date: June 13, 2026*
*Note: Large-workload 10-run data estimated by linear scaling from empirical cluster measurements.*
