# Sajib's Presentation Script — Task 7 (rest) + Task 8 (opening)

**Speaker:** Md. Forman Ullah Sajib  
**Slot:** ~4–5 minutes  
**Order:** You present Task 8 first (transition from your Task 7 sections), then Javier continues with design.

---

## Read This Before You Speak — How the Frontend Actually Works (Plain English)

Use this to understand the system yourself before presenting. You don't read this out loud.

**The problem the frontend solves:**
The backend is running on 9 Raspberry Pi nodes. It receives camera frames from the Pi camera over MQTT, saves threat detections to a database, and stores images in MinIO (which is like a self-hosted Google Cloud Storage). The frontend is the window that lets a security operator see all of this live, in a browser.

**Two things happen simultaneously in the browser:**

1. **Live camera video** — The browser opens a WebSocket connection (like a permanent phone call) to the backend. The backend keeps pushing camera frames down this connection. Each frame is a photo encoded as text (base64). The browser decodes it and puts it into an `<img>` tag. The user sees it as a live video. The dashboard also measures how long each frame took to travel from the camera to the browser (latency) and how many frames arrive per second (FPS).

2. **Detection events** — Every 10 seconds, the browser asks the backend "what are the latest detections?" The backend queries PostgreSQL and returns a list. Each detection card shows what was detected (a person, an object), how confident the AI was, and how severe it is. Click a card → it expands and shows the actual photo saved in MinIO.

**Authentication** — Before any of this works, the user logs in with a username and password. The backend checks the database and gives back a JWT token (a signed digital pass). Every time the browser makes an API call, it includes that token. The token is saved in the browser's localStorage so you don't have to log in again after a refresh.

**Deployment** — The frontend is a React app that gets built into plain HTML/CSS/JS files. Those files are served by Nginx (a web server). Nginx also acts as a middleman — when the browser asks for `/api/...`, Nginx forwards it to the FastAPI backend. This is why there are no CORS errors (the browser thinks everything comes from the same address).

---

## Transition From Task 7 (5 sec)

> "That's the backend side. Now let me show you the browser dashboard that makes all of this visible."

---

## Opening (20 sec)

> "Task 8 is the frontend — a React and TypeScript dashboard deployed on the same K3s cluster. I'll cover how it connects to the backend, the authentication, the live camera stream, and the deployment. Javier will then walk you through the design and the rest of the application pages."

---

## Part 1 — How It Connects to the Backend (45 sec)

> "The frontend is a single-page app served by an Nginx pod. Every request the browser makes for `/api/*` — whether that's fetching detection events or opening the camera stream — goes to Nginx, which proxies it to the FastAPI backend through Traefik.
>
> This matters because the browser only ever sees one address: port 80 on the frontend pod. It never directly calls the backend. That eliminates all CORS issues, and it means the WebSocket upgrade for the live camera also works without any special browser configuration."

*[Point to the architecture diagram if you have a slide]*

---

## Part 2 — Authentication (45 sec)

> "Before anything loads, the user has to log in. They enter their username and password, the backend validates it and returns a JWT token — basically a signed digital pass that says 'this user is authenticated'.
>
> That token is saved in localStorage, so if you refresh the page, you're still logged in. Every API call the browser makes attaches the token in the request header: `Authorization: Bearer <token>`.
>
> The WebSocket for the camera stream also needs the token — it's passed as a URL parameter when the connection is opened: `/stream/ws?token=...`
>
> If the token is missing or expired, you get redirected back to the login page automatically."

---

## Part 3 — Live Camera Feed (1 min)

> "This is the most real-time part of the dashboard. Standard REST would be too slow for video — you'd see one still photo every second at best. So the dashboard opens a **WebSocket** — a persistent two-way connection — to the backend.
>
> The backend is already receiving camera frames over MQTT from the Raspberry Pi camera. As each frame arrives, it relays it down the WebSocket to every connected browser.
>
> Each frame is a JPEG image encoded as base64 text. The browser decodes it and puts it into an `<img>` tag. This updates several times a second — it looks like live video.
>
> The dashboard also shows three telemetry numbers in real time: **latency** — how many milliseconds from the camera to your screen — **FPS**, which is the rolling average over the last 10 frames — and the **total frame count**.
>
> If the connection drops — say a backend pod gets rescheduled — the dashboard automatically tries to reconnect every 5 seconds. The status badge shows Live, Connecting, or Offline."

---

## Part 4 — Detection Events & Search (45 sec)

