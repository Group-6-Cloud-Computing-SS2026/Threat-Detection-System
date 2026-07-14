import type { ConsoleData } from "../operationsTypes.ts";
import LevelBadge from "../LevelBadge.tsx";
import SectionCard from "../SectionCard.tsx";
import { formatDateTime } from "../../api.ts";

export default function LogsSection({
  data,
  error,
}: {
  data: ConsoleData;
  error?: string;
}) {
  return (
    <SectionCard
      title="System logs"
      subtitle="Recent entries from /logs, including source, level, message, and context."
    >
      <div className="overflow-hidden rounded-xl border border-brand-carbon-black-700">
        <table className="w-full text-sm">
          <thead className="bg-brand-carbon-black-800">
            <tr>
              <th className="text-brand-alabaster-grey-300 px-4 py-3 text-left font-medium">
                Level
              </th>
              <th className="text-brand-alabaster-grey-300 px-4 py-3 text-left font-medium">
                Source
              </th>
              <th className="text-brand-alabaster-grey-300 px-4 py-3 text-left font-medium">
                Message
              </th>
              <th className="text-brand-alabaster-grey-300 px-4 py-3 text-left font-medium">
                Logged at
              </th>
            </tr>
          </thead>
          <tbody>
            {(data.logs?.items ?? []).map((item) => (
              <tr key={item.id} className="border-brand-carbon-black-700 border-t align-top">
                <td className="px-4 py-3">
                  <LevelBadge level={item.level} />
                </td>
                <td className="text-brand-alabaster-grey-300 px-4 py-3 text-sm">
                  {item.source}
                </td>
                <td className="px-4 py-3">
                  <div className="text-brand-alabaster-grey-100">{item.message}</div>
                  {item.context ? (
                    <details className="mt-2 text-xs">
                      <summary className="cursor-pointer text-brand-alabaster-grey-600">
                        Context
                      </summary>
                      <pre className="text-brand-alabaster-grey-200 mt-2 overflow-auto rounded-lg bg-black/20 p-3 whitespace-pre-wrap">
                        {JSON.stringify(item.context, null, 2)}
                      </pre>
                    </details>
                  ) : null}
                </td>
                <td className="text-brand-alabaster-grey-300 px-4 py-3">
                  {formatDateTime(item.logged_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {error ? (
        <div className="bg-brand-brick-red-950 text-brand-brick-red-300 mt-4 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      ) : null}
    </SectionCard>
  );
}
