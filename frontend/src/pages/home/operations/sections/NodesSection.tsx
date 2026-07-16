import type { ConsoleData } from "../operationsTypes.ts";
import SectionCard from "../SectionCard.tsx";
import StatCard from "../StatCard.tsx";
import StatusBadge from "../StatusBadge.tsx";
import { operationsErrorClass } from "../operationsUtils.ts";
import { formatDateTime } from "../../api.ts";

export default function NodesSection({
  data,
  error,
}: {
  data: ConsoleData;
  error?: string;
}) {
  const nodes = data.infra?.nodes ?? [];
  const onlineCount = nodes.filter(
    (node) => node.status.toLowerCase() === "online",
  ).length;
  const offlineCount = nodes.filter(
    (node) => node.status.toLowerCase() === "offline",
  ).length;
  const withHealthCount = nodes.filter((node) => node.health).length;

  return (
    <SectionCard
      title="Sensor nodes"
      subtitle="Cluster inventory with status, heartbeat, location, and latest health snapshot."
      action={<StatusBadge status={data.infra?.overall_status ?? "unknown"} />}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total nodes"
          value={String(nodes.length)}
          detail="From /infrastructure/status"
        />
        <StatCard
          label="Online"
          value={String(onlineCount)}
          detail="Currently active"
        />
        <StatCard
          label="Offline"
          value={String(offlineCount)}
          detail="Need attention"
        />
        <StatCard
          label="Health snapshots"
          value={String(withHealthCount)}
          detail="Nodes reporting health"
        />
      </div>

      <div className="mt-4 space-y-3">
        {nodes.length > 0 ? (
          nodes.map((node) => (
            <article
              key={node.id}
              className="bg-brand-carbon-black-800/60 border-brand-carbon-black-700 rounded-xl border p-4"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-brand-alabaster-grey-100 truncate font-medium">
                      {node.name}
                    </div>
                    <StatusBadge status={node.status} />
                  </div>
                  <div className="text-brand-alabaster-grey-600 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                    <span>{node.id}</span>
                    <span>{node.ip_address}</span>
                    <span>
                      Heartbeat{" "}
                      {node.last_heartbeat
                        ? formatDateTime(node.last_heartbeat)
                        : "N/A"}
                    </span>
                  </div>
                </div>

                <div className="lg:w-[16rem]">
                  {node.health ? (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <span className="bg-brand-carbon-black-700 rounded-full px-2 py-1 text-center">
                        CPU {node.health.cpu ?? "N/A"}%
                      </span>
                      <span className="bg-brand-carbon-black-700 rounded-full px-2 py-1 text-center">
                        MEM {node.health.memory ?? "N/A"}%
                      </span>
                      <span className="bg-brand-carbon-black-700 rounded-full px-2 py-1 text-center">
                        DISK {node.health.disk ?? "N/A"}%
                      </span>
                      <span className="bg-brand-carbon-black-700 rounded-full px-2 py-1 text-center">
                        TEMP {node.health.temp ?? "N/A"}C
                      </span>
                    </div>
                  ) : (
                    <span className="text-brand-alabaster-grey-600 text-sm">
                      No health snapshot
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="text-brand-alabaster-grey-600 border-brand-carbon-black-700 rounded-xl border border-dashed px-4 py-3 text-sm">
            No nodes available.
          </div>
        )}
      </div>
      {error ? (
        <div className={`${operationsErrorClass} mt-4`}>{error}</div>
      ) : null}
    </SectionCard>
  );
}