> "Alongside the camera, the dashboard polls for detection events every 10 seconds. These are the events saved to PostgreSQL when the YOLO model on the edge node classifies something as a threat.
>
> Each event shows the type — for example, 'person' — the severity level colour-coded from green to red, and the confidence score.
>
> Expand a card and you see the raw detection JSON from YOLO, and the annotated photo stored in MinIO.
>
> The Search section lets an operator query the full database by event type, severity, sensor ID, time range, and whether the event has been acknowledged. Results are paginated.
>
> The same build can point at either the Pi5 standalone or the full cluster — you just change the API URL in Settings without rebuilding the container."

---

## Part 5 — Deployment (30 sec)

> "For deployment, the frontend is a two-stage Docker image. Stage one uses Node to run the Vite build and produce the static files. Stage two drops them into an Nginx Alpine image — no Node in production, so the container is small and fast to pull on the Pi nodes.
>
> The Kubernetes manifest is a single-replica Deployment — the frontend is stateless so one pod is enough — behind a ClusterIP Service, routed by Traefik Ingress.
>
> I'll hand over to Javier now for the design system and the rest of the application pages."

---

## Likely Questions For You

**Q: What is a WebSocket and why not just use REST?**
> "REST is request-response — the browser asks, the server answers, the connection closes. For video you'd have to ask many times per second, which is slow and wastes bandwidth. A WebSocket is a single persistent connection that stays open — the server can push data to the browser at any time. That's what makes the live video possible."

**Q: What is base64?**
> "It's a way to represent binary data — like a JPEG image — as plain text. The camera sends the raw image bytes, the backend encodes them as base64 text, sends that through the WebSocket as a text message, and the browser decodes it back into an image. It's not the most efficient format but it works simply over any text-based protocol."

**Q: Why is the image download endpoint public (no JWT)?**
> "A standard HTML `<img>` tag can't attach custom headers — it just fetches the URL as-is. If the image endpoint required a JWT header, the image would never load in the browser. So that specific endpoint skips the token check. All the event data endpoints are still protected."

**Q: Why one replica for the frontend but nine for the backend?**
> "The backend needs nine replicas because each one subscribes to MQTT and handles WebSocket connections — more replicas means more capacity. The frontend just serves static files. Any replica handles any request identically, and since there's no per-connection state, one pod is enough. If traffic grew, you'd just increase the replica count."


---

## What You Actually Did (Read This First)

Before you speak, be clear in your own head:

| Area | What you did | What you did NOT do |
|---|---|---|
| Task 7 backend | Wired live MQTT camera stream into the backend. Implemented `mqtt_service.py` (MQTT Shared Subscriptions). Extended detection service to save camera frames to DB. Extended the detections API to filter by event type. | Designed the DDD architecture, repositories, or service layer structure (that was Abdul Hanan). |
| Telegram bot | Built an initial Telegram notification implementation | Final version in the repo was a replacement by a teammate. |
| Task 8 frontend | Built the entire functional dashboard App.tsx (1,117 lines): JWT auth, WebSocket camera stream, live detection cards, search/filter, image viewer, Dockerised it, wrote the K8s manifest. | The visual landing page and final visual design polishing was done by Javier. |

**Framing tip:** You don't need to hide any of this. "I was the integration engineer" is a strong and honest role. The system wouldn't work without someone connecting the real hardware to the software.

---

## PART A — Task 7 Sections 6–9 (~4 min)

### Opening handoff line

> "Thanks [teammate name]. Now I'll cover the technology stack, the specific fixes I worked on, the cluster-level configuration, and the operational cheat sheet."

---

### Section 6 — Technology Stack (45 sec)

> "The backend runs on **FastAPI** with `asyncpg` for non-blocking PostgreSQL connections and `aiomqtt` for the async MQTT client — both essential for handling multiple simultaneous connections on low-RAM Pi 3 workers.
>
> The container is a hardened multi-stage Dockerfile that runs as a non-root user. Infrastructure is fully declared as code: the backend, MinIO, PostgreSQL, and Mosquitto broker each have their own Kubernetes manifest, so the entire stack can be torn down and redeployed with a single `kubectl apply`."

---

### Section 7 — Core Fixes: Focus on Fix #5 (1.5 min)

