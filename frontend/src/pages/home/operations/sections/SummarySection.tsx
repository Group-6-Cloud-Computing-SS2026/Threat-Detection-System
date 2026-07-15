import { severityClasses } from "../../api.ts";
import type { ConsoleData } from "../operationsTypes.ts";
import SectionCard from "../SectionCard.tsx";
import StatCard from "../StatCard.tsx";
import StatusBadge from "../StatusBadge.tsx";
import { bytesToHuman } from "../operationsUtils.ts";

export default function SummarySection({ data }: { data: ConsoleData }) {
  const severityRows = Object.entries(
    data.summary?.detection_stats.by_severity ?? {},
  );
  const typeRows = Object.entries(data.summary?.detection_stats.by_type ?? {});

  return (
    <div className="grid gap-5 xl:grid-cols-[1fr_1fr]">
      <SectionCard
        title="Detection summary"
        subtitle="Aggregated counts from /dashboard/summary and /detections/statistics."
        action={
          <StatusBadge status={data.infra?.overall_status ?? "unknown"} />
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <StatCard
            label="Total events"
            value={String(data.summary?.detection_stats.total_events ?? 0)}
            detail="From dashboard summary"
          />
          <StatCard
            label="Unacknowledged"
            value={String(
              data.summary?.detection_stats.unacknowledged_count ?? 0,
            )}
            detail="Needs operator review"
          />
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <div className="space-y-2">
            <div className="text-brand-alabaster-grey-100 text-sm font-semibold tracking-wide uppercase">
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
              <div className="text-brand-alabaster-grey-600 border-brand-carbon-black-700 rounded-xl border border-dashed px-4 py-3 text-sm">
                No severity breakdown available.
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="text-brand-alabaster-grey-100 text-sm font-semibold tracking-wide uppercase">
              By event type
            </div>
            {typeRows.length > 0 ? (
              typeRows.slice(0, 6).map(([type, count]) => (
                <div
                  key={type}
                  className="bg-brand-carbon-black-800/60 border-brand-carbon-black-700 flex items-center justify-between rounded-xl border px-4 py-3"
                >
                  <span className="text-brand-alabaster-grey-300 text-sm">
                    {type}
                  </span>
                  <span className="text-brand-alabaster-grey-100 font-semibold tabular-nums">
                    {count}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-brand-alabaster-grey-600 border-brand-carbon-black-700 rounded-xl border border-dashed px-4 py-3 text-sm">
                No event-type breakdown available.
              </div>
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="Infrastructure snapshot"
        subtitle="Backend service status, node summary, and storage state."
        action={
          <StatusBadge status={data.infra?.overall_status ?? "unknown"} />
        }
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <StatCard
            label="Database"
            value={data.infra?.database.status ?? "unknown"}
            detail="Backend data store"
          />
          <StatCard
            label="MinIO"
            value={data.infra?.minio.status ?? "unknown"}
            detail={data.infra?.minio.endpoint ?? "Object storage endpoint"}
          />
          <StatCard
            label="MQTT"
            value={data.infra?.mqtt.status ?? "unknown"}
            detail={`${data.infra?.mqtt.broker_host ?? "Broker"}: ${data.infra?.mqtt.broker_port ?? 0}`}
          />
          <StatCard
            label="Storage"
            value={bytesToHuman(
              data.storage?.used_bytes ?? data.infra?.minio.used_bytes,
            )}
            detail={`${data.storage?.used_percent ?? data.infra?.minio.used_percent ?? 0}% used of ${bytesToHuman(data.storage?.total_bytes ?? data.infra?.minio.total_bytes)}`}
          />
        </div>
      </SectionCard>
    </div>
  );
}
