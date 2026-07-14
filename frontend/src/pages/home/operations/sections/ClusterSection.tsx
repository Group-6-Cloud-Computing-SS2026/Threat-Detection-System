import type { ConsoleData } from "../operationsTypes.ts";
import SectionCard from "../SectionCard.tsx";
import { formatDateTime } from "../../api.ts";

export default function ClusterSection({ data }: { data: ConsoleData }) {
  return (
    <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
      <SectionCard
        title="MPI history"
        subtitle="Last distributed runs from /cluster/mpi/history."
      >
        <div className="overflow-hidden rounded-xl border border-brand-carbon-black-700">
          <table className="w-full text-sm">
            <thead className="bg-brand-carbon-black-800">
              <tr>
                <th className="text-brand-alabaster-grey-300 px-4 py-3 text-left font-medium">
                  When
                </th>
                <th className="text-brand-alabaster-grey-300 px-4 py-3 text-left font-medium">
                  Tasks
                </th>
                <th className="text-brand-alabaster-grey-300 px-4 py-3 text-left font-medium">
                  Time
                </th>
                <th className="text-brand-alabaster-grey-300 px-4 py-3 text-left font-medium">
                  Pi
                </th>
              </tr>
            </thead>
            <tbody>
              {(data.clusterHistory ?? []).map((run) => (
                <tr key={run.id} className="border-brand-carbon-black-700 border-t">
                  <td className="text-brand-alabaster-grey-300 px-4 py-3">
                    {formatDateTime(run.executed_at)}
                  </td>
                  <td className="text-brand-alabaster-grey-300 px-4 py-3">
                    {run.tasks} / {run.intervals}
                  </td>
                  <td className="text-brand-alabaster-grey-300 px-4 py-3 tabular-nums">
                    {run.elapsed_time_seconds.toFixed(2)}s
                  </td>
                  <td className="text-brand-alabaster-grey-300 px-4 py-3 tabular-nums">
                    {run.calculated_pi.toFixed(6)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard
        title="Scaling comparison"
        subtitle="Projected Amdahl and Gustafson performance from /cluster/mpi/scaling-comparison."
      >
        <div className="space-y-3">
          {(data.clusterComparison?.projections ?? []).map((row) => (
            <div
              key={row.num_procs}
              className="bg-brand-carbon-black-800/60 border-brand-carbon-black-700 rounded-xl border px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-brand-alabaster-grey-100 font-medium">
                  {row.num_procs} procs
                </div>
                <div className="text-brand-light-green-300 text-sm font-semibold tabular-nums">
                  {row.theoretical_amdahl_speedup.toFixed(2)}x /{" "}
                  {row.theoretical_gustafson_speedup.toFixed(2)}x
                </div>
              </div>
              <div className="text-brand-alabaster-grey-600 mt-2 text-xs">
                Efficiency: {row.amdahl_efficiency_percent.toFixed(1)}% /{" "}
                {row.gustafson_efficiency_percent.toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
