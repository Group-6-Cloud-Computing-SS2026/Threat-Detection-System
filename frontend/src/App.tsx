import { useEffect, useMemo, useState, type FormEvent } from 'react'
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
  preview_image_url: string | null
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
const authStorageKey = 'tds-auth-state'
const defaultApiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? '/api/v1'

type AuthState = { token: string; username: string }

function loadSavedAuth(): AuthState | null {
  try {
    const raw = localStorage.getItem(authStorageKey)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<AuthState>
    if (!parsed.token?.trim()) return null
    return { token: parsed.token.trim(), username: parsed.username?.trim() || 'user' }
  } catch {
    return null
  }
}

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

function buildImageUrl(previewUrl: string | null | undefined, apiBaseUrl: string): string | null {
  if (!previewUrl) return null
  if (previewUrl.startsWith('http://') || previewUrl.startsWith('https://')) return previewUrl
  // Relative path — prepend API origin so the browser can reach it
  const origin = apiBaseUrl.replace(/\/api\/v1\/?$/, '').replace(/\/$/, '')
  return `${origin}${previewUrl}`
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
  const [authState, setAuthState] = useState<AuthState | null>(loadSavedAuth)
  const [streamImageSrc, setStreamImageSrc] = useState<string | null>(null)
  const [streamStatus, setStreamStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected')
  const [latency, setLatency] = useState<number | null>(null)
  const [renderFps, setRenderFps] = useState<number | null>(null)
  const [totalFrames, setTotalFrames] = useState<number>(0)

  function handleLogin(token: string, username: string) {
    const auth: AuthState = { token, username }
    localStorage.setItem(authStorageKey, JSON.stringify(auth))
    setAuthState(auth)
    setSettings((s) => ({ ...s, token }))
  }

  function handleLogout() {
    localStorage.removeItem(authStorageKey)
    setAuthState(null)
    setSettings((s) => ({ ...s, token: '' }))
  }

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
    const token = authState?.token || settings.token.trim()
    if (token) {
      headers.set('Authorization', `Bearer ${token}`)
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
        preview_image_url: buildImageUrl(item.preview_image_url, settings.apiBaseUrl),
        detailLoaded: false,
        imageUrls: {},
        images: [],
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
        preview_image_url: buildImageUrl(item.preview_image_url, settings.apiBaseUrl),
        detailLoaded: false,
        imageUrls: {},
        images: [],
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
    const currentList: CardState[] = listName === 'live' ? liveEvents : filteredEvents
    const target = currentList.find((item: CardState) => item.id === eventId)
    if (!target || target.detailLoaded) {
      return
    }

    try {
      const detail = await apiFetch(`/detections/${eventId}`) as DetectionDetail
      const imageUrls: Record<string, string> = {}
      const apiOrigin = settings.apiBaseUrl.replace(/\/api\/v1\/?$/, '')

      for (const image of detail.images || []) {
        imageUrls[image.id] = `${apiOrigin}/api/v1/images/${image.id}/download`
      }

      const resolvedPreviewUrl = buildImageUrl(detail.preview_image_url, settings.apiBaseUrl)

      if (listName === 'live') {
        setLiveEvents((prev) => prev.map((item) => (
          item.id === eventId
            ? { ...item, ...detail, preview_image_url: resolvedPreviewUrl ?? item.preview_image_url, detailLoaded: true, imageUrls }
            : item
        )))
      } else {
        setFilteredEvents((prev) => prev.map((item) => (
          item.id === eventId
            ? { ...item, ...detail, preview_image_url: resolvedPreviewUrl ?? item.preview_image_url, detailLoaded: true, imageUrls }
            : item
        )))
      }
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
    }, 10000)

    return () => window.clearInterval(timer)
  }, [autoRefresh, settings.apiBaseUrl, settings.token])

  useEffect(() => {
    let socket: WebSocket | null = null
    let isMounted = true
    let frameCount = 0
    let lastFrameTime = performance.now()
    const fpsSamples: number[] = []

    const connectSocket = () => {
      if (!authState?.token) return
      
      setStreamStatus('connecting')
      const apiOrigin = settings.apiBaseUrl.replace(/\/$/, '')
      let wsUrl = ''
      if (apiOrigin.startsWith('http://') || apiOrigin.startsWith('https://')) {
        wsUrl = apiOrigin.replace(/^http/, 'ws') + '/stream/ws'
      } else {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        wsUrl = `${protocol}//${window.location.host}${apiOrigin}/stream/ws`
      }
      wsUrl += `?token=${authState.token}`

      socket = new WebSocket(wsUrl)

      socket.onopen = () => {
        if (!isMounted) return
        setStreamStatus('connected')
      }

      socket.onmessage = (event) => {
        if (!isMounted) return
        try {
          const payload = JSON.parse(event.data)
          const base64Data = payload.image || payload.image_base64
          if (base64Data) {
            setStreamImageSrc(`data:image/jpeg;base64,${base64Data}`)
            
            // Calculate latency
            if (payload.timestamp) {
              const sentTime = new Date(payload.timestamp).getTime()
              const receiveTime = Date.now()
              setLatency(receiveTime - sentTime)
            }

            // Calculate FPS
            const now = performance.now()
            const delta = now - lastFrameTime
            lastFrameTime = now
            const currentFps = Math.round(1000 / delta)
            fpsSamples.push(currentFps)
            if (fpsSamples.length > 10) fpsSamples.shift()
            const avgFps = Math.round(fpsSamples.reduce((a, b) => a + b, 0) / fpsSamples.length)
            setRenderFps(avgFps)

            frameCount++
            setTotalFrames(frameCount)
          }
        } catch (err) {
          console.error("Error parsing websocket frame", err)
        }
      }

      socket.onerror = () => {
        if (!isMounted) return
        setStreamStatus('disconnected')
      }

      socket.onclose = () => {
        if (!isMounted) return
        setStreamStatus('disconnected')
        setStreamImageSrc(null)
        // Auto-reconnect after 5 seconds
        setTimeout(() => {
          if (isMounted) connectSocket()
        }, 5000)
      }
    }

    connectSocket()

    return () => {
      isMounted = false
      if (socket) {
        socket.close()
      }
    }
  }, [authState, settings.apiBaseUrl])

  function saveConnectionSettings() {
    setSettings((current) => ({
      ...current,
      apiBaseUrl: draftSettings.apiBaseUrl.trim() || defaultApiBaseUrl,
    }))
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

  function clearPersonFilter() {
    setQuery((current) => ({
      ...current,
      eventType: '',
    }))
    void fetchFilteredEvents()
  }

  if (!authState) {
    return (
      <LoginPage
        apiBaseUrl={settings.apiBaseUrl}
        onLogin={handleLogin}
      />
    )
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
          <div className="hero-actions">
            <button className="secondary" onClick={clearPersonFilter}>
              Clear person filter
            </button>
            <a className="inline-link" href="/docs" target="_blank" rel="noreferrer">
              Open Swagger API
            </a>
            <button className="secondary logout-btn" onClick={handleLogout}>
              Sign out · {authState.username}
            </button>
          </div>
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
            <p>Signed in as <strong>{authState.username}</strong>. Update the API base URL if needed.</p>
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
          <div className="actions-row">
            <button onClick={saveConnectionSettings}>Save connection</button>
            <button className="secondary" onClick={() => setAutoRefresh((value) => !value)}>
              {autoRefresh ? 'Pause live refresh' : 'Resume live refresh'}
            </button>
          </div>
        </div>
      </section>

      <main className="content-grid">
        <section className="panel panel-preview">
          <div className="section-head">
            <div>
              <h2>Camera preview</h2>
              <p>Live edge telemetry stream via WebSocket.</p>
            </div>
            <span className={`status-pill ${streamStatus === 'connected' ? 'status-on' : streamStatus === 'connecting' ? 'status-pending' : 'status-off'}`}>
              {streamStatus === 'connected' ? 'Live' : streamStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
            </span>
          </div>

          <div className="preview-frame-wrap">
            {streamImageSrc ? (
              <img
                className="preview-image"
                src={streamImageSrc}
                alt="Live camera preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div className="preview-placeholder" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 200, color: 'var(--text-muted)' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 48, height: 48, marginBottom: 16 }}>
                  <path d="M23 7a2 2 0 0 0-2.45-1.45L16 7V5a2 2 0 0 0-2-2H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2l5 1.45A2 2 0 0 0 23 17V7Z"/>
                  <path d="m10 11 2 2 4-4"/>
                </svg>
                <p>{streamStatus === 'connecting' ? 'Connecting to live stream...' : 'Stream disconnected. Awaiting edge node stream...'}</p>
              </div>
            )}
          </div>

          <div className="telemetry-row" style={{ display: 'flex', gap: 16, marginTop: 12, fontSize: 12, color: 'var(--text-muted)' }}>
            <div>Latency: <strong>{latency !== null ? `${latency}ms` : '--'}</strong></div>
            <div>Render FPS: <strong>{renderFps !== null ? `${renderFps}fps` : '--'}</strong></div>
            <div>Total Frames: <strong>{totalFrames}</strong></div>
          </div>
        </section>

        <section className="panel panel-live">
          <div className="section-head">
            <div>
              <h2>Live detections</h2>
              <p>Polling /detections/recent every 10 seconds.</p>
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
              <input value={query.eventType} onChange={(event) => setQuery((current) => ({ ...current, eventType: event.target.value }))} placeholder="Clear this to see all detections" />
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

function LoginPage({
  apiBaseUrl,
  onLogin,
}: {
  apiBaseUrl: string
  onLogin: (token: string, username: string) => void
}) {
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('viewer')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Strip trailing /api/v1 so we can prepend /api/v1/auth/...
  const base = apiBaseUrl.replace(/\/$/, '').replace(/\/api\/v1$/, '')

  async function handleLogin(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${base}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json() as { access_token?: string; detail?: string }
      if (!res.ok) throw new Error(data.detail ?? `${res.status} ${res.statusText}`)
      onLogin(data.access_token!, username)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleRegister(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(`${base}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password, role }),
      })
      const data = await res.json() as { detail?: string }
      if (!res.ok) throw new Error(data.detail ?? `${res.status} ${res.statusText}`)
      setSuccess('Account created! You can now sign in.')
      setTab('login')
      setPassword('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  function switchTab(next: 'login' | 'register') {
    setTab(next)
    setError(null)
    setSuccess(null)
  }

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <p className="eyebrow">Threat Detection System</p>
        <h1>Welcome back</h1>

        <div className="auth-tabs">
          <button className={tab === 'login' ? 'active' : ''} onClick={() => switchTab('login')}>
            Sign in
          </button>
          <button className={tab === 'register' ? 'active' : ''} onClick={() => switchTab('register')}>
            Register
          </button>
        </div>

        {success ? <div className="notice success">{success}</div> : null}
        {error ? <div className="notice error">{error}</div> : null}

        {tab === 'login' ? (
          <form className="auth-form" onSubmit={(e) => void handleLogin(e)}>
            <label>
              <span>Username</span>
              <input
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </label>
            <label>
              <span>Password</span>
              <input
                required
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <button type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={(e) => void handleRegister(e)}>
            <label>
              <span>Username</span>
              <input
                required
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </label>
            <label>
              <span>Email</span>
              <input
                required
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </label>
            <label>
              <span>Password</span>
              <input
                required
                type="password"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <label>
              <span>Role</span>
              <select value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="viewer">Viewer</option>
                <option value="operator">Operator</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <button type="submit" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>
        )}
      </div>
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
        <div className="card-preview-shell">
          {event.preview_image_url ? (
            <img src={event.preview_image_url} alt={`${event.event_type} preview`} />
          ) : (
            <div className="card-preview-placeholder">
              <span>No saved image yet</span>
            </div>
          )}
        </div>
        <div className="card-header-main">
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

          {event.preview_image_url ? (
            <div className="raw-block">
              <h3>Saved image</h3>
              <img className="saved-image" src={event.preview_image_url} alt={`${event.event_type} saved`} />
            </div>
          ) : null}

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
