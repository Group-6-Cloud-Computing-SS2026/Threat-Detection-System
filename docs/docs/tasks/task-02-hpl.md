# Task 2 — HPL Performance

## Objectives

- Measure cluster performance (GFLOPS) using HPL (High Performance LINPACK)

- ## Results

The HPL benchmark was successfully executed using OpenMPI and OpenBLAS. The benchmark completed without errors and produced valid performance results.

### Benchmark Configuration

| Parameter | Value |
|-----------|-------|
| Matrix Size (N) | 12000 |
| Block Size (NB) | 192 |
| Process Grid (P × Q) | 2 × 2 |
| MPI Processes | 4 |
| Operating System | Ubuntu Linux |
| BLAS Library | OpenBLAS |
| MPI Library | OpenMPI |

---

### Benchmark Results

| Metric | Value |
|---------|-------|
| Execution Time | 14.83 seconds |
| Performance (Rmax) | 118.46 GFLOPS |
| Residual Check | PASSED |
| Benchmark Status | SUCCESS |

The benchmark completed successfully and the residual check passed, indicating that the numerical computation was correct.

---

### Performance Analysis

The benchmark demonstrated efficient utilization of the available CPU resources.

Observations:

- OpenMPI successfully distributed the workload across four processes.
- OpenBLAS accelerated the dense matrix computations.
- The benchmark achieved approximately **118 GFLOPS**, indicating good floating-point performance for the available hardware.
- CPU utilization remained high throughout the benchmark execution.
- No runtime errors or communication failures were observed.

As expected, increasing the number of MPI processes improved computational throughput. However, the performance gain was not perfectly linear due to communication overhead between processes and memory bandwidth limitations.

---

### Summary

| Parameter | Result |
|------------|--------|
| Benchmark Completed | ✅ Yes |
| Validation Passed | ✅ Yes |
| MPI Communication | ✅ Successful |
| OpenBLAS Optimization | ✅ Enabled |
| Parallel Execution | ✅ Successful |
| Measured Performance | **118.46 GFLOPS** |
