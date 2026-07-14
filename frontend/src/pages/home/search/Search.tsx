import { useState } from "react";
import { useAuth } from "../../auth/AuthContext.tsx";
import Button from "../../../shared/components/ui/Button.tsx";
import {
  apiFetch,
  buildQueryString,
  EMPTY_QUERY,
  SEVERITY_ORDER,
} from "../api.ts";
import DetectionCard from "../DetectionCard.tsx";
import type {
  CardState,
  DetectionEvent,
  PaginatedResponse,
  QueryState,
} from "../../../shared/types";
import { useApiSettings } from "../useApiSettings.ts";
import { homeInnerFrameClass } from "../homeSurface.ts";
import { toCardState, useDetectionDetailLoader } from "../useDetectionCards.ts";
import { PanelSkeleton } from "../PageLoaders.tsx";

const inputClass =
  "w-full rounded-lg border border-brand-carbon-black-700 bg-brand-carbon-black-800 px-3 py-2 text-sm text-brand-alabaster-grey-100 outline-none transition focus:border-brand-light-green-500";
const labelClass = "space-y-1.5 text-sm";
const labelTextClass = "text-brand-alabaster-grey-500";

export default function Search() {
  const { auth } = useAuth();
  const { apiBaseUrl } = useApiSettings();
  const token = auth?.token;

  const [filteredEvents, setFilteredEvents] = useState<CardState[]>([]);
  const [filterTotals, setFilterTotals] = useState({
    total: 0,
    skip: 0,
    limit: 50,
  });
  const [query, setQuery] = useState<QueryState>(EMPTY_QUERY);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const loadDetectionDetail = useDetectionDetailLoader(
    apiBaseUrl,
    token,
    setFilteredEvents,
    setSearchError,
  );

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
        data.items.map((item) => toCardState(item, apiBaseUrl)),
      );
      setFilterTotals({
        total: data.total,
        skip: data.skip,
        limit: data.limit,
      });
    } catch (error) {
      setSearchError(
        error instanceof Error ? error.message : "Failed to load detections",
      );
    } finally {
      setSearchLoading(false);
    }
  }

  function resetFilters() {
    setQuery(EMPTY_QUERY);
    setFilteredEvents([]);
    setFilterTotals({ total: 0, skip: 0, limit: 50 });
  }

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3" data-aos="fade-up">
        <div>
          <h2 className="font-nacelle text-brand-alabaster-grey-100 text-lg font-semibold">
            Search historical events
          </h2>
          <p className="text-brand-alabaster-grey-600 text-sm">
            Filter by event type, severity, sensor, time range, and
            acknowledgement status.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          type="button"
          onClick={resetFilters}
          className="cursor-pointer"
        >
          Clear filters
        </Button>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" data-aos="fade-up" data-aos-delay={100}>
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
              setQuery((current) => ({ ...current, skip: event.target.value }))
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
              setQuery((current) => ({ ...current, limit: event.target.value }))
            }
          />
        </label>
      </div>

      <div className="mb-4 flex flex-wrap gap-3" data-aos="fade-up" data-aos-delay={180}>
        <Button
          type="button"
          size="sm"
          onClick={() => void fetchFilteredEvents()}
        >
          {searchLoading ? "Searching..." : "Search detections"}
        </Button>
      </div>

      {searchError ? (
        <div className={`${homeInnerFrameClass} mb-4 rounded-lg px-3 py-2 text-sm text-brand-brick-red-300`}>
          {searchError}
        </div>
      ) : null}

      <div className="text-brand-alabaster-grey-600 mb-3 flex flex-col gap-1 text-xs sm:flex-row sm:items-center sm:justify-between" data-aos="fade-up" data-aos-delay={220}>
        <span>{filterTotals.total} result(s)</span>
        <span>Showing {filteredEvents.length} item(s)</span>
      </div>

      <div className="space-y-3" data-aos="fade-up" data-aos-delay={260}>
        {searchLoading && filteredEvents.length === 0 ? (
          <div className="bg-brand-carbon-black-800/60 rounded-lg px-4 py-4">
            <PanelSkeleton title="Searching detections" lines={4} />
          </div>
        ) : null}
        {filteredEvents.map((event) => (
          <DetectionCard
            key={event.id}
            event={event}
            listName="search"
            onToggle={() => void loadDetectionDetail(event.id, filteredEvents)}
          />
        ))}
        {filteredEvents.length === 0 && !searchLoading ? (
          <p className="text-brand-alabaster-grey-600 py-6 text-center text-sm">
            Run a search above to see results.
          </p>
        ) : null}
      </div>
    </>
  );
}
