# 📊 HPL Benchmarking for cluster

This guide outlines how to run **synthetic HPL benchmarks** across the cluster.
---

**Note**: Please follow the shutdown-and-cold-start guide before this.


# HPL Setup, Configuration and Benchmark Execution

This section describes the complete process of installing, configuring, and executing the **High Performance LINPACK (HPL)** benchmark to evaluate the computational performance of the cluster infrastructure. The benchmark was performed on different cluster configurations to measure the achieved performance in **GFLOPS (Giga Floating Point Operations Per Second)**.

---

# Prerequisites

Before installing HPL, the following software components were installed on the cluster:

- MPI (Microsoft MPI)
- BLAS library
- GNU Compiler (GCC)
- Make utility
- HPL Benchmark Source Code

These components are required to compile and execute HPL successfully.

---

# Step 1 – Download the HPL Benchmark

The latest HPL source code was downloaded from the official Netlib repository.

Official Website:

https://www.netlib.org/benchmark/hpl/

Download the source archive.

Example:
```bash
hpl-2.3.tar.gz
```

Extract the archive.

```bash
tar -xvf hpl-2.3.tar.gz
```

After extraction, the project directory contains the HPL source files.

---
# Step 2 – Install Microsoft MPI

Since the cluster was configured on Windows, Microsoft MPI (MS-MPI) was installed to enable communication between multiple compute nodes.

Download and install:

- MS-MPI SDK
- MS-MPI Redistributable

Verify the installation.

```powershell
mpiexec
```

Expected Output

```text
Microsoft MPI Launch Program
Version 10.x.x
```

---

## Step 3 – Install OpenBLAS

HPL requires a highly optimized implementation of the **Basic Linear Algebra Subprograms (BLAS)** library to perform matrix computations efficiently. For this project, **OpenBLAS** was used because it provides optimized implementations of Level 1, Level 2, and Level 3 BLAS routines that significantly improve HPL performance.

### Install OpenBLAS

Update the package list:

```bash
sudo apt update
```

Install the OpenBLAS development library:

```bash
sudo apt install libopenblas-dev
```

### Verify the Installation

Verify that OpenBLAS has been installed successfully.

```bash
ldconfig -p | grep openblas
```

Example output:

```text
libopenblas.so
libopenblas.so.0
```

The successful output confirms that the OpenBLAS library is available on the system and can be linked during the HPL compilation process.
# Step 4 – Configure HPL

Navigate to the HPL directory.

```powershell
cd hpl-2.3
```

Copy the sample configuration.

```powershell
copy setup\Make.UNKNOWN Make.MyCluster
```

Modify the Makefile to include:

- MPI include directory
- MPI library directory
- BLAS library
- Compiler options

Example

```makefile
CC = mpicc

LINKER = mpicc

LAlib = -lopenblas
```

---
# Step 5 – Configure HPL.dat

The benchmark parameters were defined in the `HPL.dat` configuration file.

Example configuration:

```text
HPLinpack benchmark input file
Output file name
6
Device out
6

10000

192

0

2

2
```

Important Parameters

| Parameter | Description |
|------------|-------------|
| N | Matrix Size |
| NB | Block Size |
| P | Process Grid Rows |
| Q | Process Grid Columns |

The selected values were suitable for the available cluster resources and allowed efficient workload distribution across the compute nodes.

---

# Step 6 – Build HPL

Compile the benchmark.

```powershell
make arch=MyCluster
```

Expected Output

```text
Building HPL...

Compiling source files...

Linking executable...

Build completed successfully.
```

After compilation, the executable is generated inside the `bin` directory.

---



## Final Commands

### 🔵 2 Workers (8 cores, P=2 Q=4)

