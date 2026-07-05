# Changelog — v1 → v3 (Backend & Frontend Upgrades)

This document records all changes made to the Threat Detection System codebase between the **initial v1 baseline** and the **current v3 state**.  Changes are grouped by component.

---

## 1. Backend — `backend/app/`

### 1.1 Configuration (`config.py`)

| Change | v1 | v3 |
|---|---|---|
| Camera MQTT topic | *(not defined)* | `MQTT_TOPIC_CAMERA = "cluster/camera/#"` |
| DB connect timeout | *(not defined, caused `AttributeError` on startup)* | `DATABASE_CONNECT_TIMEOUT_SECONDS = 30` |
| DB command timeout | *(not defined)* | `DATABASE_COMMAND_TIMEOUT_SECONDS = 30` |

### 1.2 Application Startup (`main.py`)

**Added auto-migration** — Alembic `upgrade head` now runs automatically at startup before any service initialises.  
This fixes the `relation "sensor_nodes" does not exist` error on a fresh database.

```python
# v3 lifespan — runs before MinIO / MQTT setup
from alembic.config import Config as AlembicConfig
from alembic import command as alembic_command
alembic_cfg = AlembicConfig("alembic.ini")
alembic_command.upgrade(alembic_cfg, "head")
```

### 1.3 Detection Service (`services/detection_service.py`)

| Issue | v1 | v3 |
|---|---|---|
| `metadata` column not saved | `"metadata": data.metadata` silently wrote to SQLAlchemy's `MetaData` class object | Fixed to `"metadata_": data.metadata` (correct Python attribute name) |
| No logger | `detection_service` had no `logging` import | Added `import logging` + `logger = logging.getLogger(__name__)` |
| Image errors invisible | `except Exception: pass` swallowed all MinIO errors | Changed to `logger.warning("Image upload skipped for event %s: %s", ...)` |
| Presigned URLs inaccessible from browser | Returned `http://minio:9000/...` (K8s internal DNS, unreachable) | Returns `/api/v1/images/{id}/download` — routes through FastAPI Ingress, works everywhere |

### 1.4 Detection Schema (`schemas/detection_event.py`)

| Change | v1 | v3 |
|---|---|---|
| `event_type` field type | `str = Field(..., max_length=50)` — no validation, anything accepted | `EventType` enum — Swagger shows dropdown: `person / theft / fire / vandalism / weapon / unknown` |
| `metadata` response field | `Field(None, alias="metadata_")` — read SQLAlchemy `MetaData` class object instead of column value | `Field(None, validation_alias=AliasChoices("metadata_", "metadata"))` — reads `metadata_` column correctly |

### 1.5 Detections Router (`api/v1/detections.py`)

| Change | v1 | v3 |
|---|---|---|
| `event_type` query param | `str \| None` — free text, no hint in Swagger | `EventType \| None` — Swagger shows dropdown for filtering |

### 1.6 Detection Event Repository (`repositories/detection_event_repo.py`)

| Method | v1 sort key | v3 sort key | Reason |
|---|---|---|---|
| `get_recent` | `detected_at DESC` | `received_at DESC` | `detected_at` is the edge node's clock (can be wrong); `received_at` is always the server's UTC time |
| `get_filtered` | `detected_at DESC` | `received_at DESC` | Same |

### 1.7 MQTT Service (`services/mqtt_service.py`)

**`_handle_camera_event` — all Pi4 payload fields now used:**

| Field | v1 (hardcoded) | v3 (from payload) |
|---|---|---|
| `severity` | always `"medium"` | `payload.get("severity")` — e.g. `"high"` for weapon, `"critical"` for fire |
| `confidence` | always `1.0` | `payload.get("confidence")` — actual YOLO score e.g. `0.87` |
| `raw_detections` | `{"objects": N, "label": "person"}` | Full YOLO output wrapped: `{"detections": [...], "count": N}` |
| `metadata` | `{"mqtt_topic":..., "source":...}` only | **Merged** Pi4 edge data (`camera_backend`, `frame_width`, `frame_height`, `yolo_class`) + backend tracking fields |

**`_handle_detection` (sensor topics) — input normalisation added:**
```python
# v3 — prevents Pydantic ValidationError from unknown YOLO class names
raw_type = payload.get("event_type", "unknown")
event_type = raw_type if raw_type in _valid_types else "unknown"

raw_severity = payload.get("severity", "medium")
severity = raw_severity if raw_severity in _valid_severities else "medium"
```

**`_LABEL_MAP` expanded** with YOLO COCO class → EventType mappings:
```
"knife"        → "weapon"
"scissors"     → "weapon"
"baseball bat" → "weapon"
"gun"          → "weapon"
"pistol"       → "weapon"
"rifle"        → "weapon"
"smoke"        → "fire"
```

**Duplicate MQTT subscription removed:**  
`cluster/camera/stream` was subscribed twice (once explicitly + once via `cluster/camera/#`).  Explicit subscription removed.

**`EventType` added to imports** — used for normalising event types in both MQTT handlers.

---

## 2. Frontend — `frontend/src/`

### 2.1 Authentication (`App.tsx`)

**Added full login gate** — the dashboard is replaced by a login screen when no JWT is stored.

| Feature | Detail |
|---|---|
| Login screen | Username + password → `POST /api/v1/auth/login` → JWT stored in `localStorage` |
| Register tab | Username, email, password, role (viewer / operator / admin) |
| Auto token injection | On login the token is saved and injected into every API call automatically |
| Sign out button | Top-right of header — clears JWT and returns to login screen |
| Persistent session | Survives page refresh via `localStorage` |

### 2.2 Image URL Resolution (`App.tsx`)