> "Several bugs had to be solved before the system was stable. I'll focus on the one I fixed directly — **Fix number 5: multi-replica message duplication**.
>
> The problem: we run 9 backend pods in parallel. When the Pi camera publishes a detection event to MQTT, all 9 pods receive it and try to write it to PostgreSQL simultaneously — giving us 9 duplicate rows in the database and 9 duplicate Telegram alerts for every single detection.
>
> My fix was implementing **MQTT v5 Shared Subscriptions**. By prefixing the topic with `$share/api-group/`, the MQTT broker itself — Mosquitto — round-robins incoming messages across the subscriber group, delivering each message to exactly one replica. The other 8 pods never see it.
>
> Camera stream frames are subscribed to *without* the shared prefix, so all 9 pods still receive every video frame — which is what we want, because any pod might be serving the WebSocket connection for the user's browser."

> [If asked about the other fixes] "The other fixes — unauthenticated image downloads and WebSocket CORS — are both about making the browser dashboard work correctly. I can walk through those if useful."

---

### Section 8 — K3s Cluster Configuration (1 min)

> "Running Kubernetes on Raspberry Pi hardware requires several non-default configurations. I'll highlight the three that matter most:
>
> **Cgroups**: Raspberry Pi OS disables memory cgroups by default. K3s crashes immediately without them. The fix is a one-line kernel parameter in `/boot/firmware/cmdline.txt`.
>
> **Native snapshotter**: Because worker nodes mount their root filesystem over NFS, K3s can't use the standard overlay filesystem for containers. It falls back to a file-by-file copy — which takes 3 to 4 minutes for our 820 MB Python image over a 100 Mbps switch. The default 2-minute Kubelet timeout would kill the pull halfway through. We extended it to 15 minutes in the agent service file.
>
> **Image baking**: After a power cut, all cached container images are wiped from the workers' volatile RAM disk. Rather than re-downloading, we pre-bake critical images as `.tar` files in `/opt/images/` on the NFS rootfs and symlink them into the containerd cache on every boot — reducing cold-start image load from 59 seconds to 2.78 seconds."

---

### Section 9 — Troubleshooting Cheat Sheet (30 sec)

> "Finally, the cheat sheet. Three commands every operator needs to know:
>
> One: run the recovery script manually if nodes have drifted clocks or came up out of order.
>
> Two: if the API hangs on startup, check for PostgreSQL lock-holding PIDs with `pg_stat_activity` and terminate the blocking connection.
>
> Three: if you need to reapply manifests, manually scale the API to 1 replica first, wait for Alembic to finish, then scale back to 9. This is exactly what the boot recovery script does automatically — but it's useful to know the manual steps."

---

## PART B — Task 8: Frontend Dashboard (~4 min)

### Transition line

> "That covers the backend operations. Now Task 8 — the browser dashboard that makes all of this data visible to a security operator."

---

### What I built vs. what the team built (be upfront, 30 sec)

> "Quick context on how this task was split: I built the **functional data layer** of the dashboard — the authentication, the live camera stream, and the detection event system. My colleague Javier built the **visual design layer** — the landing page, the colour system, and the overall layout polish. What I'll show you is the working data integration."

---

### The integration problem I solved (1 min)

> "The core challenge was bridging the backend to the browser in real time. There are two data streams to handle simultaneously:
>
> **Stream 1 — Camera frames**: MQTT base64 JPEGs arriving at up to 10 frames per second. These can't go through REST — too slow and too much overhead. I wired a **WebSocket endpoint** in the backend that relays incoming MQTT frames directly to any connected browser.
>
> **Stream 2 — Detection events**: Structured JSON objects written to PostgreSQL when a threat is detected. These are served via a REST endpoint polled every 10 seconds, and each event links to its stored JPEG in MinIO.
>
> The frontend I built handles both streams at the same time."

---

### Live Demo Walkthrough (1.5 min)

> "[Open http://192.168.1.50 in the browser]
>
> The login page authenticates against the backend user table. After login, the JWT is stored in localStorage and attached as a Bearer token to every API call.
>
> [Log in and point to the Overview page]
>
> On the left: the **Camera Feed**. This is a live WebSocket connection to the backend. You can see the latency, frames per second, and total frame count updating in real time. Those numbers come from comparing the frame timestamp sent by the Pi camera to the current time in the browser.
>
> On the right: **Live Detections** — the 8 most recent events from the backend, refreshing every 10 seconds.
>
> [Click a detection card] Expand a card to see the raw YOLO detection JSON, the metadata, and the annotated image pulled from MinIO.
>
> [Navigate to Search] The Search section lets an operator filter the full database by event type, severity, sensor node, and time range. Results are paginated.
>
> [Navigate to Settings] The Settings page lets you change the API URL at runtime — so the same Docker image works whether you're pointing at the Pi5 standalone or the cluster ingress."

