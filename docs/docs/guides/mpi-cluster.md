# MPI Cluster Setup Guide

A complete reference for deploying a working OpenMPI 4.1.x environment across the diskless PXE-booted Pi cluster, covering the version compatibility problem, chroot-based cross-compilation for Bookworm workers, and full end-to-end test.

---

## Background & Version Incompatibility Problem

The Pi 5 Master node runs **Debian Trixie** with **OpenMPI 5.0.7**, while the diskless Pi 3 workers boot from a shared **Debian Bookworm** rootfs (`/nfs/rootfs64`) with **OpenMPI 4.1.4** already installed from the Bookworm repos.

This version gap causes a hard runtime failure when `mpirun` on the master tries to launch worker daemons:

```
--------------------------------------------------------------------------
The application appears to have been direct launched using "mpirun",
but OMPI was not found to be installed.  No OMPI magic entry point was found.
--------------------------------------------------------------------------
```

Or more specifically:

```
A required shared library is not available on the remote host
GLIBC_2.38 not found
```

**Root cause:** OpenMPI 5.x uses a new runtime daemon called `prted` (PRRTE-based) which requires **PMIx ≥ 4.2.4**. The Bookworm worker rootfs only ships `pmix2` (PMIx 2.x), making it impossible to run 5.x daemons on the workers.

### Why Not Just Copy the Master's `prted`?

Copying `/usr/bin/prted` from the master into `/nfs/rootfs64/usr/bin/` fails because the binary is dynamically linked against **GLIBC 2.38** (`libprrte.so.3`, `libpmix.so.2`) which does not exist in the Bookworm worker environment. The workers only have GLIBC 2.36.

### Why Not Compile OpenMPI 5.x Inside the Chroot?

Attempting to `./configure` OpenMPI 5.x source inside the Bookworm chroot fails at the PRRTE sub-configure step:

```
checking version at or above v4.2.4... no
configure: WARNING: PRRTE requires PMIx v0x00040204 or above.
configure: error: PRRTE configuration failed.
```

Bookworm only ships `pmix2`, and upgrading PMIx would require building it from source first — a deep dependency chain not worth pursuing.

### Solution: Compile OpenMPI 4.1.6 Inside the Worker Chroot

OpenMPI **4.x** uses the older `orted` daemon (not `prted`) and is compatible with the PMIx 2.x stack in Bookworm. The fix is to:

1. Compile OpenMPI **4.1.6** inside the Bookworm chroot so binaries use GLIBC 2.36.
2. Install it into the shared rootfs so all workers get it automatically.
3. Use a matching 4.1.x `mpirun` on the master to maintain wire-protocol compatibility.

---

## Step 1 — Download OpenMPI 4.1.6 Source on the Master

```bash
cd /tmp
wget https://download.open-mpi.org/release/open-mpi/v4.1/openmpi-4.1.6.tar.gz
tar xzf openmpi-4.1.6.tar.gz
```

Copy the extracted source into the shared worker rootfs so it is accessible inside the chroot:

```bash
sudo cp -r /tmp/openmpi-4.1.6 /nfs/rootfs64/tmp/
```

---

## Step 2 — Enter the Bookworm Chroot

Bind-mount the kernel interfaces so the chroot environment has access to devices, processes, and pseudo-terminals:

```bash
sudo mount --bind /proc /nfs/rootfs64/proc
sudo mount --bind /sys  /nfs/rootfs64/sys
sudo mount --bind /dev  /nfs/rootfs64/dev
sudo mount --bind /dev/pts /nfs/rootfs64/dev/pts

sudo chroot /nfs/rootfs64 /bin/bash
```

Your prompt will change to `root@pi5-master:/#` — you are now running commands against the Bookworm environment.

---

## Step 3 — Install Build Dependencies (Inside the Chroot)

```bash
apt-get install -y gcc g++ make \
    libpmix-dev libevent-dev libhwloc-dev \
    gfortran flex
```

| Package | Purpose |
|---|---|
| `gcc`, `g++` | C/C++ compiler toolchain |
| `gfortran` | Fortran MPI bindings |
| `libpmix-dev` | PMIx process management interface |
| `libevent-dev` | Async I/O event library |
| `libhwloc-dev` | Hardware topology awareness |
| `flex` | Lexer generator (needed for internal .l files) |

---

## Step 4 — Configure and Compile (Inside the Chroot)