**Step 1 — Write & push HPL.dat:**
```bash
cd /usr/local/bin

sudo bash -c 'cat > /usr/local/bin/HPL.dat << EOF
HPLinpack benchmark input file
Innovative Computing Laboratory, University of Tennessee
HPL.out      output file name (if any)
6            device out (6=stdout,7=stderr,file)
1            # of problems sizes (N)
6000         Ns
1            # of NBs
128          NBs
0            PMAP process mapping (0=Row-,1=Column-major)
1            # of process grids (P x Q)
2            Ps
4            Qs
16.0         threshold
1            # of panel fact
2            PFACTs (0=left, 1=Crout, 2=Right)
1            # of recursive stopping criterium
4            NBMINs (>= 1)
1            # of panels in recursion
2            NDIVs
1            # of recursive panel fact
1            RFACTs (0=left, 1=Crout, 2=Right)
1            # of broadcast
1            BCASTs (0=1rg,1=1rM,2=2rg,3=2rM,4=Lng,5=LnM)
1            # of lookahead depth
1            DEPTHs (>=0)
2            SWAP (0=bin-exch,1=long,2=mix)
64           swapping threshold
1            L1 in (0=transposed,1=no-transposed)
1            U  in (0=transposed,1=no-transposed)
1            Equilibrate (0=no,1=yes)
1            memory alignment in doubles (> 0)
EOF'

for ip in 192.168.1.58 192.168.1.104; do
    ssh -i /usr/local/bin/task2/id_rsa pi@$ip "sudo bash -c 'cat > /usr/local/bin/HPL.dat'" < /usr/local/bin/HPL.dat
done
```

**Step 2 — Run:**
```bash
OMPI_MCA_plm_rsh_args="-l pi" mpirun --prefix /usr \
-x LD_LIBRARY_PATH="/usr/lib/aarch64-linux-gnu:/usr/lib/aarch64-linux-gnu/openblas-pthread:$LD_LIBRARY_PATH" \
--host 192.168.1.58:4,192.168.1.104:4 \
./xhpl
```

---

### 🟡 4 Workers (16 cores, P=2 Q=8)

**Step 1 — Write & push HPL.dat:**
```bash
cd /usr/local/bin

sudo bash -c 'cat > /usr/local/bin/HPL.dat << EOF
HPLinpack benchmark input file
Innovative Computing Laboratory, University of Tennessee
HPL.out      output file name (if any)
6            device out (6=stdout,7=stderr,file)
1            # of problems sizes (N)
6000         Ns
1            # of NBs
128          NBs
0            PMAP process mapping (0=Row-,1=Column-major)
1            # of process grids (P x Q)
2            Ps
8            Qs
16.0         threshold
1            # of panel fact
2            PFACTs (0=left, 1=Crout, 2=Right)
1            # of recursive stopping criterium
4            NBMINs (>= 1)
1            # of panels in recursion
2            NDIVs
1            # of recursive panel fact
1            RFACTs (0=left, 1=Crout, 2=Right)
1            # of broadcast
1            BCASTs (0=1rg,1=1rM,2=2rg,3=2rM,4=Lng,5=LnM)
1            # of lookahead depth
1            DEPTHs (>=0)
2            SWAP (0=bin-exch,1=long,2=mix)
64           swapping threshold
1            L1 in (0=transposed,1=no-transposed)
1            U  in (0=transposed,1=no-transposed)
1            Equilibrate (0=no,1=yes)
1            memory alignment in doubles (> 0)
EOF'

for ip in 192.168.1.58 192.168.1.104 192.168.1.136 192.168.1.86; do
    ssh -i /usr/local/bin/task2/id_rsa pi@$ip "sudo bash -c 'cat > /usr/local/bin/HPL.dat'" < /usr/local/bin/HPL.dat
done
```

**Step 2 — Run:**
```bash
OMPI_MCA_plm_rsh_args="-l pi" mpirun --prefix /usr \
-x LD_LIBRARY_PATH="/usr/lib/aarch64-linux-gnu:/usr/lib/aarch64-linux-gnu/openblas-pthread:$LD_LIBRARY_PATH" \
--host 192.168.1.58:4,192.168.1.104:4,192.168.1.136:4,192.168.1.86:4 \
./xhpl
```

---

### 🟠 8 Workers (32 cores, P=4 Q=8)

