import { useEffect, useMemo, useState, type Dispatch, type SetStateAction } from 'react'
import './App.css'

type DetectionEvent = {
  id: string
  sensor_node_id: string
  event_type: string
  severity: 'low' | 'medium' | 'high' | 'critical' | string
  confidence: number
  raw_detections: Record<string, unknown> | null
  metadata: Record<string, unknown> | null
  acknowledged: boolean
  acknowledged_by: string | null
  detected_at: string
  received_at: string
  created_at: string
}

type DetectionImage = {
  id: string
  detection_event_id: string
  storage_key: string
  bucket: string
  content_type: string
  file_size_bytes: number | null
  image_type: string
  captured_at: string
  uploaded_at: string
}

type DetectionDetail = DetectionEvent & {
  sensor_name?: string | null
  sensor_location?: string | null
  images: DetectionImage[]
}

type PaginatedResponse<T> = {
  items: T[]
  total: number
  skip: number
  limit: number
}

type QueryState = {
  eventType: string
  severity: string
  sensorId: string
  acknowledged: string
  startTime: string
  endTime: string
  skip: string
  limit: string
}

type SavedSettings = {
  apiBaseUrl: string
  token: string
}

type CardState = DetectionDetail & {
  detailLoaded: boolean
  imageUrls: Record<string, string>
}

const storageKey = 'tds-detection-dashboard'
const defaultApiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

const severityOrder = ['critical', 'high', 'medium', 'low']

function loadSavedSettings(): SavedSettings {
  try {
    const raw = localStorage.getItem(storageKey)
    if (!raw) {
      return { apiBaseUrl: defaultApiBaseUrl, token: '' }
    }

    const parsed = JSON.parse(raw) as Partial<SavedSettings>
    return {
      apiBaseUrl: parsed.apiBaseUrl?.trim() || defaultApiBaseUrl,
      token: parsed.token?.trim() || '',
    }
  } catch {
    return { apiBaseUrl: defaultApiBaseUrl, token: '' }
  }
}

function formatDateTime(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}

function severityClass(severity: string) {
  return `severity severity-${severity.toLowerCase()}`
}

function buildQueryString(query: QueryState) {
  const params = new URLSearchParams()

  if (query.eventType.trim()) params.set('event_type', query.eventType.trim())
  if (query.severity.trim()) params.set('severity', query.severity.trim())
  if (query.sensorId.trim()) params.set('sensor_id', query.sensorId.trim())
  if (query.acknowledged !== '') params.set('acknowledged', query.acknowledged)
  if (query.startTime.trim()) params.set('start_time', query.startTime.trim())
  if (query.endTime.trim()) params.set('end_time', query.endTime.trim())
  params.set('skip', query.skip || '0')
  params.set('limit', query.limit || '50')

  return params.toString()
}

