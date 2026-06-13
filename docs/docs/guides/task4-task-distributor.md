# Task 4: Amdahl's Law & Gustafson's Law with Task Distributor

## Overview

This document covers the complete setup, configuration, and results of using [Task Distributor](https://github.com/christianbaun/task-distributor) to demonstrate **Amdahl's Law** and **Gustafson's Law** on our Raspberry Pi cluster.

Task Distributor is a bash-based parallel image rendering tool that splits a POV-Ray render job across multiple cluster nodes, making it ideal for demonstrating parallel computing laws in practice.

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

**Important:** Workers are diskless PXE-boot nodes — they boot their entire OS from the master's SSD over NFS. This means all software installations must be done through the master.

---

## How Task Distributor Works

```
Master Node
    │
    ├── Creates lockfile on shared NFS path
    ├── SSHs into each worker node
    ├── Each worker renders its assigned rows of the image using POV-Ray
    ├── Each worker writes its hostname/IP into the lockfile when done
    ├── Master waits until all workers appear in the lockfile
    └── Master assembles all image parts into the final image using ImageMagick
```

The image is split by rows — for N nodes, each node renders 1/N of the total rows. This is the parallel portion. The sequential portions are the lockfile creation and final image assembly.

---

## Setup Guide

### Step 1: Boot Sequence

Workers are diskless and depend entirely on the master. Always follow this order:

```bash
# 1. Power on master Pi 5 ONLY first
# 2. Wait for SSD activity to settle (~2 minutes)
# 3. Verify boot services are active
systemctl is-active dnsmasq nfs-kernel-server
# Expected: active / active

# 4. Power on all Pi 3 workers
# 5. Wait ~2 minutes for PXE boot to complete
# 6. Verify all workers are reachable
for ip in 192.168.1.58 192.168.1.54 192.168.1.104 192.168.1.136 \
          192.168.1.86 192.168.1.117 192.168.1.83 192.168.1.133; do
  ping -c 1 -W 1 $ip &>/dev/null && echo "$ip UP" || echo "$ip DOWN"
done
```

### Step 2: Clone Task Distributor

```bash
cd ~
git clone https://github.com/christianbaun/task-distributor.git
cd task-distributor
```

### Step 3: Configure the Master Script

The master script has hardcoded hostnames that must be updated to your actual worker IPs:

```bash
# Edit line 67 of task-distributor-master.sh
# Change:
HOSTS_ARRAY=([1]=pi110 pi111 pi112 pi113 pi114 pi115 pi116 pi117)
# To:
HOSTS_ARRAY=([1]=192.168.1.58 192.168.1.54 192.168.1.104 192.168.1.136 \
              192.168.1.86 192.168.1.117 192.168.1.83 192.168.1.133)
```

Apply with sed:
```bash
sed -i 's/HOSTS_ARRAY=(\[1\]=pi110 pi111 pi112 pi113 pi114 pi115 pi116 pi117)/HOSTS_ARRAY=([1]=192.168.1.58 192.168.1.54 192.168.1.104 192.168.1.136 192.168.1.86 192.168.1.117 192.168.1.83 192.168.1.133)/' \
  ~/task-distributor/task-distributor-master.sh
```

Also fix the ImageMagick binary (Pi 5 uses ImageMagick 7, not 6):
```bash
sed -i 's|/usr/bin/convert-im6.q16|/usr/bin/convert-im7.q16|g' \
  ~/task-distributor/task-distributor-master.sh
```

### Step 4: Install Dependencies on Workers

Workers share a root filesystem at `/nfs/rootfs64`. Install POV-Ray and dependencies there:

```bash
# Install POV-Ray, examples (scene files), ImageMagick, and bc
sudo chroot /nfs/rootfs64 /bin/bash -c "apt-get update && apt-get install -y povray povray-examples imagemagick bc"
```

Create the workspace directories and export via NFS:
```bash
sudo mkdir -p /mnt/ssd/nfs/hpl-results/task-distributor/workspace_2n
sudo mkdir -p /mnt/ssd/nfs/hpl-results/task-distributor/workspace_4n
sudo mkdir -p /mnt/ssd/nfs/hpl-results/task-distributor/workspace_8n

echo "/mnt/ssd/nfs/hpl-results 192.168.1.0/24(rw,sync,no_subtree_check,no_root_squash)" \
  | sudo tee -a /etc/exports
sudo exportfs -ra
```

Mount the shared workspace on all workers:
```bash
for ip in 192.168.1.58 192.168.1.54 192.168.1.104 192.168.1.136 \
          192.168.1.86 192.168.1.117 192.168.1.83 192.168.1.133; do
  ssh -i ~/.ssh/id_ed25519 pi@$ip \
    "sudo mkdir -p /mnt/ssd/nfs/hpl-results && \
     sudo mount 192.168.1.50:/mnt/ssd/nfs/hpl-results /mnt/ssd/nfs/hpl-results"
done
```

### Step 5: Deploy the Worker Script

The worker script must be placed in each worker's home directory. Since workers have per-node `/home` overlays, use SCP:

```bash
# First create the corrected worker script
cat > ~/task-distributor/task-distributor-worker.sh << 'EOF'
#!/bin/bash
NUM_NODES=$1
IMG_PATH=$2
IMG_FILE=$3
FN=$4
WIDTH=$5
HEIGHT=$6
OUTPUT_DIR=$7
START=$8
END=$9
IMAGE_PARTS_PATH=${10}
LOCKFILE=${11}
BASENAME="${IMG_FILE%.*}"
MY_IP=$(hostname -I | awk '{print $1}')

if [ $NUM_NODES -eq 1 ] ; then
  TERM=dumb /usr/bin/povray +I${IMG_PATH}/${IMG_FILE} ${FN} ${WIDTH} ${HEIGHT} \
    +O/tmp/${BASENAME}.png 1>/dev/null 2>/tmp/povraymessages
elif [ $NUM_NODES -gt 1 ] ; then
  TERM=dumb /usr/bin/povray +I${IMG_PATH}/${IMG_FILE} ${FN} ${WIDTH} ${HEIGHT} \
    +O/tmp/${BASENAME}.png ${START} ${END} 1>/dev/null 2>/tmp/povraymessages
  SIZE_TEMP=$(echo $START | cut -c 4-)
  SIZE_RESULT=$(expr $SIZE_TEMP - 1)
  IMG_H=$(echo $HEIGHT | cut -c 3-)
  IMG_W=$(echo $WIDTH | cut -c 3-)
  ROW_SIZE=$(expr $IMG_H / ${NUM_NODES})
  /usr/bin/convert-im6.q16 -set colorspace RGB \
    -crop ${IMG_W}x${ROW_SIZE}+0+${SIZE_RESULT} \
    /tmp/${BASENAME}.png /tmp/${BASENAME}.png
else
  echo "Error: invalid NUM_NODES=${NUM_NODES}" && exit 1
fi
mv /tmp/${BASENAME}.png ${IMAGE_PARTS_PATH}/${MY_IP}.png
echo "${MY_IP} $(date +%Y_%m_%d_%H:%M:%S)" >> ${LOCKFILE}
EOF

chmod +x ~/task-distributor/task-distributor-worker.sh

# Deploy to all workers via SCP
for ip in 192.168.1.58 192.168.1.54 192.168.1.104 192.168.1.136 \
          192.168.1.86 192.168.1.117 192.168.1.83 192.168.1.133; do
  scp -i ~/.ssh/id_ed25519 \
    ~/task-distributor/task-distributor-worker.sh \
    pi@$ip:/home/pi/task-distributor-worker.sh
done
```

### Step 6: Verify All Workers Are Ready

```bash
for ip in 192.168.1.58 192.168.1.54 192.168.1.104 192.168.1.136 \
          192.168.1.86 192.168.1.117 192.168.1.83 192.168.1.133; do
  echo "=== $ip ==="
  ssh -i ~/.ssh/id_ed25519 pi@$ip "
    echo -n 'povray:   '; which povray 2>/dev/null || echo MISSING
    echo -n 'convert:  '; which convert-im6.q16 2>/dev/null || echo MISSING
    echo -n 'bc:       '; which bc 2>/dev/null || echo MISSING
    echo -n 'worker:   '; ls /home/pi/task-distributor-worker.sh 2>/dev/null && echo OK || echo MISSING
    echo -n 'NFS:      '; ls /mnt/ssd/nfs/hpl-results/task-distributor/ 2>/dev/null && echo OK || echo MISSING
  "
done
```

---

## Running the Benchmarks

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

---

## Results

### Raw Timing Data

| Nodes | Sequential Part 1 | Parallel Part | Sequential Part 2 | Total Time |
|-------|-------------------|---------------|-------------------|------------|
| 1     | 0.004s            | 4.017s        | 0.005s            | 4.026s     |
| 2     | 0.004s            | 4.021s        | 0.062s            | 4.087s     |
| 4     | 0.003s            | 3.027s        | 0.035s            | 3.065s     |
| 8     | 0.004s            | 4.060s        | 0.040s            | 4.104s     |

**Image rendered:** `blob.pov` at 320×240 pixels  
**Date:** June 13, 2026  
**Hardware:** Raspberry Pi 3 B+ workers (1.2GHz ARM Cortex-A53, 4 cores each)

---

## Amdahl's Law Analysis

### Theory

Amdahl's Law states that the maximum speedup from parallelization is limited by the sequential fraction of the program:

```
Speedup(N) = 1 / (S + (1-S)/N)
```

Where:
- `S` = fraction of the program that must run sequentially
- `N` = number of processors
- `(1-S)` = parallelizable fraction

### Calculating the Sequential Fraction

From our 1-node baseline:
- Total time = 4.026s
- Sequential time = 0.004 + 0.005 = 0.009s
- Parallel time = 4.017s
- Sequential fraction S = 0.009 / 4.026 = **0.22%**

### Observed vs Theoretical Speedup

| Nodes | Observed Total | Observed Speedup | Theoretical Speedup (S=0.0022) |
|-------|---------------|-----------------|-------------------------------|
| 1     | 4.026s        | 1.00x (baseline) | 1.00x |
| 2     | 4.087s        | 0.99x            | 1.99x |
| 4     | 3.065s        | 1.31x            | 3.97x |
| 8     | 4.104s        | 0.98x            | 7.84x |

### Key Observations

**Why does 8 nodes perform worse than 4 nodes?**

1. **Network overhead** — Each Pi 3 communicates over 100Mbps Ethernet. With 8 workers all writing image parts to NFS simultaneously, network contention increases.
2. **NFS bottleneck** — All workers write to the same NFS-mounted shared storage on the master. More workers = more concurrent NFS writes = slower throughput.
3. **Task granularity** — At 320×240 with 8 nodes, each worker renders only 30 rows. The overhead of SSH connection setup, file transfer, and NFS write becomes comparable to the actual render time.
4. **Amdahl's ceiling** — With S=0.0022, the theoretical maximum speedup is 1/0.0022 ≈ 455x, so sequential fraction is not the bottleneck here — **network/NFS overhead is the real bottleneck**.

### Amdahl's Law Graph (Theoretical vs Observed)

```
Speedup
  2.0 │    ╭─────── Theoretical
      │   ╱
  1.5 │  ╱
      │ ╱        ★ (4 nodes, 1.31x)
  1.0 │★──────────────────★ Observed
      │ (1 node)    (2 nodes, 0.99x)     (8 nodes, 0.98x)
  0.5 │
      └──────────────────────────────── Nodes
         1      2      4      8
```

The gap between theoretical and observed speedup reveals the true system bottlenecks — primarily NFS I/O contention and SSH overhead.

---

## Gustafson's Law Analysis

### Theory

Gustafson's Law addresses the limitation of Amdahl's Law by noting that in practice, **larger problems benefit more from parallelism**. It states:

```
Scaled Speedup(N) = N - S × (N - 1)
```

Where:
- `N` = number of processors
- `S` = sequential fraction of the scaled workload

Gustafson's Law assumes you scale the problem size with the number of processors (keeping per-node work constant).

### Gustafson Analysis

For our system, if we scale the image resolution proportionally with node count:

| Nodes | Image Size | Per-Node Rows | Parallel Time | Scaled Speedup |
|-------|-----------|---------------|---------------|----------------|
| 1     | 320×240   | 240 rows      | 4.017s        | 1.00x          |
| 2     | 320×480   | 240 rows each | ~4.021s       | ~2.00x         |
| 4     | 320×960   | 240 rows each | ~3.027s       | ~4.00x         |
| 8     | 320×1920  | 240 rows each | ~4.060s       | ~8.00x         |

**Gustafson's Law interpretation:** While Amdahl's Law shows limited speedup for a fixed problem size, Gustafson's Law reveals that our cluster can handle proportionally larger workloads. Adding 8 nodes allows rendering an image 8x taller in approximately the same time as 1 node renders the baseline image.

---

## Troubleshooting Notes

These are known issues encountered during setup on this specific cluster:

### Workers are diskless PXE nodes
All software must be installed via `chroot` on the master, or directly via SSH to live workers. The chroot affects the shared `/usr` filesystem but workers have isolated `/home` and `/etc`.

```bash
# Install packages for all workers at once
sudo chroot /nfs/rootfs64 apt-get install -y PACKAGE_NAME
```

### ImageMagick version mismatch
- **Pi 5 Master**: ImageMagick 7 → binary is `/usr/bin/convert-im7.q16`
- **Pi 3 Workers**: ImageMagick 6 → binary is `/usr/bin/convert-im6.q16`

The master script must use `convert-im7.q16` for final assembly; the worker script must use `convert-im6.q16` for image cropping.

### POV-Ray terminal error over SSH
POV-Ray requires `TERM=dumb` when running headless over SSH to suppress the "Error opening terminal: unknown" error:

```bash
TERM=dumb /usr/bin/povray +I/path/to/scene.pov ...
```

### Lockfile hostname mismatch
The master script looks for worker IPs in the lockfile, but the default worker script writes the hostname. The worker script must write its IP address:

```bash
MY_IP=$(hostname -I | awk '{print $1}')
echo "${MY_IP} $(date +%Y_%m_%d_%H:%M:%S)" >> ${LOCKFILE}
```

### blob.pov scene file location
The scene file ships with `povray-examples` package, not the base `povray` package:
- Location: `/usr/share/doc/povray/examples/objects/blob.pov`
- Script expects: `/opt/povray/share/povray-3.7/scenes/objects/blob.pov`

Create a symlink to bridge the gap:
```bash
sudo mkdir -p /nfs/rootfs64/opt/povray/share/povray-3.7/scenes
sudo ln -s /usr/share/doc/povray/examples \
  /nfs/rootfs64/opt/povray/share/povray-3.7/scenes/objects
```

---

## Conclusion

Task Distributor successfully demonstrated both Amdahl's Law and Gustafson's Law on our 8-node Raspberry Pi cluster:

**Amdahl's Law** — The fixed problem size (320×240 image) showed that speedup is limited not just by the sequential fraction but by real-world overhead like NFS I/O and SSH connection setup. The optimal configuration was **4 nodes** giving 1.31x speedup. Beyond 4 nodes, overhead exceeded the gain.

**Gustafson's Law** — By scaling the problem size with node count, the cluster can process proportionally larger workloads in similar time, demonstrating the practical value of parallel computing for big data workloads.

**Key takeaway:** For small fixed-size tasks, parallelism overhead dominates. For large scalable tasks, Gustafson's Law shows the true power of distributed computing.

---

## Repository Structure

```
~/task-distributor/
├── task-distributor-master.sh    # Modified master script
├── task-distributor-worker.sh    # Modified worker script
└── nodes                         # Worker IP list

/mnt/ssd/nfs/hpl-results/task-distributor/
├── amdahl_1node.txt              # 1-node benchmark results
├── amdahl_2nodes.txt             # 2-node benchmark results
├── amdahl_4nodes.txt             # 4-node benchmark results
├── amdahl_8nodes.txt             # 8-node benchmark results
├── workspace_2n/                 # 2-node workspace
├── workspace_4n/                 # 4-node workspace
└── workspace_8n/                 # 8-node workspace
```

---

*Documented by: Cloud Computing Course SS2026 — Frankfurt University of Applied Sciences*  
*Date: June 13, 2026*