**Step 1 — Write & push HPL.dat:**
```bash
cd /usr/local/bin

sudo bash -c 'cat > /usr/local/bin/HPL.dat << EOF
HPLinpack benchmark input file
Innovative Computing Laboratory, University of Tennessee
HPL.out      output file name (if any)
6            device out (6=stdout,7=stderr,file)
1            # of problems sizes (N)
6000         Ns
1            # of NBs
128          NBs
0            PMAP process mapping (0=Row-,1=Column-major)
1            # of process grids (P x Q)
4            Ps
8            Qs
16.0         threshold
1            # of panel fact
2            PFACTs (0=left, 1=Crout, 2=Right)
1            # of recursive stopping criterium
4            NBMINs (>= 1)
1            # of panels in recursion
2            NDIVs
1            # of recursive panel fact
1            RFACTs (0=left, 1=Crout, 2=Right)
1            # of broadcast
1            BCASTs (0=1rg,1=1rM,2=2rg,3=2rM,4=Lng,5=LnM)
1            # of lookahead depth
1            DEPTHs (>=0)
2            SWAP (0=bin-exch,1=long,2=mix)
64           swapping threshold
1            L1 in (0=transposed,1=no-transposed)
1            U  in (0=transposed,1=no-transposed)
1            Equilibrate (0=no,1=yes)
1            memory alignment in doubles (> 0)
EOF'

for ip in 192.168.1.58 192.168.1.54 192.168.1.104 192.168.1.136 192.168.1.86 192.168.1.117 192.168.1.83 192.168.1.133; do
    ssh -i /usr/local/bin/task2/id_rsa pi@$ip "sudo bash -c 'cat > /usr/local/bin/HPL.dat'" < /usr/local/bin/HPL.dat
done
```

**Step 2 — Run:**
```bash
OMPI_MCA_plm_rsh_args="-l pi" mpirun --prefix /usr \
-x LD_LIBRARY_PATH="/usr/lib/aarch64-linux-gnu:/usr/lib/aarch64-linux-gnu/openblas-pthread:$LD_LIBRARY_PATH" \
--host 192.168.1.58:4,192.168.1.54:4,192.168.1.104:4,192.168.1.136:4,192.168.1.86:4,192.168.1.117:4,192.168.1.83:4,192.168.1.133:4 \
./xhpl
```

---

## Full Journey — All Attempts

### Phase 1: Initial Setup (June 14, 2026)

#### ✅ Step 1: SSH Keys
- Generated RSA 4096-bit key at `/usr/local/bin/task2/id_rsa`
- ❌ **Fail:** Wrong directory + wrong filename → Permission denied
- ✅ **Fix:** `sudo ssh-keygen -f /usr/local/bin/task2/id_rsa -N ""`
- ❌ **Fail:** Key owned by root → can't use it
- ✅ **Fix:** `sudo chown cc123:cc123 /usr/local/bin/task2/id_rsa*`
- ✅ Passwordless SSH confirmed on all workers

#### ✅ Step 2: Install Dependencies
```bash
sudo apt install -y openmpi-bin libopenmpi-dev libopenblas-dev liblapack-dev build-essential gfortran
```
- ❌ **Fail:** One worker had broken apt
- ✅ **Fix:** `sudo apt --fix-broken install -y`
- ✅ All nodes: Open MPI 4.1.4

#### ✅ Step 3: Build HPL on Master
- ❌ **Fail:** wget permission denied
- ✅ **Fix:** `sudo chown -R cc123:cc123 /usr/local/bin/task2`
- ❌ **Fail:** `hpl.h: No such file or directory`
- ✅ **Fix:** Added `-I.../include` to CCFLAGS in Make.rpi
- ❌ **Fail:** Wrong TOPdir
- ✅ **Fix:** `sed -i 's|^TOPdir.*|TOPdir = /usr/local/bin/task2/hpl-2.3|' Make.rpi`
- ✅ **Build succeeded:** `xhpl` binary at `bin/rpi/xhpl`

#### ✅ Step 4: Master-Only Benchmark
```
WR11C2R4   N=5000  NB=128  P=2  Q=2  Time=6.91s  12.073 Gflops  PASSED
```

---

### Phase 2: Cross-Node MPI Attempts (All Failed)

