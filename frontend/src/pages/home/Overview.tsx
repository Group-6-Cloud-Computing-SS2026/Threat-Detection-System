import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../auth/AuthContext.tsx";
import { apiFetch } from "./api.ts";
import CameraFeed from "./CameraFeed.tsx";
import DetectionCard from "./DetectionCard.tsx";
import type { CardState, DetectionEvent } from "../../shared/types";
import { useApiSettings } from "./useApiSettings.ts";
import { toCardState, useDetectionDetailLoader } from "./useDetectionCards.ts";

export default function Overview() {
  const { auth } = useAuth();
  const { apiBaseUrl } = useApiSettings();
  const token = auth?.token;

  const [liveEvents, setLiveEvents] = useState<CardState[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const loadDetectionDetail = useDetectionDetailLoader(
    apiBaseUrl,
    token,
    setLiveEvents,
    setLiveError,
  );

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

  const criticalCount = useMemo(
    () => liveEvents.filter((event) => event.severity === "critical").length,
    [liveEvents],
  );

  async function fetchRecentEvents() {
    setLiveLoading(true);
    setLiveError(null);
    try {
      const data = (await apiFetch(
        apiBaseUrl,
        token,
        "/detections/recent?limit=8",
      )) as DetectionEvent[];
      setLiveEvents(data.map((item) => toCardState(item, apiBaseUrl)));
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

  useEffect(() => {
    void fetchRecentEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBaseUrl, token]);

  useEffect(() => {
    if (!autoRefresh) {
      return;
    }
    const timer = window.setInterval(() => {
      void fetchRecentEvents();
    }, 10000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRefresh, apiBaseUrl, token]);

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-3">
        <StatTile
          label="Live detections"
          value={String(liveEvents.length)}
          sub="From /detections/recent"
        />
        <StatTile
          label="Critical events"
          value={String(criticalCount)}
          sub="Requires attention"
          tone="danger"
        />
        <StatTile
          label="Last updated"
          value={lastUpdated || "—"}
          sub={autoRefresh ? "Auto-refresh on" : "Auto-refresh paused"}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-2">
        <CameraFeed apiBaseUrl={apiBaseUrl} />

        <section className="border-brand-carbon-black-800 bg-brand-carbon-black-900/60 rounded-2xl border p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-nacelle text-brand-alabaster-grey-100 text-lg font-semibold">
                Live detections
              </h2>
              <p className="text-brand-alabaster-grey-600 text-sm">
                Polling /detections/recent every 10 seconds.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAutoRefresh((value) => !value)}
              className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                autoRefresh
                  ? "bg-brand-light-green-950 text-brand-light-green-400"
                  : "bg-brand-carbon-black-700 text-brand-alabaster-grey-500"
              }`}
            >
              {autoRefresh ? "Auto refresh on" : "Auto refresh off"}
            </button>
          </div>

          {liveError ? (
            <div className="bg-brand-brick-red-950 text-brand-brick-red-300 mb-4 rounded-lg px-3 py-2 text-sm">
              {liveError}
            </div>
          ) : null}
          {liveLoading ? (
            <div className="bg-brand-carbon-black-800 text-brand-alabaster-grey-400 mb-4 rounded-lg px-3 py-2 text-sm">
              Loading latest detections...
            </div>
          ) : null}

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
                onToggle={() => void loadDetectionDetail(event.id, liveEvents)}
              />
            ))}
            {liveEvents.length === 0 && !liveLoading ? (
              <p className="text-brand-alabaster-grey-600 py-6 text-center text-sm">
                No recent detections
              </p>
            ) : null}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatTile({
  label,
  value,
  sub,
  tone = "default",
}: {
  label: string;
  value: string;
  sub: string;
  tone?: "default" | "danger";
}) {
  return (
    <div className="border-brand-carbon-black-800 bg-brand-carbon-black-900/60 rounded-2xl border p-4">
      <span className="text-brand-alabaster-grey-600 text-xs font-medium tracking-wide uppercase">
        {label}
      </span>
      <div
        className={`font-nacelle mt-1.5 text-2xl font-bold ${
          tone === "danger"
            ? "text-brand-brick-red-400"
            : "text-brand-alabaster-grey-100"
        }`}
      >
        {value}
      </div>
      <span className="text-brand-alabaster-grey-600 text-xs">{sub}</span>
    </div>
  );
}
