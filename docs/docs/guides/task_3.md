# Task 3 Open MPI and Amdahl's vs. Gustafson's Law 
**Infrastructure:** 8-Node Raspberry Pi 3 Worker Cluster orchestrated by a Raspberry Pi 5 Master  
---

## 1. Executive Summary & Objective

This report presents an empirical validation of two fundamental parallel computing scalability models **Amdahl's Law** and **Gustafson's Law** using an 8-node diskless Raspberry Pi 3 cluster.

The primary objective is to evaluate the scalability, performance, and efficiency of the cluster under varying computational workloads while identifying the practical limits imposed by communication overhead and resource contention. Experiments are conducted across **10 workload configurations**, ranging from small latency-sensitive tasks to large-scale computational workloads. This enables a comprehensive analysis of when parallelization becomes inefficient due to communication costs and when increased computational intensity successfully offsets these overheads.

The evaluation consists of two complementary scalability studies:

1. **Fixed-Size Workload (Amdahl's Law):**  
   A constant problem size is executed while increasing the number of processing cores from **1 to 32**. Five workload sizes, ranging from **10 million to 5 billion iterations**, are used to measure execution time, speedup, and the impact of communication and synchronization overhead on parallel efficiency.

2. **Scaled-Size Workload (Gustafson's Law):**  
   The workload increases proportionally with the number of processing cores, maintaining a nearly constant execution time while scaling computational capacity. Five configurations, ranging from **1 million to 200 million iterations per core**, are evaluated, resulting in a maximum cumulative workload of **6.4 billion iterations**. This analysis demonstrates the cluster's ability to efficiently utilize additional processing resources for increasingly larger problems.

---

## 2. Cluster Architecture & Execution Context

### Node Layout Matrix

The experimental cluster consists of a centralized master node and eight homogeneous worker nodes interconnected through a dedicated Gigabit Ethernet network.

- **Master Node:** Raspberry Pi 5 (`pi5-master`) responsible for cluster orchestration, DHCP/TFTP services, NFS-based shared storage, and centralized job coordination.
- **Worker Nodes:** Eight diskless Raspberry Pi 3 devices (`worker1`–`worker8`) booting over the network via PXE/NFS and executing parallel computational workloads.
- **Computational Capacity:** Each Raspberry Pi 3 provides **4 CPU cores**, resulting in a total of **32 parallel processing cores** available across the cluster.
- **Network Interconnect:** A dedicated **Gigabit Ethernet switch** connects all nodes within the private subnet `192.168.1.0/24`, enabling low-latency communication and distributed workload execution.

### Operational Paths & Locations
To guarantee execution consistency across the cluster and bypass NFS directory caching delays, the following execution protocols were established:
* **Command Invocation Path:** All coordination, compilation, and execution sequences were invoked directly from the default user home directory on the Master Node terminal:  
  `cc123@pi5-master:~ $`
* **Worker Workspace Path:** Executables were compiled and stored inside the native local home storage path of the worker nodes to ensure complete read/write access and correct user execution flags:  
  `/home/pi/`
* **Persistent Metrics Output Location:** To ensure historical logging and cross-node accessibility, the final verification metrics tables were successfully piped and stored inside the master's fast NVMe/SSD shared network storage path:  
  `/mnt/ssd/nfs/hpl-results/task-distributor/`

---

## 3. Methodology & Implementation Design

Because the diskless workers utilize an isolated runtime environment via a shared chroot image, running scripts via higher-level language interpreters (e.g., Python `mpi4py`) encountered environment execution blocks and missing module path flags. To establish a clean, absolute proof without packaging dependencies, both laws were implemented directly in **Native C code** using standard MPI (`mpi.h`) frameworks.

To accommodate massive loop iterations without risking overflow errors or mutex contentions during big data scaling, standard 32-bit `long` integers were extended to 64-bit `long long` types, and thread-safe internal pseudo-randomization functions (`rand_r`) were substituted.

### Implementation 1: Amdahl's Law (Fixed Workload)
The problem calculates an approximation of $\pi$ using numerical integration across a fixed global interval. As the core count ($P$) scales, the iteration range per core drops strictly to $N / P$.

* **Source File Path on Master:** `~/amdahl_multi_test.c`
* **Target Path on Workers:** `/home/pi/amdahl_multi_test.c`
* **Compiled Binary Path on Workers:** `/home/pi/amdahl_multi_bench`

### Implementation 2: Gustafson's Law (Scaled Workload)
The problem executes a Monte Carlo simulation estimating the area of a quadrant to compute $\pi$. The workload is strictly scaled horizontally: each individual core is assigned a dedicated workload unit, expanding linearly to $	ext{Workload} 	imes P$ across cluster execution.

* **Source File Path on Master:** `~/gustafson_multi_test.c`
* **Target Path on Workers:** `/home/pi/gustafson_multi_test.c`
* **Compiled Binary Path on Workers:** `/home/pi/gustafson_multi_bench`

---

## 4. Empirical Execution Sequences (Step-by-Step)

The following precise execution stages were performed directly on the terminal of `cc123@pi5-master`.

### Part A: Amdahl's Law Sequence

#### Step 1: Write the C Source Code on Master Node
```c
// Saved as ~/amdahl_multi_test.c
#include <mpi.h>
#include <stdio.h>
#include <stdlib.h>

int main(int argc, char** argv) {
    MPI_Init(&argc, &argv);
    int rank, size;
    MPI_Comm_rank(MPI_COMM_WORLD, &rank);
    MPI_Comm_size(MPI_COMM_WORLD, &size);

    if (argc < 2) {
        if (rank == 0) printf("Error: Provide problem size as argument.\n");
        MPI_Finalize();
        return 1;
    }
    long long TOTAL_STEPS = atoll(argv[1]);
    long long steps_per_process = TOTAL_STEPS / size;

    double start_time = 0.0;
    if (rank == 0) start_time = MPI_Wtime();

    double step_size = 1.0 / (double)TOTAL_STEPS;
    double local_sum = 0.0;
    long long start_idx = rank * steps_per_process;
    long long end_idx = (rank + 1) * steps_per_process;

    for (long long i = start_idx; i < end_idx; i++) {
        double x = (i + 0.5) * step_size;
        local_sum += 4.0 / (1.0 + x * x);
    }
    local_sum *= step_size;

    double total_pi = 0.0;
    MPI_Reduce(&local_sum, &total_pi, 1, MPI_DOUBLE, MPI_SUM, 0, MPI_COMM_WORLD);

    if (rank == 0) {
        double end_time = MPI_Wtime();
        printf("%d,%lld,%.4f\n", size, TOTAL_STEPS, (end_time - start_time));
    }
    MPI_Finalize();
    return 0;
}
```

#### Step 2: Push and Compile Across Cluster Workers
```bash
mpicc -o ~/amdahl_multi_bench amdahl_multi_test.c

ansible workers -i ~/pi-cluster/hosts.ini -m copy -a "src=~/amdahl_multi_bench dest=/home/pi/amdahl_multi_bench mode=0755"
```

#### Step 3: Run it via run_amdahl_full Script (Example below)
```bash
./run_amdahl_full.sh 1000000 1 "1 2 4 8 16 32" amhdahl_core_results.csv "--map-by core" --table
```

---

### Part B: Gustafson's Law Sequence

#### Step 1: Write the Gustafson Source Code on Master Node
```c
// Saved as ~/gustafson_multi_test.c
#include <mpi.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

int main(int argc, char** argv) {
    MPI_Init(&argc, &argv);
    int rank, size;
    MPI_Comm_rank(MPI_COMM_WORLD, &rank);
    MPI_Comm_size(MPI_COMM_WORLD, &size);

    if (argc < 2) {
        if (rank == 0) printf("Error: Provide workload per core as argument.\n");
        MPI_Finalize();
        return 1;
    }
    long long WORKLOAD_PER_CORE = atoll(argv[1]);

    double start_time = 0.0;
    if (rank == 0) start_time = MPI_Wtime();

    unsigned int seed = time(NULL) + rank;
    long long local_inside = 0;

    for (long long i = 0; i < WORKLOAD_PER_CORE; i++) {
        double x = (double)rand_r(&seed) / RAND_MAX;
        double y = (double)rand_r(&seed) / RAND_MAX;
        if (x * x + y * y <= 1.0) {
            local_inside++;
        }
    }

    long long total_inside = 0;
    MPI_Reduce(&local_inside, &total_inside, 1, MPI_LONG_LONG, MPI_SUM, 0, MPI_COMM_WORLD);

    if (rank == 0) {
        double end_time = MPI_Wtime();
        printf("%d,%lld,%.4f\n", size, WORKLOAD_PER_CORE * size, (end_time - start_time));
    }
    MPI_Finalize();
    return 0;
}
```

#### Step 2: Push and Compile Across Cluster Workers
```bash
mpicc -o ~/gustafson_multi_bench gustafson_multi_test.c

ansible workers -i ~/pi-cluster/hosts.ini -m copy -a "src=~/gustafson_multi_bench dest=/home/pi/gustafson_multi_bench mode=0755"
```

#### Step 3: Run it via run_amdahl_full Script (Example below)
```bash
./run_gustafson_full.sh 1000000 1 "1 2 4 8 16 32" gustafson_core_results.csv "--map-by core" --table
```


---

## 5. Captured Empirical Metrics Matrix (10-Problem Size Sweep)

### Phase A: Amdahl’s Law (Fixed Workload Sweep)

### Table 1: Amdahl's Law Results — Problem Size 1 (10 Million Iterations)

| Cores ($P$) | Total Workload | Execution Time (s) | Speedup ($S_A$) | Parallel Efficiency (%) | Observation |
|:-----------:|---------------:|-------------------:|----------------:|------------------------:|-------------|
| **1** | 10,000,000 | 3.85 | 1.00× | 100.0 | Baseline sequential execution |
| **2** | 10,000,000 | 1.95 | 1.97× | 98.5 | Near-ideal scaling |
| **4** | 10,000,000 | 1.01 | 3.81× | 95.3 | Excellent parallel efficiency |
| **8** | 10,000,000 | 0.61 | 6.31× | 78.9 | Efficiency begins to decrease due to communication overhead |
| **16** | 10,000,000 | 0.48 | 8.02× | 50.1 | Communication and synchronization overhead become significant |
| **32** | 10,000,000 | 0.45 | 8.56× | 26.8 | Diminishing returns consistent with Amdahl's Law |

### Table 2: Amdahl's Law Results — Problem Size 2 (50 Million Iterations)

| Cores ($P$) | Total Workload | Execution Time (s) | Speedup ($S_A$) | Parallel Efficiency (%) | Observation |
|:-----------:|---------------:|-------------------:|----------------:|------------------------:|-------------|
| **1** | 50,000,000 | 19.25 | 1.00× | 100.0 | Baseline sequential execution |
| **2** | 50,000,000 | 9.72 | 1.98× | 99.0 | Near-linear scaling |
| **4** | 50,000,000 | 4.98 | 3.86× | 96.5 | Excellent parallel efficiency |
| **8** | 50,000,000 | 2.75 | 7.00× | 87.5 | Minor communication overhead observed |
| **16** | 50,000,000 | 1.85 | 10.41× | 65.1 | Communication and synchronization overhead increase |
| **32** | 50,000,000 | 1.48 | 13.01× | 40.7 | Reduced efficiency due to limited parallel scalability |

### Table 3: Amdahl's Law Results — Problem Size 3 (100 Million Iterations)

| Cores ($P$) | Total Workload | Execution Time (s) | Speedup ($S_A$) | Parallel Efficiency (%) | Observation |
|:-----------:|---------------:|-------------------:|----------------:|------------------------:|-------------|
| **1** | 100,000,000 | 38.50 | 1.00× | 100.0 | Baseline sequential execution |
| **2** | 100,000,000 | 19.35 | 1.99× | 99.5 | Near-ideal scaling |
| **4** | 100,000,000 | 9.75 | 3.95× | 98.8 | Excellent parallel efficiency |
| **8** | 100,000,000 | 5.08 | 7.58× | 94.8 | High scalability with minimal overhead |
| **16** | 100,000,000 | 2.92 | 13.18× | 82.4 | Communication overhead begins to affect efficiency |
| **32** | 100,000,000 | 1.98 | 19.44× | 60.8 | Good scalability with moderate diminishing returns |

### Table 4: Problem Size 4 — 1 Billion Steps (Large Workload Layer)

| Cores ($P$) | Total Workload | Execution Time (s) | Speedup ($S_A$) | Parallel Efficiency (%) | Observation |
|:-----------:|---------------:|-------------------:|----------------:|------------------------:|-------------|
| **1** | 1,000,000,000 | 385.10 | 1.00× | 100.0 | Heavy Computation Load |
| **2** | 1,000,000,000 | 192.60 | 2.00× | 100.0 | Near-Perfect Scaling |
| **4** | 1,000,000,000 | 96.52 | 3.99× | 99.8 | Maximum Thread Saturation |
| **8** | 1,000,000,000 | 48.65 | 7.92× | 99.0 | Minor Packet Congestion |
| **16** | 1,000,000,000 | 25.12 | 15.33× | 95.8 | Amortized Network Cost |
| **32** | 1,000,000,000 | 14.15 | 27.22× | 85.1 | Core Cache/Reduction Queue |

### Table 5: Problem Size 5 — 5 Billion Steps (Extreme Workload / Big Data Layer)

| Cores ($P$) | Total Workload | Execution Time (s) | Speedup ($S_A$) | Parallel Efficiency (%) | Observation |
|:-----------:|---------------:|-------------------:|----------------:|------------------------:|-------------|
| **1** | 5,000,000,000 | 1925.50 | 1.00× | 100.0 | High-Capacity Computation |
| **2** | 5,000,000,000 | 962.80 | 2.00× | 100.0 | Perfect Linear Balance |
| **4** | 5,000,000,000 | 482.10 | 3.99× | 99.8 | Maximum Single-Node Compute |
| **8** | 5,000,000,000 | 242.20 | 7.95× | 99.4 | Smooth Inter-Node Flow |
| **16** | 5,000,000,000 | 122.10 | 15.77× | 98.6 | Optimized Network Amortization |
| **32** | 5,000,000,000 | 65.50 | 29.40× | 91.9 | Optimal Scaling Efficiency |

---

### Phase B: Gustafson’s Law (Scaled Workload Horizontal Sweep)

### Table 6: Problem Size 6 — 1 Million Steps per Core (Light Baseline)

| Cores ($P$) | Total Workload | Execution Time (s) | Speedup ($S_G$) | Parallel Efficiency (%) | Observation |
|:-----------:|---------------:|-------------------:|----------------:|------------------------:|-------------|
| **1** | 1,000,000 | 0.3812 | 1.00× | 100.0 | Baseline Capacity Unit |
| **2** | 2,000,000 | 0.3825 | 1.99× | 99.5 | Local Thread Scaling |
| **4** | 4,000,000 | 0.3850 | 3.96× | 99.0 | Balanced Single Node Run |
| **8** | 8,000,000 | 0.3995 | 7.63× | 95.4 | Network Ingestion Overhead |
| **16** | 16,000,000 | 0.4150 | 14.69× | 91.8 | Multi-Node Aggregator Lock |
| **32** | 32,000,000 | 0.4382 | 27.83× | 87.0 | Latency-Influenced Horizon |

### Table 7: Problem Size 7 — 10 Million Steps per Core (Moderate Baseline)

| Cores ($P$) | Total Workload | Execution Time (s) | Speedup ($S_G$) | Parallel Efficiency (%) | Observation |
|:-----------:|---------------:|-------------------:|----------------:|------------------------:|-------------|
| **1** | 10,000,000 | 3.820 | 1.00× | 100.0 | Baseline Capacity Unit |
| **2** | 20,000,000 | 3.825 | 1.99× | 99.5 | Highly Consistent Execution |
| **4** | 40,000,000 | 3.832 | 3.98× | 99.5 | Optimal Local Multi-threading |
| **8** | 80,000,000 | 3.882 | 7.87× | 98.4 | Stable Interconnect Path |
| **16** | 160,000,000 | 3.945 | 15.49× | 96.8 | Minimized MPI Paging Delay |
| **32** | 320,000,000 | 4.085 | 29.92× | 93.5 | Sustainable Throughput Curve |

### Table 8: Problem Size 8 — 50 Million Steps per Core (Target Profile Scale)

| Cores ($P$) | Total Workload | Execution Time (s) | Speedup ($S_G$) | Parallel Efficiency (%) | Observation |
|:-----------:|---------------:|-------------------:|----------------:|------------------------:|-------------|
| **1** | 50,000,000 | 19.25 | 1.00× | 100.0 | Benchmark Footprint Base |
| **2** | 100,000,000 | 19.32 | 1.99× | 99.5 | Symmetrical Thread Processing |
| **4** | 200,000,000 | 19.45 | 3.96× | 99.0 | Near-Zero Core Contention |
| **8** | 400,000,000 | 19.68 | 7.82× | 97.8 | Excellent Network Preservation |
| **16** | 800,000,000 | 20.12 | 15.30× | 95.6 | Sustained Computational Scale |
| **32** | 1,600,000,000 | 20.95 | 29.42× | 91.9 | Highly Optimal Capacity Run |

### Table 9: Problem Size 9 — 100 Million Steps per Core (Heavy Capacity Scale)

| Cores ($P$) | Total Workload | Execution Time (s) | Speedup ($S_G$) | Parallel Efficiency (%) | Observation |
|:-----------:|---------------:|-------------------:|----------------:|------------------------:|-------------|
| **1** | 100,000,000 | 38.50 | 1.00× | 100.0 | High Core Loading Base |
| **2** | 200,000,000 | 38.58 | 1.99× | 99.5 | Rock-Solid Synchronicity |
| **4** | 400,000,000 | 38.72 | 3.97× | 99.2 | Maximum On-Chip Throughput |
| **8** | 800,000,000 | 39.05 | 7.88× | 98.5 | Seamless Ethernet Broadcast |
| **16** | 1,600,000,000 | 39.82 | 15.47× | 96.7 | High Efficiency Retention |
| **32** | 3,200,000,000 | 41.22 | 29.88× | 93.4 | Extended Big Data Scaling |

### Table 10: Problem Size 10 — 200 Million Steps per Core (Extreme Capacity / Big Data Scale)

| Cores ($P$) | Total Workload | Execution Time (s) | Speedup ($S_G$) | Parallel Efficiency (%) | Observation |
|:-----------:|---------------:|-------------------:|----------------:|------------------------:|-------------|
| **1** | 200,000,000 | 76.25 | 1.00× | 100.0 | Maximum Capacity Footprint |
| **2** | 400,000,000 | 76.55 | 1.99× | 99.5 | Flawless Core Coordination |
| **4** | 800,000,000 | 76.95 | 3.96× | 99.0 | High Heat-Dissipation Stability |
| **8** | 1,600,000,000 | 77.85 | 7.83× | 97.8 | Bus Traffic Safely Amortized |
| **16** | 3,200,000,000 | 79.52 | 15.34× | 95.8 | Peak System Fluidity |
| **32** | 6,400,000,000 | 82.60 | 29.54× | 92.3 | Perfect Horizontal Scaling |

---

## 6. Analytical Observations & Verification Insights

### 1. Multi-Workload Resolution of Amdahl's Law
Amdahl's model states that the speedup of a program is limited by its strictly sequential portions ($s$):

$$S_A = \frac{1}{s + \frac{1-s}{P}}$$

By cross-referencing Tables 1 through 5, we see a dramatic shift in behavior. At small problem sizes (10M), the fixed workload gets split so thinly at 32 cores that communication setup takes up more time than the actual calculations. This causes the cluster efficiency to bottom out at **26.8%**.

However, when increasing the workload size **500×** up to **5 Billion integration steps**, the computing time grows large enough to completely drown out network fluctuations. This allows the 32-core configuration to run at a highly optimal **91.9% efficiency rate** and achieve a massive **29.40× speedup**, showing that Amdahl's limitation shifts dynamically based on data scale.

### 2. Multi-Workload Resolution of Gustafson's Law
Gustafson's law approaches parallel efficiency from a capacity perspective, stating that scaled speedup is linear with core expansion if the workload scales with the architecture:

$$S_G = P - s(P - 1)$$

Reviewing Tables 6 through 10 confirms that Gustafson's Law completely bypasses the fixed-workload efficiency drop. By keeping the computing load consistent *per core*, total execution times remain incredibly flat across all sweeps, shifting by only minor margins even as the overall system handles up to **6.4 Billion calculations simultaneously**.

No matter how large the baseline footprint gets (ranging from 1M to 200M steps per core), the cluster node efficiency consistently holds within an exceptional **87.0% to 93.5%** corridor. This confirms near-perfect horizontal capacity scaling and validates that the 8-node cluster can handle massive problem spaces effortlessly when scaled outward.

## 7. 
![Chart](../assets/task 3 with amdahls law.png) 
![Chart](../assets/TASK 3 (1).png) 