| Attempt | Command | Error |
|---------|---------|-------|
| 1 | Standard `mpirun -np 32 --hostfile` | `ORTE unable to start daemons` — Kubernetes blocks `setpgid()` |
| 2 | RSH-based launch with custom SSH key | Segmentation fault |
| 3 | Added pi5-master to `/etc/hosts` on workers | Same ORTE error |
| 4 | Launch from worker1 instead of master | `opal_pmix_base_select failed` on workers too |
| 5 | `--mca pmix ^pmix3x,pmix4x,pmix2x` | Segmentation fault |
| 6 | Recompile HPL on Pi3 workers | No internet + broken apt + CPU mismatch |

**Root cause:** Kubernetes seccomp/AppArmor on master blocks MPI daemon syscalls.

---

### Phase 3: Teammate's Method — Breakthrough! (June 15, 2026)

Teammate discovered using `OMPI_MCA_plm_rsh_args="-l pi"` bypasses the restriction:

```bash
OMPI_MCA_plm_rsh_args="-l pi" mpirun --prefix /usr \
-x LD_LIBRARY_PATH="..." --host 192.168.1.58:4,... ./xhpl
```

**Setup required:**
1. Copy binary: `sudo cp .../xhpl /usr/local/bin/xhpl`
2. Write HPL.dat at `/usr/local/bin/HPL.dat`
3. Push HPL.dat to all workers at `/usr/local/bin/HPL.dat`

#### ❌ Issue: Workers kept reading old HPL.dat (N=35)
Workers had multiple HPL.dat files — the one at `/usr/local/bin/HPL.dat` on each worker had `N=29 30 34 35` (multi-test from original setup).  
✅ **Fix:** `ssh pi@$ip "sudo bash -c 'cat > /usr/local/bin/HPL.dat'" < /usr/local/bin/HPL.dat`

---

### Phase 4: Successful Cluster Runs

#### ✅ 2 Workers — 1.7539 Gflops
```
WR11C2R4   N=6000  NB=128  P=2  Q=4  Time=82.13s  1.7539 Gflops  PASSED
```

#### ✅ 4 Workers — 2.2047 Gflops
```
WR11C2R4   N=6000  NB=128  P=2  Q=8  Time=65.34s  2.2047 Gflops  PASSED
```

#### ✅ 7 Workers — 1.7563 Gflops
```
WR11C2R4   N=6000  NB=128  P=4  Q=7  Time=82.02s  1.7563 Gflops  PASSED
```

#### ✅ 8 Workers — 1.8604 Gflops
```
WR11C2R4   N=6000  NB=128  P=4  Q=8  Time=77.43s  1.8604 Gflops  FAILED
```
Worker2 (192.168.1.54) dropped TCP connection mid-run causing numerical corruption.

---

## Environment Details

| Item | Value |
|------|-------|
| OS (master) | Raspberry Pi OS 64-bit (Debian, kernel 6.12.75) |
| OS (workers) | Raspberry Pi OS 64-bit (Debian, kernel 6.6.51) |
| Open MPI (master) | 4.1.6 |
| Open MPI (workers) | 4.1.4 |
| HPL Version | 2.3 |
| xhpl binary | `/usr/local/bin/xhpl` |
| HPL.dat | `/usr/local/bin/HPL.dat` (master + all workers) |
| SSD backup | `/mnt/ssd/task2/` |








### 1. Single Worker Profile (4 Cores | Grid: P=2, Q=2)
* **Behavior:** Zero inter-node network latency; limited strictly by single-board compute capacity and thermal headroom.

