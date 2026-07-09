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

/* ── Constants ── */
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
    if (!raw) return { apiBaseUrl: defaultApiBaseUrl, token: '' }
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

function formatDateShort(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) +
    ' ' + date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })
}

function buildImageUrl(previewUrl: string | null | undefined, apiBaseUrl: string): string | null {
  if (!previewUrl) return null
  if (previewUrl.startsWith('http://') || previewUrl.startsWith('https://')) return previewUrl
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

/* ── SVG Icons ── */
function IconShield() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  )
}
function IconActivity() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  )
}
function IconCamera() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 7a2 2 0 0 0-2.45-1.45L16 7V5a2 2 0 0 0-2-2H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2l5 1.45A2 2 0 0 0 23 17V7Z" />
    </svg>
  )
}
function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
  )
}
function IconSettings() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}
function IconLogout() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  )
}
function IconRefresh() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" />
      <polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  )
}
function IconDocs() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  )
}
function IconImage() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  )
}
function IconChevron({ up }: { up?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ width: 12, height: 12, transform: up ? 'rotate(180deg)' : undefined, transition: 'transform 200ms ease' }}>
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}
function IconBarChart() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
      <line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  )
}
function IconGrafana() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12h4" />
      <path d="M12 12v4" />
      <circle cx="12" cy="8" r="1" fill="currentColor" stroke="none" />
    </svg>
  )
}

/* ═══════════════════════════════════════
   MAIN APP
   ═══════════════════════════════════════ */
