# Task 2 — HPL Benchmarking & Cluster Performance

This page documents the compilation, parameter optimization, and multi-node execution of the High-Performance Linpack (HPL) benchmark across our diskless Raspberry Pi cluster. The objective was to evaluate the peak floating-point computing capacity (GFLOPS) of our hybrid edge infrastructure and analyze the performance impact of transitioning our shared cluster workspace to a high-speed external SSD.

---

## 1. Benchmarking Environment Setup

Executing high-performance matrix calculations on legacy network filesystems introduces severe storage constraints and network bottlenecks. To safely benchmark our stateless compute nodes, we implemented a dedicated distributed storage architecture combined with centralized automated provisioning.

### Storage Workspace Virtualization

To provide each worker node with a dedicated runtime area for large benchmark logging and temporary scratch files, we created isolated hardware directory trees on the Master's high-speed external SSD.

- **Physical Workspace Path:** `/mnt/ssd/cluster_workspace/` on the Master Pi 5.
- **Logical Mount Mapping:** Each directory is matched directly to the worker's unique 8-digit hardware board serial number (e.g., `/mnt/ssd/cluster_workspace/2c900aeb/` for `worker2`).
- **NFS Client Target:** Workers mount their respective workspace directories over the private LAN directly to their local filesystem layer at `/mnt/workspace/`.

### Orchestration and Matrix Deployment via Ansible

Instead of configuring nodes manually, **Ansible** playbooks are executed from the `pi5-master` control node to automate testing across all worker endpoints simultaneously.

The cluster inventory is maintained at `~/pi-cluster/hosts.ini`:

```ini
[workers]
worker1 ansible_host=192.168.1.58
worker2 ansible_host=192.168.1.54
worker3 ansible_host=192.168.1.104
worker4 ansible_host=192.168.1.136
worker5 ansible_host=192.168.1.86
worker6 ansible_host=192.168.1.117
worker7 ansible_host=192.168.1.83
# worker8 is omitted during tuning cycles to safeguard stability

[workers:vars]
ansible_user=pi
ansible_ssh_pass=raspberry
ansible_ssh_common_args='-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null'
```

---

## 2. HPL Parameter Configuration (`HPL.dat`)

The peak performance of the HPL benchmark depends heavily on tailoring the underlying linear equations to match the memory allocations and CPU physical core structures of the ARM Cortex-A53 worker nodes.

### Core Parameter Optimization Matrix

| Parameter | Optimized Value | Engineering Justification |
|-----------|----------------|--------------------------|
| **N** (Problem Size) | 14000 | Defines the total matrix dimension size. Calculated to safely occupy ~80% of available worker RAM without triggering kernel memory thrashing or disk swap loops. |
| **NB** (Block Size) | 128 | Sets the block size for data distribution. Optimized at 128 to match cache alignments and maximize execution pipelining on ARM processors. |
| **P** (Process Rows) | 4 | Vertical process grid geometry allocation mapping. |
| **Q** (Process Cols) | 7 | Horizontal process grid geometry allocation mapping. Combined (P × Q), these parameters distribute tasks across 28 parallel worker cores (4 × 7 = 28). |

### Automated Cluster-Wide Configuration Synchronization

To modify parameters across all worker nodes simultaneously, a master deployment script distributes changes from a template directly across the network storage volumes:

```bash
#!/bin/bash
# Define your newly configured template HPL.dat file path
TEMPLATE_HPL="/mnt/ssd/cluster_workspace/2c900aeb/hpl-2.3/bin/rpi/HPL.dat"

# Loop through all active hardware serial directories on the SSD and sync configs
for dir in /mnt/ssd/cluster_workspace/*/; do
    TARGET_DIR="${dir}hpl-2.3/bin/rpi"
    if [ -d "$TARGET_DIR" ]; then
        cp "$TEMPLATE_HPL" "$TARGET_DIR/HPL.dat"
        echo "Successfully synchronized HPL.dat in $(basename "$dir")"
    fi
done
```

---

## 3. Benchmark Execution

The HPL benchmark runs inside an automated wrapper environment, using OpenMPI runtime commands routed through the Ansible orchestration layer.

### Multi-Node Execution Profile

To execute a performance sweep across 28 parallel worker cores, the following command is dispatched from the Master control console:

```bash
ansible workers -i ~/pi-cluster/hosts.ini -m shell -a \
  "mpirun --mca btl_tcp_if_include eth0 \
   --mca plm_rsh_args \"-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null\" \
   --hostfile hosts -np 28 ./xhpl > benchmark.log 2>&1" \
  -B 7200 -P 0
```

Key operational execution flags:

| Flag | Purpose |
|------|---------|
| `--mca btl_tcp_if_include eth0` | Forces inter-node MPI messaging onto the wired Gigabit network, preventing traffic drift onto wireless modules. |
| `--hostfile hosts` | Points to the local cluster worker allocation list. |
| `-np 28` | Maps operations across 28 hardware processing units. |
| `-B 7200` | Async shell execution timeout set to 2 hours, ensuring long-running jobs complete without shell disconnects. |

### Real-Time Monitoring and Performance Auditing

To pull live metrics from the cluster during an active benchmark sweep:

```bash
ansible worker1 -i ~/pi-cluster/hosts.ini -m shell \
  -a "cat /mnt/workspace/hpl-2.3/bin/rpi/benchmark.log"
```

---

## 4. Performance Analysis & Storage Evolution

The cluster's overall processing capacity changed significantly following the physical migration from shared local MicroSD cards to a dedicated high-speed Master SSD array.

```
BENCHMARK EXECUTION PROFILES BY STORAGE PLANE

Legacy MicroSD Setup:
[=== Worker Boot Phase ===] [=============== Storage I/O Stall ===============] (Fails/Timeouts)

High-Speed Master SSD:
[= Boot =] [==================== Linpack Compute Phase ====================] >> SUCCESS GFLOPS
```

### 4.1 Legacy MicroSD Storage Baseline

- **System Metrics:** Booting 8 nodes in parallel while writing real-time benchmark scratch files to the Master's primary SD card generated severe storage contention.
- **System Impact:** High parallel disk write operations resulted in file validation delays, network heartbeat loss, and severe kernel stalls. High problem sizes (N > 10000) frequently triggered eviction behaviors and storage timeout errors.

### 4.2 Upgraded Master SSD Infrastructure

- **System Metrics:** Moving the shared network root filesystems (`/nfs`) onto an external high-speed SSD connected to the Raspberry Pi 5 Master completely resolved storage bottlenecks.
- **System Impact:** Parallel worker boot sequences drop to under 60 seconds. The storage backplane provides steady, low-latency I/O, allowing the compute plane to sustain full workloads over extended benchmark sweeps (15–30 minutes) without driver timeout flags.

---

## 5. Verification Checklist

Ensure the following operational states are confirmed before starting an HPL run:

- [ ] **Date/Time Uniformity:** Run `ansible workers -m shell -a "date"`. Master and worker clocks must be synced via Chrony to prevent timestamp and compilation errors.
- [ ] **Workspace Verification:** Confirm each worker can read/write to its private space:
  ```bash
  ansible workers -m shell -a "touch /mnt/workspace/test.tmp && rm /mnt/workspace/test.tmp"
  ```
- [ ] **Process Alignment:** Verify that the processing grid (P × Q) in `HPL.dat` matches your target core allocation (`-np 28`).
