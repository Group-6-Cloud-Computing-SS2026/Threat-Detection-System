import { severityClasses } from "../../api.ts";
import type { ConsoleData } from "../operationsTypes.ts";
import SectionCard from "../SectionCard.tsx";
import StatCard from "../StatCard.tsx";
import StatusBadge from "../StatusBadge.tsx";
import { bytesToHuman } from "../operationsUtils.ts";

export default function SummarySection({ data }: { data: ConsoleData }) {
  const severityRows = Object.entries(data.summary?.detection_stats.by_severity ?? {});
  const typeRows = Object.entries(data.summary?.detection_stats.by_type ?? {});

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
      <SectionCard
        title="Detection summary"
        subtitle="Aggregated counts from /dashboard/summary and /detections/statistics."
        action={<StatusBadge status={data.infra?.overall_status ?? "unknown"} />}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <StatCard
            label="Total events"
            value={String(data.summary?.detection_stats.total_events ?? 0)}
            detail="From dashboard summary"
          />
          <StatCard
            label="Unacknowledged"
            value={String(data.summary?.detection_stats.unacknowledged_count ?? 0)}
            detail="Needs operator review"
          />
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <div className="space-y-2">
            <div className="text-brand-alabaster-grey-100 text-sm font-semibold uppercase tracking-wide">
              By severity
            </div>
            {severityRows.length > 0 ? (
              severityRows.map(([level, count]) => (
                <div
                  key={level}
                  className="bg-brand-carbon-black-800/60 border-brand-carbon-black-700 flex items-center justify-between rounded-xl border px-4 py-3"
                >
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${severityClasses(level)}`}
                  >
                    {level}
                  </span>
                  <span className="text-brand-alabaster-grey-100 font-semibold tabular-nums">
                    {count}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-brand-alabaster-grey-600 rounded-xl border border-dashed border-brand-carbon-black-700 px-4 py-3 text-sm">
                No severity breakdown available.
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="text-brand-alabaster-grey-100 text-sm font-semibold uppercase tracking-wide">
              By event type
            </div>
            {typeRows.length > 0 ? (
              typeRows.slice(0, 6).map(([type, count]) => (
                <div
                  key={type}
                  className="bg-brand-carbon-black-800/60 border-brand-carbon-black-700 flex items-center justify-between rounded-xl border px-4 py-3"
                >
                  <span className="text-brand-alabaster-grey-300 text-sm">{type}</span>
                  <span className="text-brand-alabaster-grey-100 font-semibold tabular-nums">
                    {count}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-brand-alabaster-grey-600 rounded-xl border border-dashed border-brand-carbon-black-700 px-4 py-3 text-sm">
                No event-type breakdown available.
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Infrastructure snapshot"
        subtitle="Backend service status, node summary, and storage state."
        action={<StatusBadge status={data.infra?.overall_status ?? "unknown"} />}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="bg-brand-carbon-black-800/60 border-brand-carbon-black-700 rounded-xl border px-4 py-3">
            <div className="text-brand-alabaster-grey-600 text-[11px] uppercase tracking-[0.18em]">
              Database
            </div>
            <div className="mt-2">
              <StatusBadge status={data.infra?.database.status ?? "unknown"} />
            </div>
          </div>
          <div className="bg-brand-carbon-black-800/60 border-brand-carbon-black-700 rounded-xl border px-4 py-3">
            <div className="text-brand-alabaster-grey-600 text-[11px] uppercase tracking-[0.18em]">
              MinIO
            </div>
            <div className="mt-2">
              <StatusBadge status={data.infra?.minio.status ?? "unknown"} />
            </div>
          </div>
          <div className="bg-brand-carbon-black-800/60 border-brand-carbon-black-700 rounded-xl border px-4 py-3">
            <div className="text-brand-alabaster-grey-600 text-[11px] uppercase tracking-[0.18em]">
              MQTT
            </div>
            <div className="mt-2">
              <StatusBadge status={data.infra?.mqtt.status ?? "unknown"} />
            </div>
          </div>
          <div className="bg-brand-carbon-black-800/60 border-brand-carbon-black-700 rounded-xl border px-4 py-3">
            <div className="text-brand-alabaster-grey-600 text-[11px] uppercase tracking-[0.18em]">
              Storage
            </div>
            <div className="text-brand-alabaster-grey-100 mt-2 text-sm font-medium">
              {bytesToHuman(data.storage?.used_bytes)} used of{" "}
              {bytesToHuman(data.storage?.total_bytes)}
            </div>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
