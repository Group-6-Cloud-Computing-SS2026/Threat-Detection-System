# Task 8 — Frontend

The frontend of the Threat Detection System is a single-page application called **ThreatOff — Surveillance Dashboard**, built with React 19 and TypeScript. It connects to the FastAPI backend via REST polling and WebSocket, providing operators with real-time visibility into live camera streams, AI detection events, historical event search, and parallel-computing benchmark results. The entire app is packaged as a Docker container (Nginx-served static bundle) and deployed to the k3s Kubernetes cluster alongside the backend.

**Tech stack:** React 19, TypeScript 5.6, Vite 6, Nginx, no external UI component library.

---

## 1. Authentication

The dashboard is fully gated behind JWT authentication. The login/registration screen is the only page rendered when no valid token exists in `localStorage`.

* **Login**: `POST /api/v1/auth/login` — credentials are exchanged for a JWT `access_token` stored in `localStorage` and sent as `Authorization: Bearer <token>` on every request.
* **Registration**: `POST /api/v1/auth/register` — supports roles `viewer`, `operator`, `admin`.
* **Sign Out**: Clears `localStorage` and returns the user to the login screen.

---

## 2. Dashboard Layout

Once authenticated, the app renders a two-column shell: a fixed-width left sidebar and a scrollable main area with a sticky top bar.

### Sidebar Navigation

| Section | Item | Action |
| :--- | :--- | :--- |
| **Dashboard** | Overview | Switches to the live feed + camera section |
| **Dashboard** | Search Events | Switches to the historical filter section |
| **System** | Settings | Switches to the connection settings form |
| **System** | API Docs | Opens `/docs` (Swagger UI) in a new tab |
| **System** | Scaling Law Results | Switches to the Task 4 graphs iframe |
| **System** | Grafana | Opens the Grafana cluster dashboard in a new tab |
| **Account** | Sign Out | Clears auth state and returns to the login page |

The sidebar footer displays the logged-in username and an initials avatar. The top bar shows the page title, last-updated timestamp, live feed and results counters, and a manual refresh button.

---

## 3. Overview Section — Live Detections & Camera Feed

The default section shown on login. It combines real-time detection polling with the live camera WebSocket stream.

### Stats Row

| Tile | Description |
| :--- | :--- |
| **Live Detections** | Count of events from the latest `/detections/recent` poll |
| **Critical Events** | Subset of live events with `severity = critical` |
| **Stream FPS** | Rolling average FPS over the last 10 WebSocket frames |

### Live Detections Card

* Polls `GET /detections/recent?limit=8` every **10 seconds** (auto-refresh togglable).
* A summary chip row groups events by `event_type` and shows the top 4 counts.
* Events are rendered as expandable **Detection Cards** (see §5).

### Camera Feed Card (WebSocket Stream)

The browser opens a persistent WebSocket to `ws://<host>/api/v1/stream/ws?token=<JWT>`. Each message carries a Base64-encoded JPEG frame and an ISO timestamp, rendered as a live `<img>` tag.

* Status badge: **Live** / **Connecting** / **Offline**.
* Telemetry bar: **Latency (ms)**, **FPS**, and total **Frame count**.
* Auto-reconnects after **5 seconds** on disconnect.

---

## 4. Search Events Section

Provides filtered, paginated access to the full detection database via `GET /api/v1/detections`.

| Field | API parameter |
| :--- | :--- |
| Event type | `event_type` |
| Severity | `severity` |
| Sensor ID | `sensor_id` |
| Acknowledged | `acknowledged` |
| Start / End time | `start_time` / `end_time` |
| Skip / Limit | `skip` / `limit` (max 200) |

**Search Events** fires the query; **Clear filters** resets all fields. Results show `Showing X of Y · offset Z`.

---

## 5. Detection Card — Collapsed & Expanded

Used in both the Overview and Search sections. Clicking a card lazily loads full detail via `GET /api/v1/detections/{id}`.

### Collapsed Row

| Element | Description |
| :--- | :--- |
| Thumbnail | Preview image; placeholder if none |
| Event type | `event_type` label |
| Severity chip | Colour-coded: `critical` → red, `high` → orange, `medium` → yellow, `low` → green |
| Ack badge | `new` or `acked` |
| Timestamp | Short date/time of detection |
| Confidence | Detection confidence as a percentage |
| Sensor ID | First 8 characters of the sensor UUID |

### Expanded Detail

Loaded lazily on first open.

* Full timestamp grid: Detected, Received, Created, Sensor ID.
* Raw Detections and Metadata as formatted JSON blocks.
* Saved preview image and a grid of stored images from `GET /api/v1/images/{id}/download`.

---

## 6. Scaling Law Results Section

Embeds [public/task_4_graphs.html](../../frontend/public/task_4_graphs.html) in a full-height `<iframe>` — Chart.js charts from the Task 4 benchmark runs on the 8× Pi 3 B+ cluster.

* **Amdahl's Law**: Speedup, total time, parallel efficiency, run variance, and observed vs. theoretical speedup (fixed 320×240 image, 1/2/4/8 nodes, 10 runs × 3 workloads).
* **Gustafson's Law**: Scaled speedup, efficiency, and comparison tables (problem size grows with node count).

---

## 7. Technology Stack & Artifacts

| Component | Details |
| :--- | :--- |
| React 19 + TypeScript 5.6 | Single-page app, no external state or UI library |
| Vite 6 | Dev server + production static bundle |
| Custom CSS (`App.css`) | Dark theme via CSS custom properties |
| Nginx | Serves static bundle, proxies `/api/` to the backend |
| [frontend/Dockerfile](../../frontend/Dockerfile) | Multi-stage: `node:20-alpine` → `nginx:alpine` |
| [frontend/nginx.conf](../../frontend/nginx.conf) | `/api/` proxy + SPA fallback |
| [k8s/frontend.yaml](../../k8s/frontend.yaml) | Kubernetes Deployment + Service + Traefik Ingress |

**Environment variable:** `VITE_API_BASE_URL` (default `/api/v1`) — baked into the bundle at build time.

---

## 8. Deployment

```bash
# Build and push
docker build -t localhost:5000/tds-frontend:latest ./frontend
docker push localhost:5000/tds-frontend:latest

# Deploy to k3s
kubectl apply -f k8s/frontend.yaml
kubectl rollout restart deployment tds-frontend
```

---
