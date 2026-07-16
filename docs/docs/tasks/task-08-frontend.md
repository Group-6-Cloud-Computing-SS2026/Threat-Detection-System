# Task 8 â€” Frontend Dashboard

The frontend of the Threat Detection System is a React + TypeScript single-page application deployed on the K3s cluster. It provides security operators with a real-time surveillance dashboard: a live camera feed streamed directly from the edge node, continuous detection event monitoring, historical event search, and cluster monitoring links.

---

## 1. Team & Presentation Split

| Order | Presenter | Sections | Contribution Area |
|---|---|---|---|
| **1st** | **Md. Forman Ullah Sajib** | 2, 3, 4, 5 | Backendâ€“frontend wiring, authentication, live camera stream, detection data, deployment |
| **2nd** | Javier de Santiago | 6, 7, 8 | Application structure, design system, pages, UI components |

---

## 2. How the Frontend Connects to the Backend
*Presenter: Md. Forman Ullah Sajib*

```mermaid
graph TD
    Browser["Browser (React SPA)"]
    Nginx["Nginx (frontend Pod :80)"]
    Traefik["Traefik Ingress (192.168.1.50)"]
    FastAPI["FastAPI Backend (9 replicas)"]
    WS["/stream/ws â€” WebSocket"]
    REST["/api/v1/detections â€” REST"]
    DB[("PostgreSQL")]
    S3["MinIO S3"]
    Edge["Edge Node (Pi Camera + YOLO)"]

    Browser -->|HTTP| Nginx
    Nginx -->|Proxy /api/*| Traefik
    Traefik --> FastAPI
    FastAPI --> WS & REST
    WS -->|base64 JPEG frames| Browser
    REST -->|JSON paginated events| Browser
    FastAPI --> DB & S3
    Edge -->|MQTT + base64 frames| FastAPI
```

The browser always talks to port 80 on the Nginx pod. Nginx forwards every `/api/*` request to the backend through Traefik, which load-balances across the 9 FastAPI replicas. This single-origin setup eliminates all CORS issues for both REST calls and the WebSocket camera stream upgrade handshake.

---

## 3. Authentication
*Presenter: Md. Forman Ullah Sajib*

```mermaid
sequenceDiagram
    participant User
    participant LoginPage
    participant FastAPI

    User->>LoginPage: Enter username + password
    LoginPage->>FastAPI: POST /api/v1/auth/login
    FastAPI-->>LoginPage: JWT token + username
    LoginPage->>localStorage: Save token (tds-auth-state)
    LoginPage-->>User: Redirect to dashboard

    User->>Browser: Reload page
    Browser->>localStorage: Read saved token
    Browser-->>User: Dashboard loads (no re-login needed)
```

- On every API call, the token is attached automatically: `Authorization: Bearer <token>`
- If the token is missing or expired, the user is redirected back to the login page
- Registration supports three roles: `viewer`, `operator`, `admin`
- The token is also passed as a query parameter when opening the WebSocket: `/stream/ws?token=<jwt>`

---

## 4. Live Data Integration
*Presenter: Md. Forman Ullah Sajib*

### 4.1 â€” Live Camera Feed (WebSocket)

The camera stream is the most real-time component of the dashboard. Standard REST polling would be too slow for video frames, so a persistent WebSocket connection is used instead.

```mermaid
sequenceDiagram
    participant Pi as Pi Camera (Edge Node)
    participant MQTT as Mosquitto Broker
    participant API as FastAPI Backend
    participant Browser

    Pi->>MQTT: Publish base64 JPEG + timestamp
    MQTT->>API: Deliver frame (broadcast topic)
    API->>Browser: Forward via WebSocket /stream/ws
    Browser->>Browser: Render <img>, compute FPS & latency
```

- The browser opens the WebSocket connection on page load (after login)
- Each message from the backend contains a **base64-encoded JPEG** and a **timestamp**
- The dashboard renders the frame immediately by setting it as the `src` of an `<img>` element
- **Latency** is calculated as: `current time in browser âˆ’ timestamp on the frame` â€” shows the full delay from camera to screen
- **FPS** is a rolling average over the last 10 frames
- If the connection drops (e.g. a backend pod restarts), it automatically reconnects after 5 seconds
- Status badge shows: `Live` / `Connecting` / `Offline`

### 4.2 â€” Live Detection Panel

- Calls `GET /api/v1/detections/recent?limit=8` every **10 seconds**
- Displays the 8 most recent detection events as cards with severity colour-coding: `critical`, `high`, `medium`, `low`
- Auto-refresh can be paused with a toggle button
- Click any card to expand it and see:
  - The raw detection data from YOLO (bounding boxes, labels)
  - The metadata object
  - The annotated JPEG image saved in MinIO

### 4.3 â€” Event Search & Filter

- Filter by: event type, severity, sensor ID, whether acknowledged, start/end time, page size
- Results are paginated â€” total count and current offset are shown
- Same expandable card layout as the live panel

### 4.4 â€” How Images Are Loaded from MinIO

Detection images are stored in MinIO (S3-compatible object storage). To display them in the browser:

1. The detection card fetches the event detail from `GET /api/v1/detections/{id}`
2. The response includes the MinIO storage key for each image
3. The browser loads the image directly via `GET /api/v1/images/{id}/download`

This endpoint has **no JWT check** â€” deliberately. A standard `<img src="...">` HTML tag cannot attach custom headers, so the image endpoint is made publicly accessible while the event data endpoints remain protected.

