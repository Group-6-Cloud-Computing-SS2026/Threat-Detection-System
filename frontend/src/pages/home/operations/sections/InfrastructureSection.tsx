import type { ConsoleData } from "../operationsTypes.ts";
import SectionCard from "../SectionCard.tsx";
import StatCard from "../StatCard.tsx";
import StatusBadge from "../StatusBadge.tsx";

function bytesToHuman(value: number | undefined) {
  if (value === undefined) return "N/A";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let current = value;
  let unit = 0;
  while (current >= 1024 && unit < units.length - 1) {
    current /= 1024;
    unit += 1;
  }
  return `${current.toFixed(current >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}

export default function InfrastructureSection({
  data,
}: {
  data: ConsoleData;
}) {
  return (
    <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
      <SectionCard
        title="Service health"
        subtitle="Backend services from /infrastructure/services."
      >
        <div className="space-y-3">
          {(data.services ?? []).map((service) => (
            <div
              key={service.name}
              className="bg-brand-carbon-black-800/60 border-brand-carbon-black-700 flex items-start justify-between gap-4 rounded-xl border px-4 py-3"
            >
              <div>
                <div className="text-brand-alabaster-grey-100 font-medium">
                  {service.name}
                </div>
                <div className="text-brand-alabaster-grey-600 mt-1 text-xs">
                  {service.host ?? service.endpoint ?? "No host available"}
                  {service.port ? `:${service.port}` : ""}
                </div>
              </div>
              <StatusBadge status={service.status} />
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard
        title="Storage and cluster"
        subtitle="Infrastructure status plus MinIO usage and node summaries."
        action={<StatusBadge status={data.infra?.overall_status ?? "unknown"} />}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <StatCard
            label="Total nodes"
            value={String(data.infra?.nodes_summary.total ?? 0)}
            detail="From infrastructure status"
          />
          <StatCard
            label="Online nodes"
            value={String(data.infra?.nodes_summary.online ?? 0)}
            detail="Currently active"
          />
          <StatCard
            label="Offline nodes"
            value={String(data.infra?.nodes_summary.offline ?? 0)}
            detail="Need attention"
          />
          <StatCard
            label="Maintenance"
            value={String(data.infra?.nodes_summary.maintenance ?? 0)}
            detail="Intentionally held back"
          />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <StatCard
            label="MinIO status"
            value={data.storage?.status ?? data.infra?.minio.status ?? "unknown"}
            detail={data.infra?.minio.endpoint ?? "Object storage endpoint"}
          />
          <StatCard
            label="Storage used"
            value={bytesToHuman(data.storage?.used_bytes ?? data.infra?.minio.used_bytes)}
            detail={`${data.storage?.used_percent ?? data.infra?.minio.used_percent ?? 0}% used`}
          />
        </div>
      </SectionCard>
    </div>
  );
}
