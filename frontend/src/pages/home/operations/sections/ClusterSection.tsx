import type { ConsoleData } from "../operationsTypes.ts";
import SectionCard from "../SectionCard.tsx";
import StatCard from "../StatCard.tsx";
import { formatDateTime } from "../../api.ts";

export default function ClusterSection({ data }: { data: ConsoleData }) {
  const history = data.clusterHistory ?? [];
  const totalTasks = history.reduce((sum, run) => sum + run.tasks, 0);
  const avgElapsed =
    history.length > 0
      ? history.reduce((sum, run) => sum + run.elapsed_time_seconds, 0) /
        history.length
      : 0;
  const lastRun = history[0];

  const projections = data.clusterComparison?.projections ?? [];

  return (
    <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
      <SectionCard
        title="MPI history"
        subtitle="Last distributed runs from /cluster/mpi/history."
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Runs"
            value={String(history.length)}
            detail="From /cluster/mpi/history"
          />
          <StatCard
            label="Total tasks"
            value={String(totalTasks)}
            detail="Across recent runs"
          />
          <StatCard
            label="Avg time"
            value={`${avgElapsed.toFixed(2)}s`}
            detail="Average elapsed time"
          />
          <StatCard
            label="Last pi"
            value={lastRun ? lastRun.calculated_pi.toFixed(6) : "N/A"}
            detail="Most recent estimate"
          />
        </div>

        <div className="mt-4 space-y-3">
          {history.length > 0 ? (
            history.map((run) => (
              <article
                key={run.id}
                className="bg-brand-carbon-black-800/60 border-brand-carbon-black-700 rounded-xl border p-4"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="text-brand-alabaster-grey-100 font-medium">
                      {run.tasks} / {run.intervals} tasks
                    </div>
                    <div className="text-brand-alabaster-grey-600 text-xs">
                      {formatDateTime(run.executed_at)}
                    </div>
                  </div>
                  <div className="flex gap-6 lg:text-right">
                    <div>
                      <div className="text-brand-alabaster-grey-600 text-[11px] tracking-[0.18em] uppercase">
                        Time
                      </div>
                      <div className="text-brand-alabaster-grey-100 mt-1 font-semibold tabular-nums">
                        {run.elapsed_time_seconds.toFixed(2)}s
                      </div>
                    </div>
                    <div>
                      <div className="text-brand-alabaster-grey-600 text-[11px] tracking-[0.18em] uppercase">
                        Pi
                      </div>
                      <div className="text-brand-alabaster-grey-100 mt-1 font-semibold tabular-nums">
                        {run.calculated_pi.toFixed(6)}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <div className="text-brand-alabaster-grey-600 border-brand-carbon-black-700 rounded-xl border border-dashed px-4 py-3 text-sm">
              No cluster runs available.
            </div>
          )}
        </div>
      </SectionCard>

      <SectionCard
        title="Scaling comparison"
        subtitle="Projected Amdahl and Gustafson performance from /cluster/mpi/scaling-comparison."
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <StatCard
            label="Parallel fraction"
            value={`${((data.clusterComparison?.parallel_fraction ?? 0) * 100).toFixed(1)}%`}
            detail="Estimated parallel share"
          />
          <StatCard
            label="Max procs"
            value={String(data.clusterComparison?.max_procs ?? 0)}
            detail="Upper bound modeled"
          />
        </div>

        <div className="mt-4 space-y-3">
          {projections.length > 0 ? (
            projections.map((row) => (
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
            ))
          ) : (
            <div className="text-brand-alabaster-grey-600 border-brand-carbon-black-700 rounded-xl border border-dashed px-4 py-3 text-sm">
              No scaling projections available.
            </div>
          )}
        </div>
      </SectionCard>
    </div>
  );
}
