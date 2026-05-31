# Native Backend & Database Setup on Pi 5

A step-by-step guide to installing, configuring, migrating, and running the FastAPI backend and PostgreSQL database natively on the Raspberry Pi 5 Master node.

---

## 1. Native PostgreSQL Database Setup (Already Completed)

!!! You must skip this section because it is already completed on the Pi 5 Master node. Only look through if you are setting up a fresh environment from scratch.

The active Pi 5 Master node already has PostgreSQL installed, running, and pre-configured with the database `threat_detection` and user `tds_user` (password: `tds_secret`). You can **skip** all steps in this section unless you are setting up a fresh environment from scratch.

Since the backend requires a PostgreSQL database to log events and cluster analytics, install and configure it directly on the Pi 5 host.

### Step 1 — Install PostgreSQL
```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib
```

### Step 2 — Start and Enable the Database
```bash
sudo systemctl enable --now postgresql
```

### Step 3 — Create App User & Database
Configure the database with the exact credentials and database name that the backend configuration expects:
```bash
sudo -u postgres psql -c "CREATE USER tds_user WITH PASSWORD 'tds_secret';"
sudo -u postgres psql -c "CREATE DATABASE threat_detection OWNER tds_user;"
```

---

## 2. Python Environment & PEP 668 Bypass

!!! success "Already Completed (Skip)"
    A Python virtual environment (`venv`) has already been created at `~/Threat-Detection-System/backend/venv` with all required dependencies (including `psycopg2-binary`) installed. You can **skip** the setup steps and proceed directly to activating the virtual environment when you want to run the server.

Modern Raspberry Pi OS versions (Debian Bookworm) block global `pip install` commands using **PEP 668** to prevent conflicts with system packages. We bypass this cleanly using a Python virtual environment.

### Step 1 — Create and Activate the Virtual Environment
Navigate to your backend repository folder and initialize the environment:
```bash
cd ~/Threat-Detection-System/backend
python3 -m venv venv
source venv/bin/activate
```
*(Your terminal prompt will now display `(venv) cc123@pi5-master...` indicating it is active).*

### Step 2 — Install Backend Dependencies
With the virtual environment active, install all packages:
```bash
pip install -r requirements.txt
```

---

## 3. Database Migrations with Alembic

!!! success "Already Completed (Skip)"
    All Alembic migrations (`alembic upgrade head`) have already been successfully applied to the database on the Pi 5 host. You do not need to run this command again unless you modify the database models or schema.

The backend uses **Alembic** to manage database tables. Alembic requires a synchronous database adapter (`psycopg2-binary`) to apply migrations.

### Step 1 — Run Database DDL Migrations
To construct all tables (Users, Sensors, Detections, Logs, Health, and Cluster Runs) in PostgreSQL, run:
```bash
alembic upgrade head
```

---

## 4. Run the Backend Server

Start the Uvicorn FastAPI server on the Pi 5 host listening on port `8001`:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8001
```

---

## 5. Live Verification & Cluster Testing Playbook

Once the server is running, you can fully test the Threat Detection backend, authentication, and parallel C MPI benchmark execution using the interactive Swagger UI.

### Step 1 — Open the Interactive Swagger Docs
Open a web browser on your PC and navigate to:
👉 **`http://192.168.1.50:8001/docs`** (Interactive Swagger documentation)

### Step 2 — Register an Admin Account
Because cluster operations are protected by JWT Bearer security, you must register a user first:
1. Locate and expand **`POST /api/v1/auth/register`**.
2. Click **Try it out** and run with this request body:
   ```json
   {
     "username": "admin",
     "email": "admin@threatdetection.com",
     "password": "securepassword123",
     "role": "admin"
   }
   ```
3. Click **Execute** (you will receive a `201 Created` response).

### Step 3 — Authenticate & Receive JWT Token
1. Expand **`POST /api/v1/auth/login`**.
2. Click **Try it out** and enter the credentials:
   ```json
   {
     "username": "admin",
     "password": "securepassword123"
   }
   ```
3. Click **Execute** and copy the long `access_token` string from the JSON response.
4. Click the green **Authorize** padlock button at the top right of the Swagger page.
5. Paste your token into the `Value` box, click **Authorize**, and then click **Close**.

### Step 4 — Trigger the Parallel MPI Cluster Benchmark
With active authorization, you can run parallel Monte Carlo $\pi$ calculations dynamically across all 8 active worker nodes!
1. Expand **`POST /api/v1/cluster/mpi/run`**.
2. Click **Try it out**.
3. Supply the list of active worker node IP addresses and specify the parallel processes (`tasks`):
   ```json
   {
     "tasks": 16,
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
4. Click **Execute** to watch the cluster compile and run in parallel!

---

## 6. Verification Troubleshooting (Operational Gotchas)

### 6.1 — ValueError: bcrypt & passlib Mismatch
If user registration fails with an `Internal Server Error (500)` and the Uvicorn log displays:
```
ValueError: password cannot be longer than 72 bytes, truncate manually...
```

This is caused by a self-test compatibility bug between `passlib` and `bcrypt>=4.0.0`. Resolve it on the Pi 5 Master by downgrading `bcrypt` inside your active virtual environment:
```bash
pip install "bcrypt<4.0.0"
```

### 6.2 — MPI Execution Hangs (SSH Host Key Checking Prompt)
If executing the MPI endpoint hangs indefinitely, it means `mpirun` is waiting in the background for manual confirmation to trust the SSH keys of the newly added worker nodes.

Bypass this permanently by configuring the Master to automatically accept host keys on the private local subnet:
```bash
# Create or append SSH configuration on the Pi 5 Master
cat << 'EOF' >> ~/.ssh/config
Host 192.168.1.*
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null
EOF
chmod 600 ~/.ssh/config
```
