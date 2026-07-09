# Task 3 Open MPI and Amdahl's vs. Gustafson's Law (Extended Big Data Profile)
**Infrastructure:** 8-Node Raspberry Pi 3 Worker Cluster orchestrated by a Raspberry Pi 5 Master  
---

## 1. Executive Summary & Objective

This report details the empirical validation of two foundational laws of parallel computing architecture—**Amdahl's Law** and **Gustafson's Law**—using an 8-node diskless Raspberry Pi 3 cluster under an extended, large-scale dataset profile ("Big Data" workload tier). 

The objective of this verification is to analyze cluster efficiency, resource utilization scaling, and parallel overhead boundaries under conditions where raw computation time heavily outpaces base microsecond network fluctuations, providing a highly precise perspective on hardware limitations:
1. **Fixed Workload Scaling (Amdahl's Law):** Evaluating execution time degradation patterns as an massive fixed computational problem size ($5,000,000,000$ integration steps) is divided among an increasing number of computing cores ($1$ to $32$).
2. **Scaled Workload Scaling (Gustafson's Law):** Evaluating execution runtime stability when the horizontal problem size scales dynamically with the core count ($200,000,000$ points per core), processing up to a cumulative $6.4$ Billion entries at full capacity.

---

## 2. Cluster Architecture & Execution Context

### Node Layout Matrix
* **Master Node:** Raspberry Pi 5 (`pi5-master`) providing central orchestration, network address space assignment, and shared high-speed NVMe/SSD storage.
* **Worker Nodes:** 8 $	imes$ Raspberry Pi 3 units (`worker1` through `worker8`) utilizing uniform diskless PXE network booting via NFS.
* **Total Capacity:** 8 workers $	imes$ 4 cores/slots each = **32 parallel processing units**.
* **Interconnect:** Gigabit Ethernet Switch mapping local IP subnet `192.168.1.0/24`.

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
The problem calculates an approximation of $\pi$ using numerical integration across a fixed global interval of $5,000,000,000$ (5 Billion) loop operations. As the core count ($P$) scales, the iteration range per core drops strictly to $N / P$.

* **Source File Path on Master:** `~/amdahl_big_test.c`
* **Target Path on Workers:** `/home/pi/amdahl_big_test.c`
* **Compiled Binary Path on Workers:** `/home/pi/amdahl_big_bench`

### Implementation 2: Gustafson's Law (Scaled Workload)
The problem executes a Monte Carlo simulation estimating the area of a quadrant to compute $\pi$. The workload is strictly scaled horizontally: each individual core is assigned exactly $200,000,000$ (200 Million) random coordinate iterations. The total problem size scales linearly to $200,000,000 	imes P$.

* **Source File Path on Master:** `~/gustafson_big_test.c`
* **Target Path on Workers:** `/home/pi/gustafson_big_test.c`
* **Compiled Binary Path on Workers:** `/home/pi/gustafson_big_bench`

---

## 4. Empirical Execution Sequences (Step-by-Step)

The following precise execution stages were performed directly on the terminal of `cc123@pi5-master`.

### Part A: Amdahl's Law Sequence

#### Step 1: Write the C Source Code on Master Node
```bash
cat > ~/amdahl_big_test.c << 'EOF'
#include <mpi.h>
#include <stdio.h>
#include <time.h>

int main(int argc, char** argv) {
    MPI_Init(&argc, &argv);
    int rank, size;
    MPI_Comm_rank(MPI_COMM_WORLD, &rank);
    MPI_Comm_size(MPI_COMM_WORLD, &size);

    long long TOTAL_STEPS = 5000000000LL;
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
        printf("%d,%.4f\n", size, (end_time - start_time));
    }
    MPI_Finalize();
    return 0;
}
EOF
```

#### Step 2: Push Source Code to Active Worker Clusters
```bash
for ip in 192.168.1.58 192.168.1.54 192.168.1.104 192.168.1.136 \
          192.168.1.86 192.168.1.117 192.168.1.83 192.168.1.133; do
  cat ~/amdahl_big_test.c | ssh -i ~/.ssh/id_ed25519 pi@$ip "cat > /home/pi/amdahl_big_test.c"
done
```

#### Step 3: Trigger Multi-Node Distributed Compilation
```bash
for ip in 192.168.1.58 192.168.1.54 192.168.1.104 192.168.1.136 \
          192.168.1.86 192.168.1.117 192.168.1.83 192.168.1.133; do
  ssh -i ~/.ssh/id_ed25519 pi@$ip "mpicc -O3 /home/pi/amdahl_big_test.c -o /home/pi/amdahl_big_bench"
done
```

#### Step 4: Execute Core Scaling Sweeps and Pipe to SSD Space
```bash
echo "Cores,ExecutionTime" > /mnt/ssd/nfs/hpl-results/task-distributor/amdahl_big_metrics.csv
for cores in 1 2 4 8 16 32; do
  mpirun --hostfile ~/task3/hostfile \
    -mca plm_rsh_args "-i /home/cc123/.ssh/id_ed25519" \
    --prefix /usr \
    -np $cores /home/pi/amdahl_big_bench >> /mnt/ssd/nfs/hpl-results/task-distributor/amdahl_big_metrics.csv
done
```

---

### Part B: Gustafson's Law Sequence

#### Step 1: Write the Gustafson Source Code on Master Node
```bash
cat > ~/gustafson_big_test.c << 'EOF'
#include <mpi.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>

int main(int argc, char** argv) {
    MPI_Init(&argc, &argv);
    int rank, size;
    MPI_Comm_rank(MPI_COMM_WORLD, &rank);
    MPI_Comm_size(MPI_COMM_WORLD, &size);

    long long WORKLOAD_PER_CORE = 200000000LL;

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
        printf("%d,%.4f\n", size, (end_time - start_time));
    }
    MPI_Finalize();
    return 0;
}
EOF
```

#### Step 2: Push Source Code to Active Worker Clusters
```bash
for ip in 192.168.1.58 192.168.1.54 192.168.1.104 192.168.1.136 \
          192.168.1.86 192.168.1.117 192.168.1.83 192.168.1.133; do
  cat ~/gustafson_big_test.c | ssh -i ~/.ssh/id_ed25519 pi@$ip "cat > /home/pi/gustafson_big_test.c"
done
```

#### Step 3: Trigger Multi-Node Distributed Compilation
```bash
for ip in 192.168.1.58 192.168.1.54 192.168.1.104 192.168.1.136 \
          192.168.1.86 192.168.1.117 192.168.1.83 192.168.1.133; do
  ssh -i ~/.ssh/id_ed25519 pi@$ip "mpicc -O3 /home/pi/gustafson_big_test.c -o /home/pi/gustafson_big_bench"
done
```

#### Step 4: Execute Core Scaling Sweeps and Pipe to SSD Space
```bash
echo "Cores,ExecutionTime" > /mnt/ssd/nfs/hpl-results/task-distributor/gustafson_big_metrics.csv
for cores in 1 2 4 8 16 32; do
  mpirun --hostfile ~/task3/hostfile \
    -mca plm_rsh_args "-i /home/cc123/.ssh/id_ed25519" \
    --prefix /usr \
    -np $cores /home/pi/gustafson_big_bench >> /mnt/ssd/nfs/hpl-results/task-distributor/gustafson_big_metrics.csv
done
```

---

## 5. Captured Empirical Metrics Matrix

The empirical big data profiles gathered directly from the SSD output files (`/mnt/ssd/nfs/hpl-results/task-distributor/*_big_metrics.csv`) contain the following results:

### Dataset 1: Amdahl's Law (Fixed Workload)

*Global Problem Size: $5,000,000,000$ integration steps fixed.*

| Core Count ($P$) | Measured Execution Time (Seconds) | Empirical Speedup Factor ($S_A$) |
| --- | --- | --- |
| 1 Core | 275.50s *(Base Calculation)* | 1.00$	imes$ |
| 2 Cores | 138.12s | 1.99$	imes$ |
| 4 Cores | 69.54s | 3.96$	imes$ |
| 8 Cores | 35.30s | 7.80$	imes$ |
| 16 Cores | 18.36s | 15.01$	imes$ |
| 32 Cores | 10.70s | 25.75$	imes$ *(Efficiency boundary at 80.4%)* |

### Dataset 2: Gustafson's Law (Scaled Workload)

*Local Problem Size: $200,000,000$ points per core ($200,000,000 	imes P$ total).*

| Core Count ($P$) | Measured Execution Time (Seconds) | Scaled Speedup Factor ($S_G$) | Total Scaled Problem Size |
| --- | --- | --- | --- |
| 1 Core | 76.25s | 1.00$	imes$ | 200,000,000 points |
| 2 Cores | 76.55s | 1.99$	imes$ | 400,000,000 points |
| 4 Cores | 76.95s | 3.96$	imes$ | 800,000,000 points |
| 8 Cores | 77.85s | 7.83$	imes$ | 1,600,000,000 points |
| 16 Cores | 79.52s | 15.34$	imes$ | 3,200,000,000 points |
| 32 Cores | 82.60s | 29.54$	imes$ *(Sustained scaling efficiency at 92.3%)* | 6,400,000,000 points |

---

## 6. Analytical Observations & Verification Insights

### 1. Verification of Amdahl's Law

Amdahl's model states that the speedup of a program is limited by its strictly sequential portions ($s$):

$$S_A = rac{1}{s + rac{1-s}{P}}$$

Under the original 20-million step constraint, network latency quickly dominated the execution paths, showing performance drops at 16 cores. However, scaling the fixed workload $250	imes$ up to **5 Billion integration steps** allows the raw computation time to effectively absorb multi-node latency lines across physical boundaries.

As a result, acceleration stays highly linear through 16 cores ($15.01	imes$). At the maximum limit of **32 cores**, processing finishes in **10.70 seconds**, yielding a real-world speedup of **$25.75	imes$**. The remaining performance loss is caused by the sequential bottleneck during the `MPI_Reduce` operations across the network bus.

### 2. Verification of Gustafson's Law

Gustafson's law approaches parallel efficiency from a capacity perspective, stating that scaled speedup is linear with core expansion if the workload scales with the architecture:

$$S_G = P - s(P - 1)$$

By setting a large base size of **200 Million points per core**, we can accurately test how well the system scales out horizontally. When the total workload scales 32-fold—from 200 Million to **6.4 Billion elements**—the total runtime only rises slightly from **76.25 seconds to 82.60 seconds**.

This minor $8.3\%$ shift in runtime across massive scaling shows an exceptional horizontal capacity configuration, achieving a **$29.54	imes$ parallel speedup** out of a maximum $32	imes$. This confirms that a cluster can tackle vastly superior problem domains in near-identical time vectors by scaling out computational assets.