The OpenMPI 4.1.6 tarball was built with older autotools. On newer systems, `make` tries to regenerate `Makefile.in` and `.c` lexer files using tools that no longer exist at the exact version. Fix this by touching all generated files before running `make`:

```bash
cd /tmp/openmpi-4.1.6

# Fix autotools timestamp issues — prevents "automake-1.15 not found" errors
find . -name "Makefile.in" -o -name "aclocal.m4" -o -name "configure" -o -name "*.c" \
    | xargs touch

./configure --prefix=/usr --sysconfdir=/etc/openmpi --disable-oshmem

make -j4
make install
ldconfig
```

!!! tip "Why `--disable-oshmem`?"
    OpenSHMEM (a PGAS programming model) is not used in this project and has additional
    dependency requirements. Disabling it eliminates irrelevant configure checks and speeds
    up the build.

!!! note "Why `-j4` not `-j$(nproc)`?"
    The compilation runs inside the chroot, which shares memory with the master. Using all
    cores (`nproc` = 4 on Pi 5) can cause OOM on a memory-constrained Pi. `-j4` is safe
    and still reasonably fast (~15–20 minutes).

Verify the installed version:

```bash
/usr/bin/mpirun --version
# Expected: mpirun (Open MPI) 4.1.6
exit
```

---

## Step 5 — Unmount Chroot Filesystems

After exiting the chroot shell, always clean up the bind mounts:

```bash
sudo umount /nfs/rootfs64/dev/pts
sudo umount /nfs/rootfs64/dev
sudo umount /nfs/rootfs64/sys
sudo umount /nfs/rootfs64/proc
```

!!! warning "Always unmount after chroot sessions"
    Failing to unmount these filesystems can cause issues if the master reboots or if
    NFS clients try to access the rootfs while kernel mounts are still attached.

---

## Step 6 — Verify Workers Have the New MPI

Since all workers share `/nfs/rootfs64` via NFS, the installed OpenMPI 4.1.6 is immediately available to all workers — no per-node action is needed.

Verify with Ansible:

```bash
ansible workers -i ~/pi-cluster/hosts.ini -a "mpirun --version"
ansible workers -i ~/pi-cluster/hosts.ini -a "which orted"
```

Expected output per worker:
```
mpirun (Open MPI) 4.1.6
/usr/bin/orted
```

!!! info "`orted` vs `prted`"
    OpenMPI 4.x uses `orted` as its worker daemon. OpenMPI 5.x switched to `prted`
    (PRRTE-based). The master must use a 4.x `mpirun` so it launches `orted`, not `prted`,
    on the workers.

---

## Step 7 — Configure the Master to Use OpenMPI 4.1.x

The Pi 5 Master still has OpenMPI 5.0.7 installed system-wide. You need a 4.1.x `mpirun` on the master to be wire-protocol compatible with the workers.

**Option A — Compile 4.1.6 natively on the master** (recommended for identical binaries):

```bash
cd /tmp/openmpi-4.1.6
find . -name "Makefile.in" -o -name "aclocal.m4" -o -name "configure" -o -name "*.c" \
    | xargs touch

./configure --prefix=/usr/local/openmpi4 --sysconfdir=/etc/openmpi4 --disable-oshmem

make -j$(nproc)
sudo make install
```

Add it to PATH (prepend so it takes priority over system 5.0.7):

```bash
echo 'export PATH=/usr/local/openmpi4/bin:$PATH' >> ~/.bashrc
echo 'export LD_LIBRARY_PATH=/usr/local/openmpi4/lib:$LD_LIBRARY_PATH' >> ~/.bashrc
source ~/.bashrc

mpirun --version
# Expected: mpirun (Open MPI) 4.1.6
```

**Option B — Pin the system OpenMPI to 4.1.4** (simpler, no compile needed):

```bash
# Requires a Bookworm .deb on a Trixie host — use apt pinning or offline install
sudo apt-get install -y --allow-downgrades \
    openmpi-bin=4.1.4-5 libopenmpi3=4.1.4-5 libopenmpi-dev=4.1.4-5

# Prevent auto-upgrade back to 5.x
echo "openmpi-bin hold" | sudo dpkg --set-selections
echo "libopenmpi3 hold" | sudo dpkg --set-selections
```

---

## Step 8 — Compile the MPI Pi Benchmark for Workers