**Added `buildImageUrl` helper** — converts the relative download path from the API into an absolute URL using `settings.apiBaseUrl`:

```typescript
// Works in K3s:  http://192.168.1.50/api/v1/images/{id}/download
// Works locally: http://localhost:8001/api/v1/images/{id}/download
function buildImageUrl(previewUrl, apiBaseUrl) { ... }
```

**Image loading simplified** — the frontend no longer calls `/images/{id}/url` (which returned an inaccessible MinIO presigned URL).  All image loads now use `/api/v1/images/{id}/download` directly.

### 2.3 Other Fixes (`App.tsx`)

| Change | v1 | v3 |
|---|---|---|
| Manual Bearer token field | Shown in Settings panel, user had to paste JWT manually | Removed — token is managed automatically by the login flow |
| `saveConnectionSettings` | Overwrote the auth token when saving API URL | Fixed to preserve the token |
| Swagger link | Not present | Added "Open Swagger API" button in the hero header |
| Detection list event URL | Fetched `/images/{id}/url` → unusable MinIO URL | Always uses download endpoint; `buildImageUrl` converts relative → absolute |

---

## 3. Edge Node — `edge_node/edge_camera_publisher.py`

| Setting | v1 | v3 |
|---|---|---|
| Frame resolution | `320 × 240` | **`640 × 480`** (4× pixel count) |
| JPEG quality | `70%` | **`85%`** |
| `rpicam-still` warmup | `-t 1000` (1 s per frame → ~1 real FPS) | **`-t 200`** (200 ms → ~4–5 real FPS) |

**Added YOLO → EventType mapping at the edge** (so the database never receives raw COCO class names):

```python
_YOLO_TO_EVENT_TYPE = {
    "person": "person",
    "knife": "weapon",   "scissors": "weapon",   "baseball bat": "weapon",
    "gun":   "weapon",   "pistol":   "weapon",   "rifle":        "weapon",
    "fire":  "fire",     "smoke":    "fire",
    # everything else → "unknown"
}
_EVENT_TYPE_SEVERITY = {
    "person": "low", "weapon": "high", "fire": "critical",
    "theft": "high", "vandalism": "medium", "unknown": "medium",
}
```

**Detection event payload now includes:**
- `event_type` — mapped EventType value (not raw YOLO class)
- `label` — same mapped value
- `severity` — from `_EVENT_TYPE_SEVERITY` lookup
- `confidence` — YOLO's actual score
- `raw_detections` — full list of all detected objects with bboxes
- `image_base64` — annotated frame JPEG
- `metadata.yolo_class` — original YOLO class (for debugging)

---

## 4. Kubernetes Manifests — `k8s/`

| File | Change | Reason |
|---|---|---|
| `backend.yaml` | Added `MQTT_TOPIC_CAMERA: "cluster/camera/#"` env var | Config was missing; backend couldn't subscribe to camera events |
| `frontend.yaml` | `imagePullPolicy: Never` → `IfNotPresent` | `Never` caused `CreateContainerError` when the image wasn't pre-loaded into every worker |

---

## 5. Camera Stream HTML — `camera_stream.html`

| Change | v1 | v3 |
|---|---|---|
| Broker IP | `10.42.0.43` (K8s pod IP — changes every restart) | `192.168.1.50` (stable Pi5 master IP) |
| Image fit | `object-fit: contain` (black bars around image) | `object-fit: cover` (fills the frame edge-to-edge) |

---

## 6. Environment / `.env.example`

Variables added that were missing and caused startup errors:

```env
# Was missing — caused AttributeError in database.py
DATABASE_CONNECT_TIMEOUT_SECONDS=30
DATABASE_COMMAND_TIMEOUT_SECONDS=30

# Was missing — backend couldn't subscribe to Pi4 camera topic
MQTT_TOPIC_CAMERA=cluster/camera/#

# Was empty — JWT auth failed silently on local dev
JWT_SECRET_KEY=dev-secret-change-in-production
```

---

## 7. Summary: Root Causes Fixed

| # | Symptom | Root Cause | Fix |
|---|---|---|---|
| 1 | `"sensor_nodes" does not exist` on startup | Alembic migrations never ran automatically | Auto-run `alembic upgrade head` in lifespan |
| 2 | `metadata` always null in API response | Wrong dict key `"metadata"` instead of `"metadata_"` in `event_repo.create()` | Fixed key; added `AliasChoices` in response schema |
| 3 | Images not showing in browser | Presigned URL used K8s-internal `minio:9000` DNS name | Return `/api/v1/images/{id}/download` path; proxy through FastAPI |
| 4 | Only "person" type detections saved | All non-EventType YOLO class names failed Pydantic validation silently | Normalise at edge before publishing; expand `_LABEL_MAP` in backend |
| 5 | Latest events not at top of list | Sorted by `detected_at` (edge node clock, can be wrong) | Sort by `received_at` (server clock, always correct) |
| 6 | Camera preview not loading | HTML had hardcoded pod IP `10.42.0.43` | Changed to stable Pi5 IP `192.168.1.50` |
| 7 | `severity` always `"medium"`, `confidence` always `1.0` | `_handle_camera_event` hardcoded both instead of reading from payload | Read `payload.get("severity")` and `payload.get("confidence")` |
| 8 | Full YOLO detection list lost | `raw_detections` in schema was `dict | None`; YOLO sends a list | Wrap list in `{"detections": [...], "count": N}` before validation |
| 9 | No login protection | No auth gate on the frontend | Added `LoginPage` component with JWT login/register |
| 10 | `AttributeError: settings has no attribute DATABASE_CONNECT_TIMEOUT_SECONDS` | Settings were missing from `config.py` | Added all missing settings with sensible defaults |
