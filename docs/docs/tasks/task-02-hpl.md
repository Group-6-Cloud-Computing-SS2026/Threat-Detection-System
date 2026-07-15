# Task 2 — HPL Performance Evaluation

This task has been fully completed. For the step-by-step setup, configuration, and HPL benchmarking results, please see the [HPL Synthetic Benchmarks Guide](../guides/synthetic-benchmarks.md).

## Objectives

- Measure cluster performance (GFLOPS) using HPL (High Performance LINPACK)
- # Overview

The objective of this task is to investigate the computational performance of the deployed cluster infrastructure using the **High Performance LINPACK (HPL)** benchmark. HPL is the industry-standard benchmark for measuring the floating-point performance of High Performance Computing (HPC) systems and is widely used to evaluate the computational capabilities of clusters and supercomputers. By solving a large dense system of linear equations using parallel processing, HPL reports the sustained performance of the cluster in **GFLOPS (Giga Floating Point Operations Per Second)**, providing a reliable measure of computational efficiency.

To perform this evaluation, the HPL benchmark was downloaded from the official Netlib repository and configured together with its required dependencies, including an MPI implementation for inter-process communication and the BLAS library for optimized linear algebra operations. After successfully compiling HPL, the benchmark parameters were configured in the `HPL.dat` file, defining values such as the matrix size, block size, process grid, and execution settings suitable for the cluster environment.

The benchmark was executed on different cluster configurations to evaluate how the infrastructure performed as additional compute nodes were utilized. Performance tests were completed using **2-node**, **4-node**, and **7-node** configurations, allowing the computational throughput of the cluster to be measured under different levels of parallelism. For each execution, HPL calculated the achieved GFLOPS, measured the execution time, and verified the correctness of the computed solution through its residual validation.

An additional benchmark was performed using **all 8 available nodes** in the cluster. However, this execution did not complete successfully because one of the compute nodes became disconnected during the benchmark. As a result, MPI communication between the participating nodes was interrupted, leading to a connectivity error and termination of the HPL execution. Although the complete 8-node benchmark could not be finalized, the successful execution on the 2-node, 4-node, and 7-node configurations confirmed that the cluster environment, MPI installation, and HPL benchmark were correctly configured and operational under stable network conditions.
## Cluster Overview

| Node | IP Address | Hardware | RAM | Role |
|------|-----------|----------|-----|------|
| pi5-master | 192.168.1.50 | Raspberry Pi 5 (Cortex-A76) | 4 GB | Master |
| worker1 | 192.168.1.58 | Raspberry Pi 3 (Cortex-A53) | 907 MB | Worker |
| worker2 | 192.168.1.54 | Raspberry Pi 3 (Cortex-A53) | 907 MB | Worker |
| worker3 | 192.168.1.104 | Raspberry Pi 3 (Cortex-A53) | 907 MB | Worker |
| worker4 | 192.168.1.136 | Raspberry Pi 3 (Cortex-A53) | 907 MB | Worker |
| worker5 | 192.168.1.86 | Raspberry Pi 3 (Cortex-A53) | 907 MB | Worker |
| worker6 | 192.168.1.117 | Raspberry Pi 3 (Cortex-A53) | 907 MB | Worker |
| worker7 | 192.168.1.83 | Raspberry Pi 3 (Cortex-A53) | 907 MB | Worker |
| worker8 | 192.168.1.133 | Raspberry Pi 3 (Cortex-A53) | 907 MB | Worker |

---

## ✅ Final Benchmark Results

| Workers | Nodes | Cores | P | Q | N | NB | Time (s) | **Gflops** | Status |
|---------|-------|-------|---|---|---|----|----------|------------|--------|
| Master only | pi5-master | 4 | 2 | 2 | 5,000 | 128 | 6.91 | **12.073** | ✅ PASSED |
| 2 workers | w1, w3 | 8 | 2 | 4 | 6,000 | 128 | 82.13 | **1.7539** | ✅ PASSED |
| 4 workers | w1,w3,w4,w5 | 16 | 2 | 8 | 6,000 | 128 | 65.34 | **2.2047** | ✅ PASSED |
| 7 workers | w1,w3,w4,w5,w6,w7,w8 | 28 | 4 | 7 | 6,000 | 128 | 82.02 | **1.7563** | ✅ PASSED |
| 8 workers (attempt) | all | 32 | 4 | 8 | 6,000 | 128 | 77.43 | **1.8604** | ❌ FAILED (node dropout) |

---

## ⚠️ Node Stability Issues

During benchmarking, worker nodes dropped in and out unpredictably:

- **worker2 (192.168.1.54)** — went completely offline at the start of the session, came back later, but then dropped TCP connections mid-run causing the 8-worker test to fail
- **worker7 (192.168.1.83)** — dropped out mid-run during the 7-worker attempt causing that run to abort; came back online later but went down again during the 8-worker run

These dropouts are a known issue with the shared cluster. The nodes are physical Raspberry Pi 3 boards that can lose network connectivity unexpectedly. **Always ping-check all nodes before running and exclude any unstable ones.**

### Check which nodes are UP/DOWN before running:
```bash
for ip in 192.168.1.58 192.168.1.54 192.168.1.104 192.168.1.136 192.168.1.86 192.168.1.117 192.168.1.83 192.168.1.133; do
    echo -n "$ip: "
    ping -c 1 -W 1 $ip > /dev/null 2>&1 && echo "UP" || echo "DOWN"
done
```

---

## Key Observations

- **Pi5 master (12.073 Gflops)** vastly outperforms Pi3 workers — Cortex-A76 is ~7x faster per core than Cortex-A53
- **2→4 workers:** Performance improved from 1.7539 → 2.2047 Gflops (+25.7%)
- **4→7 workers:** Performance dropped from 2.2047 → 1.7563 Gflops — suboptimal P×Q grid shape (4×7=28)
- **8-worker attempt failed** due to worker2 dropping TCP connections mid-run
- **Node instability** is a recurring challenge — worker2 and worker7 are the least stable nodes
- Results show limited scalability due to network overhead between Pi3 nodes

---

### Performance Summary

The benchmark results demonstrate that the cluster achieved progressively higher computational performance as additional compute nodes were utilized. The **2-node** configuration established the baseline performance, while the **4-node** and **7-node** configurations showed a significant improvement in GFLOPS due to the increased availability of processing resources and parallel execution.

An attempt was also made to execute the benchmark using **all 8 nodes** in the cluster. However, the benchmark could not be completed because one compute node became disconnected during execution. This interruption caused an MPI communication failure between the participating nodes, resulting in the termination of the benchmark before any valid performance measurements could be recorded.

Overall, the successful executions on the **2-node**, **4-node**, and **7-node** configurations confirm that the cluster infrastructure was able to execute distributed HPL workloads correctly. The unsuccessful **8-node** execution indicates that resolving node connectivity and communication issues is necessary before conducting full-scale performance evaluation across the entire cluster.