The benchmark binary at `backend/mpi/mpi_pi.c` must be compiled **inside the chroot** so it links against Bookworm's GLIBC 2.36 and can run on the workers. The chroot cannot see the master's home directory, so copy the source in first.

```bash
# 1. Copy the source into the chroot's /tmp
sudo cp ~/Threat-Detection-System/backend/mpi/mpi_pi.c /nfs/rootfs64/tmp/

# 2. Compile inside the chroot (links against Bookworm GLIBC 2.36)
sudo chroot /nfs/rootfs64 /bin/bash -c \
  "mpicc /tmp/mpi_pi.c -o /usr/local/bin/mpi_pi -lm"

# 3. Verify the binary is in place on the shared rootfs
ls -la /nfs/rootfs64/usr/local/bin/mpi_pi
file /nfs/rootfs64/usr/local/bin/mpi_pi
# Expected: ELF 64-bit LSB pie executable, ARM aarch64 ...

# 4. Verify all workers can see it (NFS shared — no per-node copy needed)
ansible workers -i ~/pi-cluster/hosts.ini -a "ls -la /usr/local/bin/mpi_pi"
```

!!! warning "Do not compile with the master's `/usr/local/openmpi4/bin/mpicc`"
    OpenMPI 4.1.6 was compiled natively on Trixie, so its `mpicc` links against GLIBC 2.38.
    The resulting binary will fail on Bookworm workers with `GLIBC_2.38 not found`.
    Always use the chroot `mpicc` for worker binaries.

---

## Step 9 — Fix MCA Plugin Conflicts

After installing OpenMPI 4.1.6 into the shared rootfs, the old Bookworm 4.1.4 `mca_pmix_ext3x` plugin is still present in a different directory. It links against `libpmix.so.2` which is installed in a non-standard sub-path (`pmix2/lib/`), so it fails to load at runtime and blocks PMIx initialisation entirely.

```bash
# 1. Remove the old 4.1.4 ext3x plugin (we have pmix3x from 4.1.6 now)
sudo rm /nfs/rootfs64/usr/lib/aarch64-linux-gnu/openmpi/lib/openmpi3/mca_pmix_ext3x.so

# 2. Register the pmix2/lib path so ldconfig finds libpmix.so.2
echo '/usr/lib/aarch64-linux-gnu/pmix2/lib' | \
  sudo tee /nfs/rootfs64/etc/ld.so.conf.d/pmix.conf
sudo chroot /nfs/rootfs64 ldconfig
```

!!! info "Why two plugin directories?"
    Debian's 4.1.4 apt package installed MCA plugins to `/usr/lib/aarch64-linux-gnu/openmpi/lib/openmpi3/`.
    Our 4.1.6 `make install --prefix=/usr` installed to `/usr/lib/openmpi/`.
    Both directories are in `orted`'s MCA search path, causing the old ext3x to be picked up first.

---

## Step 10 — Verified Working mpirun Command

Always pass `--prefix /usr` so `mpirun` tells workers to load MCA plugins from `/usr/lib/openmpi/` (where 4.1.6 installed `mca_pmix_pmix3x.so`):

```bash
mpirun --prefix /usr -np 8 \
  --host 192.168.1.58,192.168.1.54,192.168.1.104,192.168.1.136,192.168.1.86,192.168.1.117,192.168.1.83,192.168.1.133 \
  /usr/local/bin/mpi_pi 100000000
```

Expected output:
```
--- MPI PI CALCULATION RESULTS ---
PROCS: 8
INTERVALS: 100000000
CALCULATED_PI: 3.1415926535896133
EXACT_PI: 3.1415926535897931
ERROR: 1.7985612998927536e-13
ELAPSED_TIME_SECONDS: 0.708879916
----------------------------------
```

8 nodes completing 100M Monte Carlo intervals in **~0.71 seconds** ✅

---

## Step 11 — Run the Benchmark via the FastAPI Backend & Database

To fully verify the end-to-end cloud infrastructure, run the MPI cluster benchmark through the FastAPI backend API and confirm that execution logs are persisted to the PostgreSQL database.

### 11.1 — Start the Backend on the Pi 5 Master
Connect to your Pi 5 Master over SSH and launch the backend using `uvicorn`:
```bash
cd ~/Threat-Detection-System/backend
source venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8001
```

### 11.2 — Authenticate via Swagger UI
Open your browser and navigate to the Swagger Documentation at **`http://192.168.1.50:8001/docs`**.