---

### Deployment (30 sec)

> "The frontend is packaged as a two-stage Docker image — Node builds the Vite bundle, Nginx serves it. The Nginx config reverse-proxies `/api/*` to the backend, which eliminates all CORS issues.
>
> I wrote the Kubernetes manifest — a single-replica Deployment and a ClusterIP Service, routed by Traefik Ingress at `http://192.168.1.50`."

---

## Q&A — Honest Answers

**Q: Did you build the whole backend architecture?**
> "No — the DDD architecture with the repository pattern and service layer was designed and built by Abdul Hanan. My backend contributions were the MQTT live ingestion integration, the detection service extension to save camera frames, and the API filter by event type."

**Q: What about the Telegram bot?**
> "I built an initial Telegram notification implementation early in the project. The version that's running now is a replacement written by another teammate. My prototype validated the concept — the final implementation replaced it."

**Q: You said the frontend design was done by your colleague — what exactly did you build?**
> "I built App.tsx — the entire data layer: JWT auth, WebSocket camera stream, detection polling, search and filter, image loading from MinIO, and the settings page. That's 1,117 lines. The landing page, the colour system, and the overall visual design system were built by Javier separately."

**Q: Why a single App.tsx file and not a proper component structure?**
> "It was a pragmatic decision to get it running quickly and deployable. The data integration was the priority — once the streams were working, the design could be iterated on. That's exactly what happened: Javier took my working dashboard and redesigned it properly."

**Q: How does the WebSocket reconnect if a backend pod restarts?**
> "The `onclose` handler schedules a 5-second `setTimeout` before calling `connectSocket()` again. Traefik picks up the new connection on whatever healthy pod is available. The user sees the status badge flip to 'Connecting' for a few seconds, then back to 'Live'."

## Slide 5 — Telegram Bot (45 sec)

> "Whenever a threat detection arrives with severity `high` or `critical`, the backend dispatches a Telegram notification to our team's group chat. The message includes the sensor location, confidence score, event type, and a direct link to view the annotated image.
>
> I built this in `notifications.py` using the Telegram Bot API over HTTPS. The bot token and chat ID are injected as Kubernetes Secrets at runtime, so they never appear in the container image or version control."

---

## Slide 6 — Frontend Dashboard: Live Camera Feed (2 min)

> "Now let me walk through the dashboard. When you log in with your credentials — which the backend validates against the PostgreSQL users table and returns a JWT — you land on the Overview page.
>
> On the left you see the **Camera Feed panel**. This connects a WebSocket to the backend's `/stream/ws` endpoint, authenticated using the JWT token as a query parameter. The backend relays the MJPEG frames it's receiving from the MQTT broker. So the data path is: Raspberry Pi camera → YOLO → MQTT → FastAPI → WebSocket → your browser.
>
> The status badge tells you if the connection is live, connecting, or offline. Below the video frame you can see real-time telemetry: **latency in milliseconds** — the difference between the frame timestamp and the current time in the browser — **frames per second**, computed as a rolling average over the last 10 frames, and the **total frame count**.
>
> If the WebSocket drops — say, because a backend pod gets rescheduled — the dashboard automatically reconnects after 5 seconds."

---

## Slide 7 — Frontend Dashboard: Live Detections (1.5 min)

> "On the right side is the **Live Detections panel**. This polls the `/detections/recent` endpoint every 10 seconds. You can toggle auto-refresh on or off.
>
> Each detection card shows the event type, severity badge color-coded from green for low to red for critical, the confidence score as a percentage, and the detection timestamp.
>
> Click a card to expand it. You see the raw detection JSON from the YOLO model, the metadata object, the **saved preview image** retrieved directly from MinIO, and any additional stored images that were catalogued with that event.
>
> Importantly, the image URL hits an **unauthenticated endpoint**. I made that decision deliberately so that a standard HTML `<img>` tag can load the photo without injecting custom headers, which browsers do not allow on plain image elements."

---

## Slide 8 — Frontend Dashboard: Search & Filter (1 min)

> "The Search Events section gives operators full control over the historical database. You can filter by event type — for example, 'person' or 'vehicle' — by severity level, by a specific sensor node ID, by whether the event has been acknowledged, and by a time window.
>
> Results are paginated using the backend's standard `PaginatedResponse` schema, with configurable skip and limit. The same expandable card format is used here, so you can drill into the raw data, metadata, and stored images directly from the search results."

