# ThreatOff Frontend

ThreatOff is the React + TypeScript dashboard for the **Threat Detection System** project.  
It provides live camera monitoring, threat detection views, event search, system operations, and platform documentation in a single web UI.

## Tech Stack

- React 19
- TypeScript 5.6
- Vite 6
- React Router 7
- Tailwind CSS 4
- AOS (scroll animations)
- Nginx (static serving + reverse proxy)

## Key Features

- JWT-based authentication (login/register flow)
- Live camera stream (WebSocket + MQTT-backed pipeline)
- Recent detections panel with severity tags
- Advanced event search & filtering
- Operations dashboard (logs, infrastructure, metrics, cluster views)
- Runtime API endpoint configuration via Settings page
- Public landing/docs pages + protected dashboard routes

## Project Structure (frontend)

- `src/router/` — route definitions and guards
- `src/pages/` — page-level screens (`/landing`, `/camera`, `/search`, `/settings`, etc.)
- `src/components/` — reusable UI components
- `Dockerfile` — multi-stage frontend build (Node → Nginx)
- `nginx.conf` — SPA serving + backend/docs proxy rules

## Configuration

The frontend uses:

- `VITE_API_BASE_URL` (default: `/api/v1`)

This value is baked at build time and can also be adjusted at runtime in the Settings page (stored in `localStorage`).

## Local Development

From the `frontend/` directory:

```bash
npm install
npm run dev
```

Build production assets:

```bash
npm run build
```

Preview production build locally:

```bash
npm run preview
```

## Docker

The frontend container is built with a multi-stage Dockerfile:

1. Build static assets with `node:20-alpine`
2. Serve with `nginx:alpine`

Typical build/run:

```bash
docker build -t threatoff-frontend .
docker run -p 8080:80 threatoff-frontend
```

## Deployment Notes

- Designed to run behind Kubernetes + Traefik.
- Nginx serves the SPA and forwards selected backend-facing paths.
- Frontend is stateless (safe to scale horizontally).

## Related Files

- `frontend/Dockerfile`
- `frontend/nginx.conf`
- `k8s/frontend.yaml`
- `docs/docs/tasks/task-08-frontend.md`