1. **Register a User**:
   * Expand `POST /api/v1/auth/register` and click **Try it out**.
   * Request body:
     ```json
     {
       "username": "admin",
       "email": "admin@threatdetection.com",
       "password": "securepassword123",
       "role": "admin"
     }
     ```
   * Click **Execute** (`201 Created` response).

2. **Authenticate & Authorize**:
   * Expand `POST /api/v1/auth/login` and click **Try it out**.
   * Submit credentials:
     ```json
     {
       "username": "admin",
       "password": "securepassword123"
     }
     ```
   * Click **Execute**, then copy the `access_token` from the response body.
   * Scroll to the top right of the Swagger UI and click the green **Authorize** lock button.
   * Paste the token into the text field as `Bearer <your_token>` (or just the raw token string depending on UI configuration), click **Authorize**, and close the modal.

---

### 11.3 — Trigger the Benchmark API Request
Scroll down to the **Cluster** endpoints, expand `POST /api/v1/cluster/mpi/run`, click **Try it out**, and provide the following payload:

#### Request Body
```json
{
  "tasks": 8,
  "intervals": 100000000,
  "hosts": [
    "192.168.1.58",
    "192.168.1.54",
    "192.168.1.104",
    "192.168.1.136",
    "192.168.1.86",
    "192.168.1.117",
    "192.168.1.83",
    "192.168.1.133"
  ],
  "parallel_fraction": 0.98
}
```

#### Executing via cURL
Alternatively, you can run this request from your terminal:
```bash
curl -X 'POST' \
  'http://192.168.1.50:8001/api/v1/cluster/mpi/run' \
  -H 'accept: application/json' \
  -H 'Authorization: Bearer <your_jwt_access_token>' \
  -H 'Content-Type: application/json' \
  -d '{
  "tasks": 8,
  "intervals": 100000000,
  "hosts": [
    "192.168.1.58",
    "192.168.1.54",
    "192.168.1.104",
    "192.168.1.136",
    "192.168.1.86",
    "192.168.1.117",
    "192.168.1.83",
    "192.168.1.133"
  ],
  "parallel_fraction": 0.98
}'
```

---

### 11.4 — Analyze the Cluster Performance Response
The API compiles the scaling law mathematics dynamically based on the execution times returned by the cluster. Upon success (`200 OK`), you will receive a response similar to the following:

```json
{
  "run_id": "4c585726-d79f-4469-8a30-e8e3c975d3af",
  "executed_at": "2026-05-31T15:49:47.903305+00:00",
  "success": true,
  "procs": 8,
  "intervals": 100000000,
  "calculated_pi": 3.1415926535896133,
  "exact_pi": 3.141592653589793,
  "error": 1.7985612998927536e-13,
  "elapsed_time_seconds": 0.663249392,
  "raw_output": "--- MPI PI CALCULATION RESULTS ---\nPROCS: 8\nINTERVALS: 100000000\nCALCULATED_PI: 3.1415926535896133\nEXACT_PI: 3.1415926535897931\nERROR: 1.7985612998927536e-13\nELAPSED_TIME_SECONDS: 0.663249392\n----------------------------------\n",
  "elapsed_wall_time": 2.5540000000000873,
  "command": "/usr/local/openmpi4/bin/mpirun --prefix /usr -np 8 --host 192.168.1.58,192.168.1.54,192.168.1.104,192.168.1.136,192.168.1.86,192.168.1.117,192.168.1.83,192.168.1.133 /usr/local/bin/mpi_pi 100000000",
  "scaling_laws": {
    "parallel_fraction": 0.98,
    "theoretical_amdahl_speedup": 7.017543859649122,
    "theoretical_gustafson_speedup": 7.859999999999999,
    "amdahl_efficiency": 87.71929824561403,
    "gustafson_efficiency": 98.25
  }
}
```

### 📊 Performance Insights
* **Parallel Execution Time**: Only **`0.66 seconds`** to evaluate `100,000,000` intervals!
* **Amdahl's Efficiency**: **`87.72%`** due to static serialization parts (e.g. gathering results).
* **Gustafson's Efficiency**: An incredible **`98.25%`** scaling factor for massive data volumes!
* **Data Persistence**: With the timezone-awareness fix applied to `executed_at`, the run metadata, exact execution logs, and speedup ratios are automatically stored in the PostgreSQL database table `cluster_runs` for permanent record.

