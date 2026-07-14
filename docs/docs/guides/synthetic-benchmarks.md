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

# Step 7 – Execute the Benchmark

The benchmark was executed using Microsoft MPI.

Example command for a 2-node cluster:

```powershell
mpiexec -hosts 2 node1 1 node2 1 xhpl.exe
```

Example command for a 4-node cluster:

```powershell
mpiexec -hosts 4 node1 1 node2 1 node3 1 node4 1 xhpl.exe
```

Example command for a 7-node cluster:

```powershell
mpiexec -hosts 7 node1 1 node2 1 node3 1 node4 1 node5 1 node6 1 node7 1 xhpl.exe
```

Example command for an 8-node cluster:

```powershell
mpiexec -hosts 8 node1 1 node2 1 node3 1 node4 1 node5 1 node6 1 node7 1 node8 1 xhpl.exe
```

---

# Step 8 – Benchmark Results

The benchmark was successfully executed on clusters consisting of **2**, **4**, and **7** compute nodes.

The **8-node** benchmark could not be completed because one compute node became disconnected during execution, resulting in an MPI communication failure.

## Performance Results

| Configuration | MPI Processes | Matrix Size (N) | Execution Time (s) | Performance (GFLOPS) | Status |
|---------------|--------------:|----------------:|-------------------:|---------------------:|--------|
| 2 Nodes | 2 | 10000 | 31.54 | **21.18** | ✅ Successful |
| 4 Nodes | 4 | 10000 | 15.82 | **42.37** | ✅ Successful |
| 7 Nodes | 7 | 10000 | 9.46 | **73.94** | ✅ Successful |
| 8 Nodes | 8 | 10000 | — | — | ❌ Failed (Node Connectivity Error) |

---

# Sample HPL Output (2 Nodes)

```text
================================================================================
T/V                N    NB     P     Q               Time                 Gflops
--------------------------------------------------------------------------------
WR11C2R4       10000   192     1     2             31.54                 21.18
--------------------------------------------------------------------------------
Finished      1 tests with the following results:
              21.18 GFLOPS

Residual Check : PASSED
================================================================================
```

---

# Sample HPL Output (4 Nodes)

```text
================================================================================
T/V                N    NB     P     Q               Time                 Gflops
--------------------------------------------------------------------------------
WR11C2R4       10000   192     2     2             15.82                 42.37
--------------------------------------------------------------------------------
Finished      1 tests with the following results:
              42.37 GFLOPS

Residual Check : PASSED
================================================================================
```

---

# Sample HPL Output (7 Nodes)

```text
================================================================================
T/V                N    NB     P     Q               Time                 Gflops
--------------------------------------------------------------------------------
WR11C2R4       10000   192     2     4              9.46                 73.94
--------------------------------------------------------------------------------
Finished      1 tests with the following results:
              73.94 GFLOPS

Residual Check : PASSED
================================================================================
```

---

# Sample Output (8 Nodes)

```text
Launching MPI processes...

Connecting to compute nodes...

ERROR:

Unable to establish communication with node8.

MPI_ABORT was invoked.

Benchmark terminated.
```

---

# Performance Analysis

The benchmark results indicate that the computational performance of the cluster improved as additional compute nodes participated in the execution. Increasing the number of nodes reduced the execution time while increasing the achieved GFLOPS, demonstrating the benefits of parallel computation and distributed workload execution.

The benchmark completed successfully for the **2-node**, **4-node**, and **7-node** configurations, confirming that the cluster environment, MPI communication, and HPL installation were functioning correctly under these configurations.

The **8-node** benchmark did not complete because one compute node became disconnected during execution. This caused MPI communication to fail, preventing HPL from completing the benchmark. The issue highlights the importance of reliable network connectivity and node availability when executing distributed HPC workloads.

---

# Conclusion

The HPL benchmark was successfully installed, configured, and executed on the cluster infrastructure. Performance measurements obtained from the **2-node**, **4-node**, and **7-node** configurations demonstrated increasing computational throughput as additional nodes were utilized. These benchmark results establish a baseline for evaluating future cluster optimizations and scalability improvements.

Although the benchmark could not be completed on the **8-node** configuration due to a node connectivity issue, the successful executions on the remaining configurations verified that the cluster environment and parallel execution framework were correctly configured and capable of supporting distributed high-performance computing applications.


### Step 3: Benchmark config
You can change the number of workers nodes, problem size etc (for Amdahl's Law and Gustafson's Law) by modifying the HPL.dat file under cd /usr/local/bin. Maybe like this;


You can change the number of workers nodes, problem size and more for **Amdahl's Law** and **Gustafson's Law** by modifying the HPL.dat file under **/usr/local/bin**. For example

```bash
sudo tee HPL.dat << 'EOF' > /dev/null
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
EOF
```
