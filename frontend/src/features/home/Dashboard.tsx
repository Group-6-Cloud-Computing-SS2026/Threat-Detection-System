import { useEffect, useMemo, useState } from "react";
import Button from "../../shared/components/ui/Button.tsx";
import { useAuth } from "../auth/AuthContext.tsx";
import {
  apiFetch,
  buildImageUrl,
  buildQueryString,
  EMPTY_QUERY,
  SEVERITY_ORDER,
} from "./api.ts";
import DetectionCard from "./DetectionCard.tsx";
import type {
  CardState,
  DetectionDetail,
  DetectionEvent,
  PaginatedResponse,
  QueryState,
} from "../../shared/types";
import { useApiSettings } from "./useApiSettings.ts";

const inputClass =
  "w-full rounded-lg border border-brand-carbon-black-700 bg-brand-carbon-black-800 px-3 py-2 text-sm text-brand-alabaster-grey-100 outline-none transition focus:border-brand-light-green-500";
const labelClass = "space-y-1.5 text-sm";
const labelTextClass = "text-brand-alabaster-grey-500";

export default function Dashboard() {
  const { auth } = useAuth();
  const { apiBaseUrl, saveApiBaseUrl } = useApiSettings();
  const [draftApiBaseUrl, setDraftApiBaseUrl] = useState(apiBaseUrl);

  const [liveEvents, setLiveEvents] = useState<CardState[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<CardState[]>([]);
  const [filterTotals, setFilterTotals] = useState({
    total: 0,
    skip: 0,
    limit: 50,
  });
  const [query, setQuery] = useState<QueryState>(EMPTY_QUERY);

  const [autoRefresh, setAutoRefresh] = useState(true);
  const [liveLoading, setLiveLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const token = auth?.token;

  const liveSummary = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const event of liveEvents) {
      const key = event.event_type || "unknown";
      counts[key] = (counts[key] || 0) + 1;
    }
    return Object.entries(counts)
      .sort((left, right) => right[1] - left[1])
      .slice(0, 4);
  }, [liveEvents]);

  async function fetchRecentEvents() {
    setLiveLoading(true);
    setLiveError(null);
    try {
      const data = (await apiFetch(
        apiBaseUrl,
        token,
        "/detections/recent?limit=8",
      )) as DetectionEvent[];
      setLiveEvents(
        data.map((item) => ({
          ...item,
          preview_image_url: buildImageUrl(item.preview_image_url, apiBaseUrl),
          detailLoaded: false,
          imageUrls: {},
          images: [],
        })),
      );
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      setLiveError(
        error instanceof Error
          ? error.message
          : "Failed to load live detections",
      );
    } finally {
      setLiveLoading(false);
    }
  }

  async function fetchFilteredEvents() {
    setSearchLoading(true);
    setSearchError(null);
    try {
      const data = (await apiFetch(
        apiBaseUrl,
        token,
        `/detections?${buildQueryString(query)}`,
      )) as PaginatedResponse<DetectionEvent>;
      setFilteredEvents(
        data.items.map((item) => ({
          ...item,
          preview_image_url: buildImageUrl(item.preview_image_url, apiBaseUrl),
          detailLoaded: false,
          imageUrls: {},
          images: [],
        })),
      );
      setFilterTotals({
        total: data.total,
        skip: data.skip,
        limit: data.limit,
      });
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      setSearchError(
        error instanceof Error ? error.message : "Failed to load detections",
      );
    } finally {
      setSearchLoading(false);
    }
  }

  async function loadDetectionDetail(
    eventId: string,
    listName: "live" | "search",
  ) {
    const currentList = listName === "live" ? liveEvents : filteredEvents;
    const target = currentList.find((item) => item.id === eventId);
    if (!target || target.detailLoaded) {
      return;
    }

    try {
      const detail = (await apiFetch(
        apiBaseUrl,
        token,
        `/detections/${eventId}`,
      )) as DetectionDetail;
      const imageUrls: Record<string, string> = {};
      const apiOrigin = apiBaseUrl.replace(/\/api\/v1\/?$/, "");

      for (const image of detail.images || []) {
        imageUrls[image.id] = `${apiOrigin}/api/v1/images/${image.id}/download`;
      }

      const resolvedPreviewUrl = buildImageUrl(
        detail.preview_image_url,
        apiBaseUrl,
      );
      const updater = (prev: CardState[]) =>
        prev.map((item) =>
          item.id === eventId
            ? {
                ...item,
                ...detail,
                preview_image_url: resolvedPreviewUrl ?? item.preview_image_url,
                detailLoaded: true,
                imageUrls,
              }
            : item,
        );

      if (listName === "live") {
        setLiveEvents(updater);
      } else {
        setFilteredEvents(updater);
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to load event detail";
      if (listName === "live") {
        setLiveError(message);
      } else {
        setSearchError(message);
      }
    }
  }

  useEffect(() => {
    void fetchRecentEvents();
    void fetchFilteredEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBaseUrl, token]);

  useEffect(() => {
    if (!autoRefresh) {
      return;
    }
    const timer = window.setInterval(() => {
      void fetchRecentEvents();
    }, 5000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, apiBaseUrl, token]);

  function resetFilters() {
    setQuery(EMPTY_QUERY);
    setFilteredEvents([]);
    setFilterTotals({ total: 0, skip: 0, limit: 50 });
  }

  function clearPersonFilter() {
    setQuery((current) => ({ ...current, eventType: "" }));
    void fetchFilteredEvents();
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1fr_auto]">
        <div>
          <p className="text-brand-light-green-400 mb-2 text-sm font-medium">
            Threat Detection System
          </p>
          <h1 className="font-nacelle text-brand-alabaster-grey-100 mb-3 text-4xl font-semibold md:text-5xl">
            Live detections, history filters, and image drill-down
          </h1>
          <p className="text-brand-alabaster-grey-600 mb-5 max-w-2xl">
            Poll the backend for the latest detections, search previous records
            with filters, and open stored images from each event.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={clearPersonFilter}
            >
              Clear person filter
            </Button>
            <Button
              variant="secondary"
              size="sm"
              href="/camera_stream.html"
              target="_blank"
              rel="noreferrer"
            >
              Open camera preview
            </Button>
            <Button
              variant="secondary"
              size="sm"
              href={`${apiBaseUrl.replace(/\/api\/v1\/?$/, "")}/docs`}
              target="_blank"
              rel="noreferrer"
            >
              Open Swagger API
            </Button>
          </div>
        </div>

        <div className="flex gap-3 lg:flex-col">
          <StatCard label="Live feed" value={String(liveEvents.length)} />
          <StatCard label="Filtered total" value={String(filterTotals.total)} />
          <StatCard label="Last update" value={lastUpdated || "--:--:--"} />
        </div>
      </section>

      <section className="border-brand-carbon-black-800 bg-brand-carbon-black-900/60 rounded-2xl border p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-nacelle text-brand-alabaster-grey-100 text-lg font-semibold">
              Connection
            </h2>
            <p className="text-brand-alabaster-grey-600 text-sm">
              Signed in as{" "}
              <strong className="text-brand-alabaster-grey-300">
                {auth?.username}
              </strong>
              . Update the API base URL if needed.
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={() => void fetchRecentEvents()}
          >
            Refresh now
          </Button>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className={`${labelClass} min-w-64 flex-1`}>
            <span className={labelTextClass}>API base URL</span>
            <input
              className={inputClass}
              value={draftApiBaseUrl}
              onChange={(event) => setDraftApiBaseUrl(event.target.value)}
            />
          </label>
          <Button
            type="button"
            size="sm"
            onClick={() => saveApiBaseUrl(draftApiBaseUrl)}
          >
            Save connection
          </Button>
          <Button
            variant="secondary"
            size="sm"
            type="button"
            onClick={() => setAutoRefresh((value) => !value)}
          >
            {autoRefresh ? "Pause live refresh" : "Resume live refresh"}
          </Button>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="border-brand-carbon-black-800 bg-brand-carbon-black-900/60 rounded-2xl border p-5 xl:col-span-2">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-nacelle text-brand-alabaster-grey-100 text-lg font-semibold">
                Camera preview
              </h2>
              <p className="text-brand-alabaster-grey-600 text-sm">
                Embedded live stream from camera_stream.html.
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              href="/camera_stream.html"
              target="_blank"
              rel="noreferrer"
            >
              Open in new tab
            </Button>
          </div>
          <div className="border-brand-carbon-black-800 bg-brand-pitch-black-500 overflow-hidden rounded-xl border">
            <iframe
              className="aspect-video w-full"
              src="/camera_stream.html"
              title="Live camera preview"
              loading="lazy"
            />
          </div>
        </section>

        <section className="border-brand-carbon-black-800 bg-brand-carbon-black-900/60 rounded-2xl border p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-nacelle text-brand-alabaster-grey-100 text-lg font-semibold">
                Live detections
              </h2>
              <p className="text-brand-alabaster-grey-600 text-sm">
                Polling /detections/recent every 5 seconds.
              </p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                autoRefresh
                  ? "bg-brand-light-green-950 text-brand-light-green-400"
                  : "bg-brand-carbon-black-700 text-brand-alabaster-grey-500"
              }`}
            >
              {autoRefresh ? "Auto refresh on" : "Auto refresh off"}
            </span>
          </div>

          {liveError ? <Notice tone="error">{liveError}</Notice> : null}
          {liveLoading ? <Notice>Loading latest detections...</Notice> : null}

          <div className="mb-4 flex flex-wrap gap-2">
            {liveSummary.length > 0 ? (
              liveSummary.map(([label, count]) => (
                <span
                  key={label}
                  className="bg-brand-carbon-black-800 text-brand-alabaster-grey-300 rounded-full px-2.5 py-1 text-xs"
                >
                  {label}: {count}
                </span>
              ))
            ) : (
              <span className="bg-brand-carbon-black-800 text-brand-alabaster-grey-600 rounded-full px-2.5 py-1 text-xs">
                No detections yet
              </span>
            )}
          </div>

          <div className="space-y-3">
            {liveEvents.map((event) => (
              <DetectionCard
                key={event.id}
                event={event}
                listName="live"
                onToggle={() => void loadDetectionDetail(event.id, "live")}
              />
            ))}
          </div>
        </section>

        <section className="border-brand-carbon-black-800 bg-brand-carbon-black-900/60 rounded-2xl border p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-nacelle text-brand-alabaster-grey-100 text-lg font-semibold">
                Previous detections
              </h2>
              <p className="text-brand-alabaster-grey-600 text-sm">
                Filter the historical list by event type, severity, sensor,
                time, and status.
              </p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              type="button"
              onClick={resetFilters}
            >
              Clear filters
            </Button>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <label className={labelClass}>
              <span className={labelTextClass}>Event type</span>
              <input
                className={inputClass}
                value={query.eventType}
                onChange={(event) =>
                  setQuery((current) => ({
                    ...current,
                    eventType: event.target.value,
                  }))
                }
                placeholder="All"
              />
            </label>
            <label className={labelClass}>
              <span className={labelTextClass}>Severity</span>
              <select
                className={inputClass}
                value={query.severity}
                onChange={(event) =>
                  setQuery((current) => ({
                    ...current,
                    severity: event.target.value,
                  }))
                }
              >
                <option value="">Any</option>
                {SEVERITY_ORDER.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              <span className={labelTextClass}>Sensor ID</span>
              <input
                className={inputClass}
                value={query.sensorId}
                onChange={(event) =>
                  setQuery((current) => ({
                    ...current,
                    sensorId: event.target.value,
                  }))
                }
                placeholder="UUID"
              />
            </label>
            <label className={labelClass}>
              <span className={labelTextClass}>Acknowledged</span>
              <select
                className={inputClass}
                value={query.acknowledged}
                onChange={(event) =>
                  setQuery((current) => ({
                    ...current,
                    acknowledged: event.target.value,
                  }))
                }
              >
                <option value="">Any</option>
                <option value="true">True</option>
                <option value="false">False</option>
              </select>
            </label>
            <label className={labelClass}>
              <span className={labelTextClass}>Start time</span>
              <input
                type="datetime-local"
                className={inputClass}
                value={query.startTime}
                onChange={(event) =>
                  setQuery((current) => ({
                    ...current,
                    startTime: event.target.value,
                  }))
                }
              />
            </label>
            <label className={labelClass}>
              <span className={labelTextClass}>End time</span>
              <input
                type="datetime-local"
                className={inputClass}
                value={query.endTime}
                onChange={(event) =>
                  setQuery((current) => ({
                    ...current,
                    endTime: event.target.value,
                  }))
                }
              />
            </label>
            <label className={labelClass}>
              <span className={labelTextClass}>Skip</span>
              <input
                type="number"
                min="0"
                className={inputClass}
                value={query.skip}
                onChange={(event) =>
                  setQuery((current) => ({
                    ...current,
                    skip: event.target.value,
                  }))
                }
              />
            </label>
            <label className={labelClass}>
              <span className={labelTextClass}>Limit</span>
              <input
                type="number"
                min="1"
                max="200"
                className={inputClass}
                value={query.limit}
                onChange={(event) =>
                  setQuery((current) => ({
                    ...current,
                    limit: event.target.value,
                  }))
                }
              />
            </label>
          </div>

          <div className="mb-4 flex flex-wrap gap-3">
            <Button
              type="button"
              size="sm"
              onClick={() => void fetchFilteredEvents()}
            >
              {searchLoading ? "Searching..." : "Search detections"}
            </Button>
          </div>

          {searchError ? <Notice tone="error">{searchError}</Notice> : null}

          <div className="text-brand-alabaster-grey-600 mb-3 flex justify-between text-xs">
            <span>{filterTotals.total} result(s)</span>
            <span>Showing {filteredEvents.length} item(s)</span>
          </div>

          <div className="space-y-3">
            {filteredEvents.map((event) => (
              <DetectionCard
                key={event.id}
                event={event}
                listName="search"
                onToggle={() => void loadDetectionDetail(event.id, "search")}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-brand-carbon-black-800 bg-brand-carbon-black-900/60 min-w-32 rounded-xl border px-4 py-3">
      <span className="text-brand-alabaster-grey-600 block text-xs">
        {label}
      </span>
      <strong className="font-nacelle text-brand-alabaster-grey-100 text-xl font-semibold">
        {value}
      </strong>
    </div>
  );
}

function Notice({
  tone = "info",
  children,
}: {
  tone?: "info" | "error";
  children: string;
}) {
  const toneClass =
    tone === "error"
      ? "bg-brand-brick-red-950 text-brand-brick-red-300"
      : "bg-brand-carbon-black-800 text-brand-alabaster-grey-400";
  return (
    <div className={`mb-4 rounded-lg px-3 py-2 text-sm ${toneClass}`}>
      {children}
    </div>
  );
}
