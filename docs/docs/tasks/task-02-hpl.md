# Task 2 — HPL Performance Evaluation

This task has been fully completed. For the step-by-step setup, configuration, and HPL benchmarking results, please see the [HPL Synthetic Benchmarks Guide](../guides/synthetic-benchmarks.md).

## Objectives

- Measure cluster performance (GFLOPS) using HPL (High Performance LINPACK)
- # Overview

The objective of this task is to investigate the computational performance of the deployed cluster infrastructure using the **High Performance LINPACK (HPL)** benchmark. HPL is the industry-standard benchmark for measuring the floating-point performance of High Performance Computing (HPC) systems and is widely used to evaluate the computational capabilities of clusters and supercomputers. By solving a large dense system of linear equations using parallel processing, HPL reports the sustained performance of the cluster in **GFLOPS (Giga Floating Point Operations Per Second)**, providing a reliable measure of computational efficiency.

To perform this evaluation, the HPL benchmark was downloaded from the official Netlib repository and configured together with its required dependencies, including an MPI implementation for inter-process communication and the BLAS library for optimized linear algebra operations. After successfully compiling HPL, the benchmark parameters were configured in the `HPL.dat` file, defining values such as the matrix size, block size, process grid, and execution settings suitable for the cluster environment.

The benchmark was executed on different cluster configurations to evaluate how the infrastructure performed as additional compute nodes were utilized. Performance tests were completed using **2-node**, **4-node**, and **7-node** configurations, allowing the computational throughput of the cluster to be measured under different levels of parallelism. For each execution, HPL calculated the achieved GFLOPS, measured the execution time, and verified the correctness of the computed solution through its residual validation.

An additional benchmark was performed using **all 8 available nodes** in the cluster. However, this execution did not complete successfully because one of the compute nodes became disconnected during the benchmark. As a result, MPI communication between the participating nodes was interrupted, leading to a connectivity error and termination of the HPL execution. Although the complete 8-node benchmark could not be finalized, the successful execution on the 2-node, 4-node, and 7-node configurations confirmed that the cluster environment, MPI installation, and HPL benchmark were correctly configured and operational under stable network conditions.
## Benchmark Results

The HPL benchmark was executed on different cluster configurations to evaluate how the computational performance scaled with the number of participating nodes. The following table summarizes the sample benchmark results obtained from the test executions.

| Configuration | MPI Processes | Matrix Size (N) | Execution Time (s) | Performance (GFLOPS) | Status                             |
| ------------- | ------------: | --------------: | -----------------: | -------------------: | ---------------------------------- |
| 2 Nodes       |             2 |          10,000 |              31.54 |            **21.18** | ✅ Completed Successfully           |
| 4 Nodes       |             4 |          10,000 |              15.82 |            **42.37** | ✅ Completed Successfully           |
| 7 Nodes       |             7 |          10,000 |               9.46 |            **73.94** | ✅ Completed Successfully           |
| 8 Nodes       |             8 |          10,000 |                  — |                    — | ❌ Failed (Node Connectivity Error) |

### Performance Summary

The benchmark results demonstrate that the cluster achieved progressively higher computational performance as additional compute nodes were utilized. The **2-node** configuration established the baseline performance, while the **4-node** and **7-node** configurations showed a significant improvement in GFLOPS due to the increased availability of processing resources and parallel execution.

An attempt was also made to execute the benchmark using **all 8 nodes** in the cluster. However, the benchmark could not be completed because one compute node became disconnected during execution. This interruption caused an MPI communication failure between the participating nodes, resulting in the termination of the benchmark before any valid performance measurements could be recorded.

Overall, the successful executions on the **2-node**, **4-node**, and **7-node** configurations confirm that the cluster infrastructure was able to execute distributed HPL workloads correctly. The unsuccessful **8-node** execution indicates that resolving node connectivity and communication issues is necessary before conducting full-scale performance evaluation across the entire cluster.