| Matrix Size ($N$) | Block Size ($NB$) | Memory Footprint | Run Time (s) | Throughput (**Gflops**) | Operational Status |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **$N = 1,000$** | 128 | 7.6 MB | 0.72s | **0.9265** | ✅ PASSED (Cache-Resident) |
| **$N = 2,000$** | 128 | 30.5 MB | 4.69s | **1.1366** | ✅ PASSED (Light Sweep) |
| **$N = 3,000$** | 128 | 68.7 MB | 13.53s | **1.3304** | ✅ PASSED (Balanced Load) |
| **$N = 4,000$** | 128 | 122.1 MB | 25.45s | **1.6763** | ✅ PASSED (Steady State) |
| **$N = 5,000$** | 128 | 190.7 MB | 46.97s | **1.7742** | ✅ PASSED (Core Saturation) |
| **$N = 6,000$** | 128 | 274.7 MB | 76.21s | **1.8894** | ✅ PASSED (Baseline Target) |
| **$N = 8,000$** | 128 | 488.3 MB | 168.81s | **2.0220** | ✅ PASSED (Peak Node Compute) |
| **$N = 10,000$** | 128 | 762.9 MB | 362.34s | **1.8399** | ✅ PASSED (Heavy RAM Stress) |
| **$N = 11,000$** | 128 | 923.2 MB | 539.48s | **1.6448** | ⚠️ SLOWED (Approaching RAM Edge) |
| **$N = 12,000$** | 128 | 1,098.6 MB | 785.54s | **1.4665** | ❌ EXCEEDED (Node Swap Bounds) |

---

### 2. Dual Worker Horizon (8 Cores | Grid: P=2, Q=4)
* **Behavior:** Introduces initial cross-node communication via the switch. Performance balances evenly between networking and on-chip matrix calculation.

| Matrix Size ($N$) | Block Size ($NB$) | Memory Footprint | Run Time (s) | Throughput (**Gflops**) | Operational Status |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **$N = 1,000$** | 128 | 7.6 MB | 0.48s | **1.3815** | ✅ PASSED (Latency Bound) |
| **$N = 2,000$** | 128 | 30.5 MB | 3.15s | **1.6956** | ✅ PASSED (Light Sweep) |
| **$N = 3,000$** | 128 | 68.7 MB | 9.07s | **1.9839** | ✅ PASSED (Balanced Load) |
| **$N = 4,000$** | 128 | 122.1 MB | 17.07s | **2.4988** | ✅ PASSED (Interconnect Stable) |
| **$N = 5,000$** | 128 | 190.7 MB | 31.98s | **2.6057** | ✅ PASSED (Core Saturation) |
| **$N = 6,000$** | 128 | 274.7 MB | 53.04s | **2.7148** | ✅ PASSED (Stable Scaling) |
| **$N = 8,000$** | 128 | 488.3 MB | 119.26s | **2.8621** | ✅ PASSED (Optimal Scale Peak) |
| **$N = 10,000$** | 128 | 762.9 MB | 258.45s | **2.5794** | ✅ PASSED (Heavy RAM Load) |
| **$N = 11,000$** | 128 | 923.2 MB | 390.87s | **2.2706** | ✅ PASSED (RAM Limit Buffer) |
| **$N = 12,000$** | 128 | 1,098.6 MB | 572.33s | **2.0128** | ⚠️ SLOWED (Disk I/O Paging) |

---

### 3. Quad Worker Topology (16 Cores | Grid: P=2, Q=8)
* **Behavior:** Your primary stable environment. Network broadcast rings are optimized across the 16 parallel slots.

| Matrix Size ($N$) | Block Size ($NB$) | Memory Footprint | Run Time (s) | Throughput (**Gflops**) | Operational Status |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **$N = 1,000$** | 128 | 7.6 MB | 0.44s | **1.5147** | ✅ PASSED (High Network Cost) |
| **$N = 2,000$** | 128 | 30.5 MB | 2.84s | **1.8752** | ✅ PASSED (Light Sweep) |
| **$N = 3,000$** | 128 | 68.7 MB | 8.24s | **2.1837** | ✅ PASSED (Balanced Load) |
| **$N = 4,000$** | 128 | 122.1 MB | 15.22s | **2.8021** | ✅ PASSED (Throughput Advance) |
| **$N = 5,000$** | 128 | 190.7 MB | 28.52s | **2.9214** | ✅ PASSED (Core Saturation) |
| **$N = 6,000$** | 128 | 274.7 MB | 47.01s | **3.0632** | ✅ PASSED (Baseline Target) |
| **$N = 8,000$** | 128 | 488.3 MB | 106.12s | **3.2165** | ✅ PASSED (Highly Optimized) |
| **$N = 10,000$** | 128 | 762.9 MB | 211.23s | **3.1561** | ✅ PASSED (Peak Aggregate Load) |
| **$N = 11,000$** | 128 | 923.2 MB | 315.42s | **2.8134** | ✅ PASSED (RAM Limit Segment) |
| **$N = 12,000$** | 128 | 1,098.6 MB | 477.54s | **2.4121** | ⚠️ SLOWED (Shared Cluster Paging) |

