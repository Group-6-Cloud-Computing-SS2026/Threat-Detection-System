import type { ConsoleData } from "../operationsTypes.ts";
import LevelBadge from "../LevelBadge.tsx";
import SectionCard from "../SectionCard.tsx";
import StatCard from "../StatCard.tsx";
import { operationsErrorClass } from "../operationsUtils.ts";
import { formatDateTime } from "../../api.ts";

export default function LogsSection({
  data,
  error,
}: {
  data: ConsoleData;
  error?: string;
}) {
  const logs = data.logs?.items ?? [];
  const errorCount = logs.filter((item) => item.level.toLowerCase() === "error").length;
  const warningCount = logs.filter((item) => item.level.toLowerCase() === "warn").length;
  const infoCount = logs.filter((item) => item.level.toLowerCase() === "info").length;

  return (
    <SectionCard
      title="System logs"
      subtitle="Recent entries from /logs, including source, level, message, and context."
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Log entries" value={String(logs.length)} detail="Recent /logs items" />
        <StatCard label="Errors" value={String(errorCount)} detail="Level = error" />
        <StatCard label="Warnings" value={String(warningCount)} detail="Level = warn" />
        <StatCard label="Info" value={String(infoCount)} detail="Level = info" />
      </div>

      <div className="mt-4 space-y-3">
        {logs.length > 0 ? (
          logs.map((item) => (
            <article
              key={item.id}
              className="bg-brand-carbon-black-800/60 border-brand-carbon-black-700 rounded-xl border p-4"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0 flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <LevelBadge level={item.level} />
                    <span className="text-brand-alabaster-grey-600 text-xs">
                      {item.source}
                    </span>
                  </div>
                  <div className="text-brand-alabaster-grey-100 text-sm leading-6">
                    {item.message}
                  </div>
                  {item.context ? (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-brand-alabaster-grey-600">
                        Context
                      </summary>
                      <pre className="text-brand-alabaster-grey-200 mt-2 overflow-auto rounded-lg bg-black/20 p-3 whitespace-pre-wrap">
                        {JSON.stringify(item.context, null, 2)}
                      </pre>
                    </details>
                  ) : null}
                </div>
                <div className="text-brand-alabaster-grey-600 shrink-0 text-xs">
                  {formatDateTime(item.logged_at)}
                </div>
              </div>
            </article>
          ))
        ) : (
          <div className="text-brand-alabaster-grey-600 rounded-xl border border-dashed border-brand-carbon-black-700 px-4 py-3 text-sm">
            No log entries available.
          </div>
        )}
      </div>
      {error ? (
        <div className={`${operationsErrorClass} mt-4`}>
          {error}
        </div>
      ) : null}
    </SectionCard>
  );
}
