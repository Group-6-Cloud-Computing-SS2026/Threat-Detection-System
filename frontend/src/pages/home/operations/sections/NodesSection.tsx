import type { ConsoleData } from "../operationsTypes.ts";
import SectionCard from "../SectionCard.tsx";
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
  return (
    <SectionCard
      title="Sensor nodes"
      subtitle="Cluster inventory with status, heartbeat, location, and latest health snapshot."
      action={<StatusBadge status={data.infra?.overall_status ?? "unknown"} />}
    >
      <div className="overflow-hidden rounded-xl border border-brand-carbon-black-700">
        <table className="w-full text-sm">
          <thead className="bg-brand-carbon-black-800">
            <tr>
              <th className="text-brand-alabaster-grey-300 px-4 py-3 text-left font-medium">
                Node
              </th>
              <th className="text-brand-alabaster-grey-300 px-4 py-3 text-left font-medium">
                Status
              </th>
              <th className="text-brand-alabaster-grey-300 px-4 py-3 text-left font-medium">
                Heartbeat
              </th>
              <th className="text-brand-alabaster-grey-300 px-4 py-3 text-left font-medium">
                Health
              </th>
              <th className="text-brand-alabaster-grey-300 px-4 py-3 text-left font-medium">
                IP
              </th>
            </tr>
          </thead>
          <tbody>
            {(data.infra?.nodes ?? []).map((node) => (
              <tr key={node.id} className="border-brand-carbon-black-700 border-t align-top">
                <td className="px-4 py-3">
                  <div className="text-brand-alabaster-grey-100 font-medium">
                    {node.name}
                  </div>
                  <div className="text-brand-alabaster-grey-600 text-xs">{node.id}</div>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={node.status} />
                </td>
                <td className="text-brand-alabaster-grey-300 px-4 py-3">
                  {node.last_heartbeat ? formatDateTime(node.last_heartbeat) : "N/A"}
                </td>
                <td className="px-4 py-3">
                  {node.health ? (
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <span className="bg-brand-carbon-black-800 rounded-full px-2 py-1">
                        CPU {node.health.cpu ?? "N/A"}%
                      </span>
                      <span className="bg-brand-carbon-black-800 rounded-full px-2 py-1">
                        MEM {node.health.memory ?? "N/A"}%
                      </span>
                      <span className="bg-brand-carbon-black-800 rounded-full px-2 py-1">
                        DISK {node.health.disk ?? "N/A"}%
                      </span>
                      <span className="bg-brand-carbon-black-800 rounded-full px-2 py-1">
                        TEMP {node.health.temp ?? "N/A"}C
                      </span>
                    </div>
                  ) : (
                    <span className="text-brand-alabaster-grey-600 text-sm">
                      No health snapshot
                    </span>
                  )}
                </td>
                <td className="text-brand-alabaster-grey-300 px-4 py-3">
                  {node.ip_address}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {error ? (
        <div className={`${operationsErrorClass} mt-4`}>
          {error}
        </div>
      ) : null}
    </SectionCard>
  );
}