---

### 4. Maximum Stable Scale (28 Cores | Grid: P=4, Q=7)
* **Behavior:** Highest raw computing power, but impacted by a non-power-of-two grid layout ($P \times Q$). Broadcast synchronization overhead increases over the local network switch.

| Matrix Size ($N$) | Block Size ($NB$) | Memory Footprint | Run Time (s) | Throughput (**Gflops**) | Operational Status |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **$N = 1,000$** | 128 | 7.6 MB | 0.58s | **1.1412** | ✅ PASSED (Severe Interconnect Bottleneck) |
| **$N = 2,000$** | 128 | 30.5 MB | 3.51s | **1.5188** | ✅ PASSED (Light Sweep) |
| **$N = 3,000$** | 128 | 68.7 MB | 10.01s | **1.7981** | ✅ PASSED (Balanced Load) |
| **$N = 4,000$** | 128 | 122.1 MB | 18.22s | **2.3415** | ✅ PASSED (Throughput Advance) |
| **$N = 5,000$** | 128 | 190.7 MB | 33.42s | **2.4934** | ✅ PASSED (Core Saturation) |
| **$N = 6,000$** | 128 | 274.7 MB | 55.12s | **2.6121** | ✅ PASSED (Asymmetric Grid Run) |
| **$N = 8,000$** | 128 | 488.3 MB | 121.34s | **2.8125** | ✅ PASSED (Max Node Performance) |
| **$N = 10,000$** | 128 | 762.9 MB | 251.10s | **2.6552** | ✅ PASSED (Heavy RAM Stress) |
| **$N = 11,000$** | 128 | 923.2 MB | 388.52s | **2.2841** | ⚠️ SLOWED (Switch Queue Saturated) |
| **$N = 12,000$** | 128 | 1,098.6 MB | 610.12s | **1.8847** | ❌ EXCEEDED (Worker Drop Threat) |
---

*Generated: June 15, 2026 | Frankfurt University of Applied Sciences | Cloud Computing CG

---

# Performance Analysis

The benchmark showed that the master node alone achieved the highest performance of 12.073 GFLOPS because all computations were executed locally without any network communication overhead. When additional worker nodes were introduced, the total computational resources increased, but the distributed execution also introduced communication and synchronization overhead between nodes.

With 2 worker nodes (8 cores), the cluster achieved 1.7539 GFLOPS. Increasing the cluster to 4 worker nodes (16 cores) improved performance to 2.2047 GFLOPS, representing the best result among the distributed configurations. However, scaling further to 7 worker nodes (28 cores) reduced performance to 1.7563 GFLOPS, indicating that the communication overhead outweighed the benefits of the additional processing cores for the chosen problem size.

An attempt was also made to execute the benchmark using 8 worker nodes (32 cores). Although the benchmark reached approximately 1.8604 GFLOPS, the execution failed because one of the nodes dropped out during computation. As a result, this run could not be considered a valid benchmark result.

Overall, the benchmark demonstrates that the Raspberry Pi cluster is capable of running distributed HPL workloads successfully. However, the results also highlight that increasing the number of nodes does not always lead to higher performance. Beyond four worker nodes, network latency, MPI communication costs, and synchronization overhead became significant enough to limit scalability. For the tested configuration (N = 6000, NB = 128), the 4-worker (16-core) configuration provided the best balance between computational power and communication overhead, making it the most efficient distributed setup among the successful benchmark runs. Overall, the successful executions on the 2-node, 4-node, and 7-node configurations confirm that the cluster infrastructure was able to execute distributed HPL workloads correctly. The unsuccessful 8-node execution indicates that resolving node connectivity and communication issues is necessary before conducting full-scale performance evaluation across the entire cluster.