function App() {
  const [settings, setSettings] = useState(loadSavedSettings)
  const [draftSettings, setDraftSettings] = useState(loadSavedSettings)
  const [liveEvents, setLiveEvents] = useState<CardState[]>([])
  const [filteredEvents, setFilteredEvents] = useState<CardState[]>([])
  const [filterTotals, setFilterTotals] = useState({ total: 0, skip: 0, limit: 50 })
  const [query, setQuery] = useState<QueryState>({
    eventType: '', severity: '', sensorId: '', acknowledged: '',
    startTime: '', endTime: '', skip: '0', limit: '50',
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
  const [activeSection, setActiveSection] = useState<'overview' | 'search' | 'settings' | 'graphs'>('overview')

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
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 4)
  }, [liveEvents])

  const criticalCount = useMemo(
    () => liveEvents.filter((e) => e.severity === 'critical').length,
    [liveEvents]
  )
  const unackedCount = useMemo(
    () => liveEvents.filter((e) => !e.acknowledged).length,
    [liveEvents]
  )

  useEffect(() => { localStorage.setItem(storageKey, JSON.stringify(settings)) }, [settings])
  useEffect(() => { setDraftSettings(settings) }, [settings])

  async function apiFetch(path: string, options?: RequestInit) {
    const headers = new Headers(options?.headers)
    headers.set('accept', 'application/json')
    const token = authState?.token || settings.token.trim()
    if (token) headers.set('Authorization', `Bearer ${token}`)
    const response = await fetch(`${settings.apiBaseUrl.replace(/\/$/, '')}${path}`, { ...options, headers })
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
        detailLoaded: false, imageUrls: {}, images: [],
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
        detailLoaded: false, imageUrls: {}, images: [],
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
    const currentList = listName === 'live' ? liveEvents : filteredEvents
    const target = currentList.find((item) => item.id === eventId)
    if (!target || target.detailLoaded) return
    try {
      const detail = await apiFetch(`/detections/${eventId}`) as DetectionDetail
      const imageUrls: Record<string, string> = {}
      const apiOrigin = settings.apiBaseUrl.replace(/\/api\/v1\/?$/, '')
      for (const image of detail.images || []) {
        imageUrls[image.id] = `${apiOrigin}/api/v1/images/${image.id}/download`
      }
      const resolvedPreviewUrl = buildImageUrl(detail.preview_image_url, settings.apiBaseUrl)
      if (listName === 'live') {
        setLiveEvents((prev) => prev.map((item) =>
          item.id === eventId
            ? { ...item, ...detail, preview_image_url: resolvedPreviewUrl ?? item.preview_image_url, detailLoaded: true, imageUrls }
            : item
        ))
      } else {
        setFilteredEvents((prev) => prev.map((item) =>
          item.id === eventId
            ? { ...item, ...detail, preview_image_url: resolvedPreviewUrl ?? item.preview_image_url, detailLoaded: true, imageUrls }
            : item
        ))
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load event detail'
      if (listName === 'live') setLiveError(message)
      else setSearchError(message)
    }
  }

  useEffect(() => { void fetchRecentEvents() }, [settings.apiBaseUrl, settings.token])
  useEffect(() => { void fetchFilteredEvents() }, [settings.apiBaseUrl, settings.token])

  useEffect(() => {
    if (!autoRefresh) return
    const timer = window.setInterval(() => { void fetchRecentEvents() }, 10000)
    return () => window.clearInterval(timer)
  }, [autoRefresh, settings.apiBaseUrl, settings.token])

  useEffect(() => {
    let socket: WebSocket | null = null
    let isMounted = true
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
      socket.onopen = () => { if (isMounted) setStreamStatus('connected') }
      socket.onmessage = (event) => {
        if (!isMounted) return
        try {
          const payload = JSON.parse(event.data)
          const base64Data = payload.image || payload.image_base64
          if (base64Data) {
            setStreamImageSrc(`data:image/jpeg;base64,${base64Data}`)
            if (payload.timestamp) {
              setLatency(Date.now() - new Date(payload.timestamp).getTime())
            }
            const now = performance.now()
            const delta = now - lastFrameTime
            lastFrameTime = now
            fpsSamples.push(Math.round(1000 / delta))
            if (fpsSamples.length > 10) fpsSamples.shift()
            setRenderFps(Math.round(fpsSamples.reduce((a, b) => a + b, 0) / fpsSamples.length))
            setTotalFrames((f) => f + 1)
          }
        } catch (err) { console.error('WS frame error', err) }
      }
      socket.onerror = () => { if (isMounted) setStreamStatus('disconnected') }
      socket.onclose = () => {
        if (!isMounted) return
        setStreamStatus('disconnected')
        setStreamImageSrc(null)
        setTimeout(() => { if (isMounted) connectSocket() }, 5000)
      }
    }

    connectSocket()
    return () => {
      isMounted = false
      if (socket) socket.close()
    }
  }, [authState, settings.apiBaseUrl])

  function saveConnectionSettings() {
    setSettings((current) => ({
      ...current,
      apiBaseUrl: draftSettings.apiBaseUrl.trim() || defaultApiBaseUrl,
    }))
  }

  function resetFilters() {
    setQuery({ eventType: '', severity: '', sensorId: '', acknowledged: '', startTime: '', endTime: '', skip: '0', limit: '50' })
    setFilteredEvents([])
    setFilterTotals({ total: 0, skip: 0, limit: 50 })
  }


  if (!authState) {
    return <LoginPage apiBaseUrl={settings.apiBaseUrl} onLogin={handleLogin} />
  }

  return (
    <div className="app-shell">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon"><IconShield /></div>
          <div className="brand-name">ThreatOff</div>
          <div className="brand-sub">Surveillance Dashboard</div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Dashboard</div>
          <button
            className={`nav-item ${activeSection === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveSection('overview')}
          >
            <IconActivity /> Overview
          </button>
          <button
            className={`nav-item ${activeSection === 'search' ? 'active' : ''}`}
            onClick={() => setActiveSection('search')}
          >
            <IconSearch /> Search Events
          </button>

          <div className="nav-section-label">System</div>
          <button
            className={`nav-item ${activeSection === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveSection('settings')}
          >
            <IconSettings /> Settings
          </button>
          <a className="nav-item" href="/docs" target="_blank" rel="noreferrer">
            <IconDocs /> API Docs
          </a>
          <button
            className={`nav-item ${activeSection === 'graphs' ? 'active' : ''}`}
            onClick={() => setActiveSection('graphs')}
          >
            <IconBarChart /> Scaling Law Results
          </button>
          <a
            className="nav-item"
            href="http://192.168.1.50:3000/d/rpi-cluster-v4/raspberry-pi-cluster-e28094-monitoring?orgId=1&refresh=1m"
            target="_blank"
            rel="noreferrer"
          >
            <IconGrafana /> Grafana
          </a>

          <div className="nav-section-label">Account</div>
          <button className="nav-item danger" onClick={handleLogout}>
            <IconLogout /> Sign Out
          </button>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">{authState.username.charAt(0).toUpperCase()}</div>
            <div className="user-info">
              <div className="user-name">{authState.username}</div>
              <div className="user-role">Authenticated</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main Area ── */}
      <div className="main-area">
        {/* Top Bar */}
        <header className="topbar">
          <div className="topbar-title">
            <h1>
              {activeSection === 'overview' && 'Live Overview'}
              {activeSection === 'search' && 'Event Search'}
              {activeSection === 'settings' && 'System Settings'}
              {activeSection === 'graphs' && 'Amdahl’s & Gustafson’s Law Results'}
            </h1>
            <p>
              {lastUpdated ? `Last updated at ${lastUpdated}` : 'Loading data…'}
            </p>
          </div>

          <div className="topbar-actions">
            <div className="topbar-stat">
              <span className="topbar-stat-label">Live Feed</span>
              <span className="topbar-stat-value live">{liveEvents.length}</span>
            </div>
            <div className="topbar-stat">
              <span className="topbar-stat-label">Results</span>
              <span className="topbar-stat-value">{filterTotals.total}</span>
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => void fetchRecentEvents()}
              title="Refresh now"
            >
              <IconRefresh />
              Refresh
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content">

          {/* ── OVERVIEW SECTION ── */}
          {activeSection === 'overview' && (
            <>
              {/* Stats row */}
              <div className="stats-row">
                <div className="stat-tile accent-blue">
                  <div className="stat-tile-label">Live Detections</div>
                  <div className="stat-tile-value">{liveEvents.length}</div>
                  <div className="stat-tile-sub">From /detections/recent</div>
                </div>
                <div className="stat-tile accent-orange">
                  <div className="stat-tile-label">Critical Events</div>
                  <div className="stat-tile-value">{criticalCount}</div>
                  <div className="stat-tile-sub">Requires attention</div>
                </div>
                <div className="stat-tile">
                  <div className="stat-tile-label">Unacknowledged</div>
                  <div className="stat-tile-value">{unackedCount}</div>
                  <div className="stat-tile-sub">Pending review</div>
                </div>
                <div className="stat-tile accent-teal">
                  <div className="stat-tile-label">Stream FPS</div>
                  <div className="stat-tile-value">{renderFps !== null ? renderFps : '—'}</div>
                  <div className="stat-tile-sub">Avg over last 10 frames</div>
                </div>
              </div>

              {/* Camera + Live Detections */}
              <div className="content-row">
                {/* Camera Panel */}
                <div className="card">
                  <div className="card-head">
                    <div className="card-head-left">
                      <div className="card-head-icon blue"><IconCamera /></div>
                      <div>
                        <h2>Camera Feed</h2>
                        <p>Live edge telemetry via WebSocket</p>
                      </div>
                    </div>
                    <div className="card-head-right">
                      <span className={`badge ${streamStatus === 'connected' ? 'live' : streamStatus === 'connecting' ? 'connecting' : 'offline'}`}>
                        {streamStatus === 'connected' ? 'Live' : streamStatus === 'connecting' ? 'Connecting' : 'Offline'}
                      </span>
                    </div>
                  </div>
                  <div className="stream-wrap">
                    {streamImageSrc ? (
                      <img src={streamImageSrc} alt="Live camera preview" />
                    ) : (
                      <div className="stream-placeholder">
                        <IconCamera />
                        <p>
                          {streamStatus === 'connecting'
                            ? 'Connecting to edge node…'
                            : 'Awaiting stream from edge node'}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="telemetry-bar">
                    <div className="telemetry-item">
                      Latency: <strong>{latency !== null ? `${latency}ms` : '—'}</strong>
                    </div>
                    <div className="telemetry-item">
                      FPS: <strong>{renderFps !== null ? `${renderFps}fps` : '—'}</strong>
                    </div>
                    <div className="telemetry-item">
                      Frames: <strong>{totalFrames}</strong>
                    </div>
                  </div>
                </div>

                {/* Live Detections Panel */}
                <div className="card">
                  <div className="card-head">
                    <div className="card-head-left">
                      <div className="card-head-icon orange"><IconActivity /></div>
                      <div>
                        <h2>Live Detections</h2>
                        <p>Polling /detections/recent every 10s</p>
                      </div>
                    </div>
                    <div className="card-head-right">
                      <button
                        className="btn btn-ghost"
                        onClick={() => setAutoRefresh((v) => !v)}
                        title={autoRefresh ? 'Pause auto-refresh' : 'Resume auto-refresh'}
                      >
                        <span className={`badge ${autoRefresh ? 'on' : 'off'}`}
                          style={{ fontSize: 11, gap: 4 }}>
                          {autoRefresh ? 'Auto On' : 'Auto Off'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {liveError && <div className="notice error" style={{ margin: '12px 20px 0' }}>{liveError}</div>}
                  {liveLoading && <div className="notice" style={{ margin: '12px 20px 0' }}>Loading latest detections…</div>}

                  <div className="card-body" style={{ paddingTop: 10, paddingBottom: 10 }}>
                    <div className="chip-row">
                      {liveSummary.length > 0
                        ? liveSummary.map(([label, count]) => (
                          <span key={label} className="chip">{label}: {count}</span>
                        ))
                        : <span className="chip muted">No detections yet</span>}
                    </div>
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
                    {liveEvents.length === 0 && !liveLoading && (
                      <div style={{ padding: '24px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                        No recent detections
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── SEARCH SECTION ── */}
          {activeSection === 'search' && (
            <div className="card">
              <div className="card-head">
                <div className="card-head-left">
                  <div className="card-head-icon blue"><IconSearch /></div>
                  <div>
                    <h2>Search Historical Events</h2>
                    <p>Filter by event type, severity, sensor, time range, and acknowledgement status</p>
                  </div>
                </div>
                <div className="card-head-right">
                  <button className="btn btn-ghost" onClick={resetFilters}>Clear filters</button>
                </div>
              </div>

              <div className="card-body">
                <div className="filter-grid">
                  <div className="form-group">
                    <label className="form-label">Event type</label>
                    <input
                      className="form-input"
                      value={query.eventType}
                      onChange={(e) => setQuery((c) => ({ ...c, eventType: e.target.value }))}
                      placeholder="e.g. person_detected"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Severity</label>
                    <select
                      className="form-select"
                      value={query.severity}
                      onChange={(e) => setQuery((c) => ({ ...c, severity: e.target.value }))}
                    >
                      <option value="">Any severity</option>
                      {severityOrder.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sensor ID</label>
                    <input
                      className="form-input"
                      value={query.sensorId}
                      onChange={(e) => setQuery((c) => ({ ...c, sensorId: e.target.value }))}
                      placeholder="UUID"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Acknowledged</label>
                    <select
                      className="form-select"
                      value={query.acknowledged}
                      onChange={(e) => setQuery((c) => ({ ...c, acknowledged: e.target.value }))}
                    >
                      <option value="">Any</option>
                      <option value="true">Acknowledged</option>
                      <option value="false">Unacknowledged</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Start time</label>
                    <input
                      type="datetime-local"
                      className="form-input"
                      value={query.startTime}
                      onChange={(e) => setQuery((c) => ({ ...c, startTime: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">End time</label>
                    <input
                      type="datetime-local"
                      className="form-input"
                      value={query.endTime}
                      onChange={(e) => setQuery((c) => ({ ...c, endTime: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Skip (offset)</label>
                    <input
                      type="number"
                      min="0"
                      className="form-input"
                      value={query.skip}
                      onChange={(e) => setQuery((c) => ({ ...c, skip: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Limit (max 200)</label>
                    <input
                      type="number"
                      min="1"
                      max="200"
                      className="form-input"
                      value={query.limit}
                      onChange={(e) => setQuery((c) => ({ ...c, limit: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="filter-actions">
                  <button
                    className="btn btn-primary"
                    onClick={() => void fetchFilteredEvents()}
                    disabled={searchLoading}
                  >
                    <IconSearch />
                    {searchLoading ? 'Searching…' : 'Search Events'}
                  </button>
                  <div className="spacer" />
                </div>

                {searchError && <div className="notice error" style={{ marginTop: 12 }}>{searchError}</div>}
              </div>

              {filteredEvents.length > 0 && (
                <div className="result-meta">
                  <span>Showing <strong>{filteredEvents.length}</strong> of <strong>{filterTotals.total}</strong> results</span>
                  <span>·</span>
                  <span>Page offset: <strong>{filterTotals.skip}</strong></span>
                </div>
              )}

              <div className="detection-list">
                {filteredEvents.map((event) => (
                  <DetectionCard
                    key={event.id}
                    event={event}
                    listName="search"
                    onToggle={() => void loadDetectionDetail(event.id, 'search')}
                  />
                ))}
                {filteredEvents.length === 0 && !searchLoading && (
                  <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                    Run a search above to see results
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── SETTINGS SECTION ── */}
          {activeSection === 'settings' && (
            <div className="card" style={{ maxWidth: 640 }}>
              <div className="card-head">
                <div className="card-head-left">
                  <div className="card-head-icon purple"><IconSettings /></div>
                  <div>
                    <h2>Connection Settings</h2>
                    <p>Configure the API endpoint for this session</p>
                  </div>
                </div>
              </div>
              <div className="card-body">
                <div style={{ marginBottom: 16, padding: '10px 14px', borderRadius: 'var(--radius-md)', background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', fontSize: 13, color: 'var(--text-secondary)' }}>
                  Signed in as <strong style={{ color: 'var(--text-primary)' }}>{authState.username}</strong>
                </div>

                <div className="form-group" style={{ marginBottom: 12 }}>
                  <label className="form-label">API Base URL</label>
                  <input
                    className="form-input"
                    value={draftSettings.apiBaseUrl}
                    onChange={(e) => setDraftSettings((c) => ({ ...c, apiBaseUrl: e.target.value }))}
                    placeholder={defaultApiBaseUrl}
                  />
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" onClick={saveConnectionSettings}>
                    Save Connection
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => setAutoRefresh((v) => !v)}
                  >
                    {autoRefresh ? 'Pause Live Refresh' : 'Resume Live Refresh'}
                  </button>
                  <button
                    className="btn btn-danger"
                    onClick={handleLogout}
                  >
                    <IconLogout /> Sign Out
                  </button>
                </div>
              </div>
            </div>
          )}
          {/* ── GRAPHS SECTION ── */}
          {activeSection === 'graphs' && (
            <iframe
              src="/task_4_graphs.html"
              title="Task 4 Graphs"
              style={{
                width: '100%',
                flex: 1,
                border: 'none',
                borderRadius: 'var(--radius-xl)',
                minHeight: 'calc(100vh - var(--topbar-height) - 40px)',
                background: '#0a0f1e',
              }}
            />
          )}

        </main>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════
   LOGIN PAGE
   ═══════════════════════════════════════ */
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
      <div className="auth-container">
        <div className="auth-brand">
          <div className="auth-brand-icon"><IconShield /></div>
          <h1>ThreatOff</h1>
          <p>Surveillance &amp; Detection Dashboard</p>
        </div>

        <div className="auth-card">
          <div className="auth-tabs">
            <button className={`auth-tab ${tab === 'login' ? 'active' : ''}`} onClick={() => switchTab('login')}>
              Sign In
            </button>
            <button className={`auth-tab ${tab === 'register' ? 'active' : ''}`} onClick={() => switchTab('register')}>
              Register
            </button>
          </div>

          {success && <div className="notice success" style={{ marginBottom: 16 }}>{success}</div>}
          {error && <div className="notice error" style={{ marginBottom: 16 }}>{error}</div>}

          {tab === 'login' ? (
            <form className="auth-form" onSubmit={(e) => void handleLogin(e)}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  className="form-input"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="your-username"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  className="form-input"
                  required
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form className="auth-form" onSubmit={(e) => void handleRegister(e)}>
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  className="form-input"
                  required
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="your-username"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  required
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  className="form-input"
                  required
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="viewer">Viewer</option>
                  <option value="operator">Operator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Creating account…' : 'Create Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════
   DETECTION CARD
   ═══════════════════════════════════════ */
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
    setExpanded((v) => !v)
    if (!expanded) onToggle()
  }

  const sevClass = event.severity?.toLowerCase() as 'critical' | 'high' | 'medium' | 'low'

  return (
    <article>
      <button className={`detection-row ${expanded ? 'expanded' : ''}`} onClick={toggle}>
        <div className="det-thumb">
          {event.preview_image_url ? (
            <img src={event.preview_image_url} alt={`${event.event_type} preview`} />
          ) : (
            <div className="det-thumb-placeholder"><IconImage /></div>
          )}
        </div>

        <div className="det-info">
          <div className="det-title-row">
            <span className="det-type">{event.event_type}</span>
            <span className={`severity-chip ${sevClass}`}>{event.severity}</span>
            <span className={`det-ack-badge ${event.acknowledged ? 'acked' : 'new'}`}>
              {event.acknowledged ? 'acked' : 'new'}
            </span>
          </div>
          <div className="det-meta">
            <span>{listName === 'live' ? '⚡ Live' : '🔍 Search'}</span>
            <span>·</span>
            <span>{formatDateShort(event.detected_at)}</span>
          </div>
        </div>

        <div className="det-actions">
          <span className="det-confidence">{Math.round(event.confidence * 100)}%</span>
          <span className="det-sensor-id">{event.sensor_node_id.slice(0, 8)}</span>
          <IconChevron up={expanded} />
        </div>
      </button>

      {expanded && (
        <div className="det-detail">
          {/* Timestamps */}
          <div className="det-detail-grid">
            <dl className="det-detail-field">
              <dt>Detected</dt>
              <dd>{formatDateTime(event.detected_at)}</dd>
            </dl>
            <dl className="det-detail-field">
              <dt>Received</dt>
              <dd>{formatDateTime(event.received_at)}</dd>
            </dl>
            <dl className="det-detail-field">
              <dt>Created</dt>
              <dd>{formatDateTime(event.created_at)}</dd>
            </dl>
            <dl className="det-detail-field">
              <dt>Sensor ID</dt>
              <dd style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11 }}>{event.sensor_node_id}</dd>
            </dl>
          </div>

          {/* JSON blocks */}
          <div className="det-json-row">
            <div className="det-json-block">
              <h3>Raw Detections</h3>
              <pre>{JSON.stringify(event.raw_detections || {}, null, 2)}</pre>
            </div>
            <div className="det-json-block">
              <h3>Metadata</h3>
              <pre>{JSON.stringify(event.metadata || {}, null, 2)}</pre>
            </div>
          </div>

          {/* Saved preview */}
          {event.preview_image_url && (
            <div className="det-image-section">
              <h3>Saved Image</h3>
              <img className="det-saved-image" src={event.preview_image_url} alt={`${event.event_type} saved`} />
            </div>
          )}

          {/* Stored images */}
          {event.images && event.images.length > 0 ? (
            <div className="det-image-section">
              <h3>Stored Images ({event.images.length})</h3>
              <div className="det-image-grid">
                {event.images.map((image) => (
                  <div key={image.id} className="det-image-card">
                    <img src={event.imageUrls?.[image.id]} alt={image.image_type} />
                    <div className="det-image-meta">
                      <strong>{image.image_type}</strong>
                      <span>{image.storage_key}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>No stored images loaded yet — click to refresh.</p>
          )}
        </div>
      )}
    </article>
  )
}

export default App
