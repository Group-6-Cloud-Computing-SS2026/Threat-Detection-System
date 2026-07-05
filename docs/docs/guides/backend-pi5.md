# Local Development & Backend Setup Guide

This guide describes how to run and test the complete Threat Detection System backend on your local developer workstation (Windows, macOS, or Linux). This setup is highly recommended for frontend developers who need to test visual dashboards and API endpoints locally without deploying directly to the physical Raspberry Pi cluster.

!!! info "Database migrations run automatically"
    Since v3, `alembic upgrade head` is called automatically every time the backend starts. You no longer need to run migrations manually on a fresh database.

---

## 0. Required: Copy the Environment File

Before starting the backend for the first time, copy the example env file:

```bash
cd backend/
copy .env.example .env        # Windows
cp .env.example .env          # Linux / macOS
```

The following variables must be set correctly before the backend will start:

| Variable | Default | Notes |
|---|---|---|
| `JWT_SECRET_KEY` | `dev-secret-change-in-production` | Change in production |
| `POSTGRES_HOST` | `localhost` | Use `192.168.1.50` to connect to Pi5 |
| `MINIO_ENDPOINT` | `localhost:9000` | Use `192.168.1.50:9000` to connect to Pi5 |
| `MQTT_BROKER_HOST` | `localhost` | Use `192.168.1.50` to connect to Pi5 |
| `MQTT_TOPIC_CAMERA` | `cluster/camera/#` | Required for Pi4 camera event ingestion |
| `DATABASE_CONNECT_TIMEOUT_SECONDS` | `30` | Required — was missing before v3 |
| `DATABASE_COMMAND_TIMEOUT_SECONDS` | `30` | Required — was missing before v3 |

---

## 1. Quick Start: Docker Compose (Recommended)

The easiest and fastest way to launch the entire backend stack—including the FastAPI server, PostgreSQL database, MinIO object storage, and Mosquitto MQTT broker—is using Docker Compose.

### Step 1 — Start the local stack
Navigate to the `backend/` folder on your workstation and start Compose:
```bash
cd backend/
docker compose up --build
```

### What this spins up locally:
* 🚀 **FastAPI API** on `http://localhost:8001` (with `--reload` active so local file edits apply instantly)
* 🐘 **PostgreSQL** on `localhost:5432` (pre-configured with `threat_detection` database)
* 🪣 **MinIO S3 API** on `localhost:9000` (Web Console on `localhost:9001`)
* 🔌 **Mosquitto MQTT** on `localhost:1883` (WebSocket connection on `localhost:9883`)

To stop the containers and clear local volumes at any time, run:
```bash
docker compose down -v
```

!!! warning "Docker not installed on Windows?"
    If `docker` is not recognised, install Docker Desktop from https://www.docker.com/products/docker-desktop/ then restart.  Alternatively use the venv method in section 2.

---

## 2. Alternative: Local Virtual Environment (Manual Setup)

If you prefer to run the FastAPI application directly on your host OS without Docker, you can configure a standard Python virtual environment.

### Step 1 — Configure the Virtual Environment
Navigate to the `backend/` folder and initialize a python environment:
```bash
cd backend/
python3 -m venv venv
source venv/bin/activate  # On Windows use: .\venv\Scripts\activate
```

### Step 2 — Install Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### Step 3 — Start your Local Databases
*Note: The manual FastAPI runtime still expects active PostgreSQL, MinIO, and MQTT broker instances running on your machine. You can start just the database and broker dependencies in Docker while running the code natively:*
```bash
# Start only postgres, minio, and mqtt
docker compose up -d postgres minio mqtt
```

### Step 4 — Run the FastAPI Server
Start Uvicorn with auto-reload active:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8001 --reload
```

---

## 3. Interactive API Playground & Playbook

Once your backend is running (either via Docker Compose or manually), you can test authentication, sensor heartbeats, and cluster API endpoints using the interactive Swagger UI.

### Step 1 — Open the Swagger Documentation
Open your workstation browser and go to:
👉 **`http://localhost:8001/docs`**

!!! tip "Swagger is also accessible from the frontend dashboard"
    In the deployed K3s cluster, click **Open Swagger API** in the top-right of the dashboard, or navigate directly to `http://192.168.1.50/docs`.

### Step 2 — Register a Developer Account
Because backend endpoints are protected by JWT Bearer security, you must register a test user:
1. Locate and expand **`POST /api/v1/auth/register`**.
2. Click **Try it out** and run with this body:
   ```json
   {
     "username": "developer",
     "email": "dev@threatdetection.com",
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
     "username": "developer",
     "password": "securepassword123"
   }
   ```
3. Click **Execute** and copy the `access_token` string from the JSON response.
4. Scroll to the top of the Swagger page, click the green **Authorize** padlock button, paste the token into the `Value` box, and click **Authorize**.

Your local browser session is now authenticated! You can test any frontend API request directly against `http://localhost:8001`.
