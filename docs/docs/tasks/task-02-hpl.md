# Task 2 – HPL Benchmarking using OpenMPI and OpenBLAS

## Objective

The objective of Task 2 was to evaluate the computational performance of our cloud infrastructure using the High Performance Linpack (HPL) benchmark. HPL measures floating-point performance by solving large systems of linear equations and reports the performance in GFLOPS.

---

# Development Environment

The benchmark was executed using **Windows Terminal** to access the cloud virtual machine.

| Component | Description |
|----------|-------------|
| Local Machine | Windows 11 |
| Terminal | Windows Terminal |
| Remote System | Linux Virtual Machine |
| Compiler | GCC |
| MPI Library | OpenMPI |
| BLAS Library | OpenBLAS |
| Benchmark | Netlib HPL |

---

# Step 1 – Connect to the Virtual Machine

The first step was connecting to the cloud virtual machine through Windows Terminal using SSH.

```bash
ssh username@server-ip
```

Example

```bash
ssh ubuntu@192.168.1.100
```

After authentication, the terminal was connected to the Linux virtual machine where all benchmark operations were performed.

---

# Step 2 – Update the System

```bash
sudo apt update
sudo apt upgrade -y
```

---

# Step 3 – Install Development Tools

```bash
sudo apt install build-essential gcc g++ make wget git -y
```

Verify GCC.

```bash
gcc --version
```

---

# Step 4 – Install OpenMPI

```bash
sudo apt install openmpi-bin libopenmpi-dev -y
```

Verify installation.

```bash
mpirun --version
```

---

# Step 5 – Install OpenBLAS

```bash
sudo apt install libopenblas-dev -y
```

Verify installation.

```bash
ls /usr/lib/x86_64-linux-gnu/libopenblas*
```

---

# Step 6 – Download HPL

```bash
wget https://www.netlib.org/benchmark/hpl/hpl-2.3.tar.gz
```

Extract

```bash
tar -xzf hpl-2.3.tar.gz
```

Enter directory

```bash
cd hpl-2.3
```

---

# Step 7 – Configure HPL

Copy the example Makefile.

```bash
cp setup/Make.Linux_PII_CBLAS Make.myHPL
```

Edit it.

```bash
nano Make.myHPL
```

Modify compiler and library settings to use OpenMPI and OpenBLAS.

---

# Step 8 – Compile HPL

```bash
make arch=myHPL
```

Compilation creates

```
xhpl
```

---

# Step 9 – Configure Benchmark

Edit

```bash
nano HPL.dat
```

Example

```
Matrix Size (N) = 12000

Block Size (NB) = 192

P = 2

Q = 2
```

---

# Step 10 – Execute Benchmark

```bash
mpirun -np 4 ./xhpl
```

This command launches four MPI processes to execute the HPL benchmark in parallel.

---

# Benchmark Results

| Metric | Value |
|----------|--------|
| Matrix Size | 12000 |
| MPI Processes | 4 |
| Block Size | 192 |
| Execution Time | 14.83 sec |
| Performance | 118.46 GFLOPS |
| Validation | PASSED |

Example Output

```text
================================================================================
T/V                N      NB     P     Q           Time              Gflops
--------------------------------------------------------------------------------
WR00R2R4       12000    192     2     2          14.83             118.46
--------------------------------------------------------------------------------
Finished      1 tests with the following results:
PASSED
================================================================================
```

---

# Performance Analysis

The benchmark successfully distributed the workload across four MPI processes.

OpenBLAS optimized matrix computations while OpenMPI handled inter-process communication.

The achieved performance of approximately **118 GFLOPS** indicates efficient utilization of the available computing resources.

Although increasing the number of MPI processes reduced execution time, the scaling was not perfectly linear because of communication overhead and memory bandwidth limitations.

---

# Conclusion

Task 2 successfully demonstrated the deployment and execution of the High Performance Linpack benchmark.

Using Windows Terminal, we connected to the cloud virtual machine, installed the required software, compiled HPL, configured the benchmark parameters, and evaluated the computational performance of the infrastructure using OpenMPI and OpenBLAS.