function App() {
  const [settings, setSettings] = useState(loadSavedSettings)
  const [draftSettings, setDraftSettings] = useState(loadSavedSettings)
  const [liveEvents, setLiveEvents] = useState<CardState[]>([])
  const [filteredEvents, setFilteredEvents] = useState<CardState[]>([])
  const [filterTotals, setFilterTotals] = useState({ total: 0, skip: 0, limit: 50 })
  const [query, setQuery] = useState<QueryState>({
    eventType: '',
    severity: '',
    sensorId: '',
    acknowledged: '',
    startTime: '',
    endTime: '',
    skip: '0',
    limit: '50',
  })
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [liveLoading, setLiveLoading] = useState(false)
  const [searchLoading, setSearchLoading] = useState(false)
  const [liveError, setLiveError] = useState<string | null>(null)
  const [searchError, setSearchError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const liveSummary = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const event of liveEvents) {
      const key = event.event_type || 'unknown'
      counts[key] = (counts[key] || 0) + 1
    }
    return Object.entries(counts)
      .sort((left, right) => right[1] - left[1])
      .slice(0, 4)
  }, [liveEvents])

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(settings))
  }, [settings])

  useEffect(() => {
    setDraftSettings(settings)
  }, [settings])

  async function apiFetch(path: string, options?: RequestInit) {
    const headers = new Headers(options?.headers)
    headers.set('accept', 'application/json')
    if (settings.token.trim()) {
      headers.set('Authorization', `Bearer ${settings.token.trim()}`)
    }

    const response = await fetch(`${settings.apiBaseUrl.replace(/\/$/, '')}${path}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const message = await response.text().catch(() => response.statusText)
      throw new Error(`${response.status} ${message}`)
    }

    return response.json()
  }

  async function fetchRecentEvents() {
    setLiveLoading(true)
    setLiveError(null)
    try {
      const data = await apiFetch('/detections/recent?limit=8') as DetectionEvent[]
      setLiveEvents(data.map((item) => ({
        ...item,
        detailLoaded: false,
        imageUrls: {},
      })))
      setLastUpdated(new Date().toLocaleTimeString())
    } catch (error) {
      setLiveError(error instanceof Error ? error.message : 'Failed to load live detections')
    } finally {
      setLiveLoading(false)
    }
  }

  async function fetchFilteredEvents() {
    setSearchLoading(true)
    setSearchError(null)
    try {
      const data = await apiFetch(`/detections?${buildQueryString(query)}`) as PaginatedResponse<DetectionEvent>
      setFilteredEvents(data.items.map((item) => ({
        ...item,
        detailLoaded: false,
        imageUrls: {},
      })))
      setFilterTotals({ total: data.total, skip: data.skip, limit: data.limit })
      setLastUpdated(new Date().toLocaleTimeString())
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'Failed to load detections')
    } finally {
      setSearchLoading(false)
    }
  }

  async function loadDetectionDetail(eventId: string, listName: 'live' | 'search') {
    const setList: Dispatch<SetStateAction<CardState[]>> = listName === 'live' ? setLiveEvents : setFilteredEvents
    const currentList: CardState[] = listName === 'live' ? liveEvents : filteredEvents
    const target = currentList.find((item: CardState) => item.id === eventId)
    if (!target || target.detailLoaded) {
      return
    }

    try {
      const detail = await apiFetch(`/detections/${eventId}`) as DetectionDetail
      const imageUrls: Record<string, string> = {}

      for (const image of detail.images || []) {
        try {
          const urlResponse = await apiFetch(`/images/${image.id}/url`) as { url: string }
          imageUrls[image.id] = urlResponse.url
        } catch {
          imageUrls[image.id] = `${settings.apiBaseUrl.replace(/\/api\/v1$/, '')}/api/v1/images/${image.id}/download`
        }
      }

      setList((prev: CardState[]) => prev.map((item: CardState) => (
        item.id === eventId
          ? { ...item, ...detail, detailLoaded: true, imageUrls }
          : item
      )))
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load event detail'
      if (listName === 'live') {
        setLiveError(message)
      } else {
        setSearchError(message)
      }
    }
  }

  useEffect(() => {
    void fetchRecentEvents()
  }, [settings.apiBaseUrl, settings.token])

  useEffect(() => {
    void fetchFilteredEvents()
  }, [settings.apiBaseUrl, settings.token])

  useEffect(() => {
    if (!autoRefresh) {
      return
    }

    const timer = window.setInterval(() => {
      void fetchRecentEvents()
    }, 5000)

    return () => window.clearInterval(timer)
  }, [autoRefresh, settings.apiBaseUrl, settings.token])

  function saveConnectionSettings() {
    setSettings({
      apiBaseUrl: draftSettings.apiBaseUrl.trim() || defaultApiBaseUrl,
      token: draftSettings.token.trim(),
    })
  }

  function resetFilters() {
    const cleared = {
      eventType: '',
      severity: '',
      sensorId: '',
      acknowledged: '',
      startTime: '',
      endTime: '',
      skip: '0',
      limit: '50',
    }
    setQuery(cleared)
    setFilteredEvents([])
    setFilterTotals({ total: 0, skip: 0, limit: 50 })
  }

  return (
    <div className="dashboard-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Threat Detection System</p>
          <h1>Live detections, history filters, and image drill-down</h1>
          <p className="hero-copy">
            Poll the backend for the latest detections, search previous records with filters,
            and open stored MinIO images from each event.
          </p>
        </div>

        <div className="hero-stats">
          <div className="stat-card">
            <span className="stat-label">Live feed</span>
            <strong>{liveEvents.length}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Filtered total</span>
            <strong>{filterTotals.total}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Last update</span>
            <strong>{lastUpdated || '--:--:--'}</strong>
          </div>
        </div>
      </header>

      <section className="settings-panel">
        <div className="section-head">
          <div>
            <h2>Connection</h2>
            <p>Use the API base URL and bearer token for Swagger-authenticated requests.</p>
          </div>
          <button className="secondary" onClick={() => void fetchRecentEvents()}>
            Refresh now
          </button>
        </div>

        <div className="settings-grid">
          <label>
            <span>API base URL</span>
            <input
              value={draftSettings.apiBaseUrl}
              onChange={(event) => setDraftSettings((current) => ({ ...current, apiBaseUrl: event.target.value }))}
              placeholder={defaultApiBaseUrl}
            />
          </label>
          <label>
            <span>Bearer token</span>
            <input
              value={draftSettings.token}
              onChange={(event) => setDraftSettings((current) => ({ ...current, token: event.target.value }))}
              placeholder="Paste the JWT from Swagger"
            />
          </label>
          <div className="actions-row">
            <button onClick={saveConnectionSettings}>Save connection</button>
            <button className="secondary" onClick={() => setAutoRefresh((value) => !value)}>
              {autoRefresh ? 'Pause live refresh' : 'Resume live refresh'}
            </button>
          </div>
        </div>
      </section>

      <main className="content-grid">
        <section className="panel panel-live">
          <div className="section-head">
            <div>
              <h2>Live detections</h2>
              <p>Polling /detections/recent every 5 seconds.</p>
            </div>
            <span className={`status-pill ${autoRefresh ? 'status-on' : 'status-off'}`}>
              {autoRefresh ? 'Auto refresh on' : 'Auto refresh off'}
            </span>
          </div>

          {liveError ? <div className="notice error">{liveError}</div> : null}
          {liveLoading ? <div className="notice">Loading latest detections...</div> : null}

          <div className="mini-summary">
            {liveSummary.length > 0 ? liveSummary.map(([label, count]) => (
              <span key={label} className="chip">{label}: {count}</span>
            )) : <span className="chip muted">No detections yet</span>}
          </div>

          <div className="detection-list">
            {liveEvents.map((event) => (
              <DetectionCard
                key={event.id}
                event={event}
                listName="live"
                onToggle={() => void loadDetectionDetail(event.id, 'live')}
              />
            ))}
          </div>
        </section>

        <section className="panel panel-search">
          <div className="section-head">
            <div>
              <h2>Previous detections</h2>
              <p>Filter the historical list by event type, severity, sensor, time, and status.</p>
            </div>
            <button className="secondary" onClick={resetFilters}>Clear filters</button>
          </div>

          <div className="filter-grid">
            <label>
              <span>Event type</span>
              <input value={query.eventType} onChange={(event) => setQuery((current) => ({ ...current, eventType: event.target.value }))} placeholder="person" />
            </label>
            <label>
              <span>Severity</span>
              <select value={query.severity} onChange={(event) => setQuery((current) => ({ ...current, severity: event.target.value }))}>
                <option value="">Any</option>
                {severityOrder.map((item) => <option key={item} value={item}>{item}</option>)}
              </select>
            </label>
            <label>
              <span>Sensor ID</span>
              <input value={query.sensorId} onChange={(event) => setQuery((current) => ({ ...current, sensorId: event.target.value }))} placeholder="UUID" />
            </label>
            <label>
              <span>Acknowledged</span>
              <select value={query.acknowledged} onChange={(event) => setQuery((current) => ({ ...current, acknowledged: event.target.value }))}>
                <option value="">Any</option>
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
            </label>
            <label>
              <span>Start time</span>
              <input type="datetime-local" value={query.startTime} onChange={(event) => setQuery((current) => ({ ...current, startTime: event.target.value }))} />
            </label>
            <label>
              <span>End time</span>
              <input type="datetime-local" value={query.endTime} onChange={(event) => setQuery((current) => ({ ...current, endTime: event.target.value }))} />
            </label>
            <label>
              <span>Skip</span>
              <input type="number" min="0" value={query.skip} onChange={(event) => setQuery((current) => ({ ...current, skip: event.target.value }))} />
            </label>
            <label>
              <span>Limit</span>
              <input type="number" min="1" max="200" value={query.limit} onChange={(event) => setQuery((current) => ({ ...current, limit: event.target.value }))} />
            </label>
          </div>

          <div className="actions-row">
            <button onClick={() => void fetchFilteredEvents()}>{searchLoading ? 'Searching...' : 'Search detections'}</button>
            <button className="secondary" onClick={() => void fetchFilteredEvents()}>Run same filter again</button>
          </div>

          {searchError ? <div className="notice error">{searchError}</div> : null}

          <div className="result-meta">
            <span>{filterTotals.total} result(s)</span>
            <span>Showing {filteredEvents.length} item(s)</span>
          </div>

          <div className="detection-list compact">
            {filteredEvents.map((event) => (
              <DetectionCard
                key={event.id}
                event={event}
                listName="search"
                onToggle={() => void loadDetectionDetail(event.id, 'search')}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

function DetectionCard({
  event,
  listName,
  onToggle,
}: {
  event: CardState
  listName: 'live' | 'search'
  onToggle: () => void
}) {
  const [expanded, setExpanded] = useState(false)

  function toggle() {
    setExpanded((value) => !value)
    if (!expanded) {
      onToggle()
    }
  }

  return (
    <article className="detection-card">
      <button className="card-header" onClick={toggle}>
        <div>
          <div className="card-title-row">
            <strong>{event.event_type}</strong>
            <span className={severityClass(event.severity)}>{event.severity}</span>
            {event.acknowledged ? <span className="chip muted">acknowledged</span> : <span className="chip alert">new</span>}
          </div>
          <p>
            {listName === 'live' ? 'Live feed' : 'Search result'} · {formatDateTime(event.detected_at)}
          </p>
        </div>
        <div className="card-metrics">
          <span>{Math.round(event.confidence * 100)}%</span>
          <span>{event.sensor_node_id.slice(0, 8)}</span>
        </div>
      </button>

      {expanded ? (
        <div className="card-body">
          <dl className="detail-grid">
            <div><dt>Detected</dt><dd>{formatDateTime(event.detected_at)}</dd></div>
            <div><dt>Received</dt><dd>{formatDateTime(event.received_at)}</dd></div>
            <div><dt>Created</dt><dd>{formatDateTime(event.created_at)}</dd></div>
            <div><dt>Sensor</dt><dd>{event.sensor_node_id}</dd></div>
          </dl>

          <div className="raw-block">
            <h3>Raw detections</h3>
            <pre>{JSON.stringify(event.raw_detections || {}, null, 2)}</pre>
          </div>

          <div className="raw-block">
            <h3>Metadata</h3>
            <pre>{JSON.stringify(event.metadata || {}, null, 2)}</pre>
          </div>

          {event.images && event.images.length > 0 ? (
            <div className="image-grid">
              {event.images.map((image) => (
                <figure key={image.id} className="image-card">
                  <img src={event.imageUrls?.[image.id]} alt={image.image_type} />
                  <figcaption>
                    <strong>{image.image_type}</strong>
                    <span>{image.storage_key}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          ) : (
            <p className="muted-text">No stored image loaded yet.</p>
          )}
        </div>
      ) : null}
    </article>
  )
}

export default App
