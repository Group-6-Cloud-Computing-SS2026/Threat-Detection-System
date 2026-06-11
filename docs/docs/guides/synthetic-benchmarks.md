# 📊 HPL Benchmarking for cluster

This guide outlines the how to use and perform **synthetic HPL benchmarks** across the cluster.
---

**Note**: Please follow the shutdown-and-cold-start guide before this.


### Step 1: Change directory

```bash
cd /usr/local/bin
```

### Step 2: Running the benchmark
Example with 2 worker nodes. Change as per your HPL.dat config i.e. use worker nodes as per your benchmark (2, 4, 8)

Note: This command might produce errors due to formatting
```bash
OMPI_MCA_plm_rsh_args="-l pi" mpirun --prefix /usr \
-x LD_LIBRARY_PATH="/usr/lib/aarch64-linux-gnu:/usr/lib/aarch64-linux-gnu/openblas-pthread:\$LD_LIBRARY_PATH" \
--host \
192.168.1.58:4,\
192.168.1.54:4 \
./xhpl
```

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