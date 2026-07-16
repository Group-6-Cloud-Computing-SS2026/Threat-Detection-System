import { buildImageUrl, formatDateTime, severityClasses } from "../../api.ts";
import type { ConsoleData } from "../operationsTypes.ts";
import SectionCard from "../SectionCard.tsx";
import StatCard from "../StatCard.tsx";
import StatusBadge from "../StatusBadge.tsx";
import { operationsErrorClass } from "../operationsUtils.ts";

export default function DetectionsSection({
  data,
  apiBaseUrl,
  error,
}: {
  data: ConsoleData;
  apiBaseUrl: string;
  error?: string;
}) {
  const detections = data.detections ?? [];
  const acknowledgedCount = detections.filter(
    (item) => item.acknowledged,
  ).length;
  const highSeverityCount = detections.filter((item) =>
    ["high", "critical"].includes(item.severity.toLowerCase()),
  ).length;

  return (
    <SectionCard
      title="Recent detections"
      subtitle="Latest events from /detections/recent with preview images and acknowledgement state."
      action={
        <StatusBadge
          status={String(
            data.summary?.detection_stats.unacknowledged_count ?? 0,
          )}
        />
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Recent items"
          value={String(detections.length)}
          detail="From /detections/recent"
        />
        <StatCard
          label="Unacknowledged"
          value={String(
            data.summary?.detection_stats.unacknowledged_count ?? 0,
          )}
          detail="Needs operator review"
        />
        <StatCard
          label="Acknowledged"
          value={String(acknowledgedCount)}
          detail="Already reviewed"
        />
        <StatCard
          label="High severity"
          value={String(highSeverityCount)}
          detail="High and critical events"
        />
      </div>

      <div className="mt-4 space-y-3">
        {detections.length > 0 ? (
          detections.map((item) => (
            <article
              key={item.id}
              className="bg-brand-carbon-black-800/60 border-brand-carbon-black-700 rounded-xl border p-4"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                <div className="flex min-w-0 flex-1 items-start gap-3">
                  {item.preview_image_url ? (
                    <img
                      src={
                        buildImageUrl(item.preview_image_url, apiBaseUrl) ??
                        item.preview_image_url
                      }
                      alt=""
                      className="h-16 w-20 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="bg-brand-carbon-black-700 text-brand-alabaster-grey-600 flex h-16 w-20 shrink-0 items-center justify-center rounded-lg text-[10px]">
                      No image
                    </div>
                  )}

                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-brand-alabaster-grey-100 truncate font-medium">
                        {item.event_type}
                      </div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${severityClasses(item.severity)}`}
                      >
                        {item.severity}
                      </span>
                      <StatusBadge
                        status={item.acknowledged ? "acknowledged" : "pending"}
                      />
                    </div>
                    <div className="text-brand-alabaster-grey-600 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                      <span>{item.id}</span>
                      <span>Detected {formatDateTime(item.detected_at)}</span>
                    </div>
                  </div>
                </div>

                <div className="grid min-w-[12rem] grid-cols-2 gap-2 sm:min-w-[14rem]">
                  <div>
                    <div className="text-brand-alabaster-grey-600 text-[11px] tracking-[0.18em] uppercase">
                      Confidence
                    </div>
                    <div className="text-brand-alabaster-grey-100 mt-1 text-lg font-semibold tabular-nums">
                      {(item.confidence * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-brand-alabaster-grey-600 text-[11px] tracking-[0.18em] uppercase">
                      Sensor
                    </div>
                    <div className="text-brand-alabaster-grey-100 mt-1 truncate text-sm font-medium">
                      {item.sensor_node_id}
                    </div>
                  </div>
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="text-brand-alabaster-grey-600 border-brand-carbon-black-700 rounded-xl border border-dashed px-4 py-3 text-sm">
            No detections available.
          </div>
        )}
      </div>
      {error ? (
        <div className={`${operationsErrorClass} mt-4`}>{error}</div>
      ) : null}
    </SectionCard>
  );
}