---

## Slide 9 — Deployment & DevOps (1 min)

> "For deployment, the frontend is packaged as a two-stage Docker image. The first stage uses Node 20 Alpine to run `vite build` and produce the compiled static assets. The second stage copies the `dist` folder into an Nginx 1.25 Alpine image.
>
> The Nginx config reverse-proxies all `/api/*` requests to the backend Kubernetes service. This means the browser always talks to port 80 on the frontend pod, and Nginx handles the routing — which eliminates CORS issues entirely because the browser sees everything coming from the same origin.
>
> In Kubernetes, the frontend is a single-replica Deployment exposed through the Traefik Ingress at `http://192.168.1.50`. Since it's stateless — no session data, all state is in the backend — one replica is sufficient and restarts are instant."

---

## Slide 10 — Challenges I Solved (1 min)

> "A few challenges worth highlighting:
>
> **CORS on WebSocket**: The live camera stream uses a WebSocket connection. WebSocket handshakes are subject to CORS. I resolved this by configuring the `BACKEND_CORS_ORIGINS` environment variable in the backend K8s manifest to explicitly whitelist the frontend ingress URL.
>
> **Image rendering without auth headers**: Browsers cannot attach custom headers to `<img src>` requests. Since the MinIO images need to be rendered directly in the detection cards, I exposed a dedicated download endpoint that validates access at the server routing level rather than requiring a header.
>
> **Runtime API URL switching**: The same Docker image is used for both the Pi5 standalone deployment and the full cluster deployment. By storing the API base URL in `localStorage` and exposing a Settings page, operators can redirect the dashboard to either endpoint without rebuilding the container."

---

## Slide 11 — Live Demo Walkthrough (1–2 min)

> "Let me show you the running system.  
>
> [Open browser at http://192.168.1.50]  
>
> This is the login page. I'll authenticate with my operator credentials.  
>
> [Log in]  
>
> You can see the camera feed is live — the status badge shows 'Live' and the FPS counter is ticking.  
>
> [Point to telemetry bar] The current latency is around [X]ms — that's the round-trip from the camera on the Pi to the MQTT broker, across the backend, through the WebSocket, and rendered here.  
>
> [Expand a detection card] Here's a recent person detection with 87% confidence. You can see the annotated image saved to MinIO, the raw detection bounding box coordinates in JSON, and the sensor node ID.  
>
> [Navigate to Search] If I switch to Search Events and filter by severity 'critical', I get the historical critical events — each one with the full image stored on the Pi5 SSD."

---

## Slide 12 — Summary & Takeaways (30 sec)

> "To summarize my contribution: I designed and implemented the complete data pipeline from the MQTT threat event arriving at the backend, through storage in PostgreSQL and MinIO, all the way to the real-time browser dashboard.
>
> The system handles **live video streaming**, **JWT-authenticated REST access**, **Telegram alerting**, and **persistent image storage** — running distributed across 9 Raspberry Pi nodes on a bare-metal Kubernetes cluster.
>
> Thank you. Happy to take questions."

---

## Q&A Preparation

**Q: Why React and not Vue or plain HTML?**
> "The team had existing React expertise, and the component model maps naturally to the card-based detection event UI. TypeScript gives us type safety on the API response shapes, catching mismatches between the Pydantic schemas and the frontend types at development time."

**Q: Why a single `App.tsx` rather than splitting into components?**
> "On a resource-constrained ARM cluster, minimizing build tooling complexity matters. A single-file SPA has no dynamic import overhead and trivially hot-reloads during development. The file is 1,117 lines — large but well-structured with clear section comments."

**Q: How does the WebSocket reconnect after a pod restart?**
> "The `useEffect` hook that opens the WebSocket returns a cleanup function that closes it on unmount. The `onclose` handler schedules a `setTimeout` for 5 seconds before calling `connectSocket()` again. Because Traefik load-balances WebSocket connections at the HTTP upgrade handshake, the reconnect lands on whatever replica is healthy."

**Q: How are secrets managed (Telegram token, MinIO credentials)?**
> "All credentials are injected as Kubernetes Secrets mounted as environment variables. The container image itself contains no credentials. The `.env.example` file in the repository documents the required variable names."

**Q: What happens if MinIO goes down?**
> "Detection events are still written to PostgreSQL without the image. The backend catches the MinIO upload exception, logs the error, and returns a successful HTTP response to the MQTT handler so the event is not lost. The frontend simply renders the detection card without the image thumbnail."