---

## 5. Deployment â€” Docker + Kubernetes
*Presenter: Md. Forman Ullah Sajib*

### Multi-Stage Dockerfile

The frontend uses a two-stage build so the final container image contains only Nginx and the compiled static files â€” no Node.js, no build tools:

```
Stage 1 (node:20-alpine)    â†’   npm install + vite build  â†’  /dist
Stage 2 (nginx:1.25-alpine) â†’   copy /dist + nginx.conf   â†’  serve on :80
```

### Nginx Configuration

```nginx
location /api/ {
    proxy_pass http://tds-api:8000/api/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

The `Upgrade` and `Connection` headers are required so that the WebSocket handshake passes through Nginx to the backend â€” without these, the live camera stream would fail to connect.

### Kubernetes (`frontend.yaml`)

- **Deployment**: 1 replica â€” the frontend is stateless (all data lives in the backend)
- **Service**: ClusterIP on port 80
- **Ingress**: Traefik routes `http://192.168.1.50/` to this pod; `/api/*` is forwarded to the backend service

---

## 6. Application Structure & Design System
*Presenter: Javier de Santiago*

### 6.1 â€” Project Initialisation & Tooling
- **React + TypeScript + Vite** project scaffolded as the build foundation
- **TailwindCSS** integrated with a custom extended colour palette and `@tailwindcss/forms`
- **Prettier** with Tailwind plugin enforced via **Husky** pre-commit hooks for consistent code style across the team
- **React Router v6** configured with nested routes and a `RouterProvider`, separating the public landing from the authenticated app shell

### 6.2 â€” Landing Page
The public-facing landing page introduces the project to visitors before login:

- **HeroHome** â€” animated headline with `PageIllustration` and `Spotlight` SVG effects
- **Features** section â€” capability overview cards
- **Workflows** section â€” pipeline description
- **CTA** section â€” call-to-action block
- **Header** â€” navigation with logo and links
- **Footer** â€” team credits and tech stack wordmarks (custom SVGs)
- **AOS (Animate on Scroll)** library integrated for entrance animations; disabled dynamically on small screens

### 6.3 â€” Authenticated Application Pages

| Page | Route | Description |
|---|---|---|
| Home / Dashboard | `/home` | Detection dashboard and summary cards |
| Operations | `/operations` | Sensor operations and management tables |
| Search Events | `/search` | Historical event search with filters |
| Graphs | `/graphs` | Amdahl's & Gustafson's Law scaling results with Chart.js |
| Docs | `/docs` | MkDocs documentation links |
| Settings | `/settings` | API configuration and user preferences |
| Login / Register | `/login` | Tabbed authentication form |
| Profile | `/profile` | User profile page |

### 6.4 â€” Reusable Component Library
- `Button` â€” reusable variant-aware button component
- `Logo` / wordmark SVGs â€” brand assets
- `HomeSidebar` â€” collapsible mobile navigation with toggle
- Custom **Nacelle** font family loaded via `@font-face`
- PWA manifest and updated favicon

---

## 7. UI Pages â€” Detail
*Presenter: Javier de Santiago*

### 7.1 â€” GraphsPage (Scaling Law Results)
- Displays **Amdahl's Law** and **Gustafson's Law** benchmark results from the cluster benchmarking task
- Line charts rendered with **Chart.js** with custom colour palettes, tooltip styling, and typed options
- Tables with multi-line headers, column width adjustments, and **horizontal drag-to-scroll** on mobile
- Responsive layout switching between grid and flex depending on viewport

### 7.2 â€” OperationsPage
- Sectioned tables showing sensor operations and system status
- Consistent `operationsErrorClass` centralised error styling
- Responsive layout fixes for narrow viewports

### 7.3 â€” DocsPage
- Type-safe documentation URL map
- Section cards linking to the MkDocs documentation site

### 7.4 â€” SettingsPage
- API Base URL configuration
- Flex-based responsive layout with updated button styles

---

## 8. Technology Stack
*Presenter: Javier de Santiago*

| Technology | Purpose |
|---|---|
| React 18 + TypeScript | UI framework, type-safe components |
| Vite | Dev server + production build |
| TailwindCSS | Utility-first styling with custom palette |
| React Router v6 | Client-side routing and protected routes |
| Chart.js | Benchmark result visualisation |
| AOS | Scroll-triggered animations |
| Prettier + Husky | Code style enforcement |
| Nginx 1.25 (Alpine) | Static file serving + API reverse proxy |
| Docker | Container packaging |
| Kubernetes (k3s) | Cluster deployment |

---

## 9. Related Files

- [frontend/src/App.tsx](../../frontend/src/App.tsx) â€” Data integration dashboard (auth, WebSocket, detections, search)
- [frontend/Dockerfile](../../frontend/Dockerfile) â€” Multi-stage production container
- [frontend/nginx.conf](../../frontend/nginx.conf) â€” Nginx reverse proxy + WebSocket passthrough
- [k8s/frontend.yaml](../../k8s/frontend.yaml) â€” Kubernetes Deployment, Service, and Ingress
- [backend/app/services/mqtt_service.py](../../backend/app/services/mqtt_service.py) â€” MQTT Shared Subscription service (backend side of the camera stream)
- [edge_node/edge_camera_publisher.py](../../edge_node/edge_camera_publisher.py) â€” Pi Camera MQTT publisher
