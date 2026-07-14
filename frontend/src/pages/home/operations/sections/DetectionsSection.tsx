import { buildImageUrl, formatDateTime, severityClasses } from "../../api.ts";
import type { ConsoleData } from "../operationsTypes.ts";
import SectionCard from "../SectionCard.tsx";
import StatusBadge from "../StatusBadge.tsx";

export default function DetectionsSection({
  data,
  apiBaseUrl,
  error,
}: {
  data: ConsoleData;
  apiBaseUrl: string;
  error?: string;
}) {
  return (
    <SectionCard
      title="Recent detections"
      subtitle="Latest events from /detections/recent with preview images and acknowledgement state."
      action={
        <StatusBadge
          status={String(data.summary?.detection_stats.unacknowledged_count ?? 0)}
        />
      }
    >
      <div className="overflow-hidden rounded-xl border border-brand-carbon-black-700">
        <table className="w-full text-sm">
          <thead className="bg-brand-carbon-black-800">
            <tr>
              <th className="text-brand-alabaster-grey-300 px-4 py-3 text-left font-medium">
                Event
              </th>
              <th className="text-brand-alabaster-grey-300 px-4 py-3 text-left font-medium">
                Severity
              </th>
              <th className="text-brand-alabaster-grey-300 px-4 py-3 text-left font-medium">
                Confidence
              </th>
              <th className="text-brand-alabaster-grey-300 px-4 py-3 text-left font-medium">
                Acknowledged
              </th>
              <th className="text-brand-alabaster-grey-300 px-4 py-3 text-left font-medium">
                Detected at
              </th>
            </tr>
          </thead>
          <tbody>
            {(data.detections ?? []).map((item) => (
              <tr key={item.id} className="border-brand-carbon-black-700 border-t">
                <td className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    {item.preview_image_url ? (
                      <img
                        src={
                          buildImageUrl(item.preview_image_url, apiBaseUrl) ??
                          item.preview_image_url
                        }
                        alt=""
                        className="h-12 w-16 shrink-0 rounded-md object-cover"
                      />
                    ) : (
                      <div className="bg-brand-carbon-black-800 h-12 w-16 shrink-0 rounded-md" />
                    )}
                    <div>
                      <div className="text-brand-alabaster-grey-100 font-medium">
                        {item.event_type}
                      </div>
                      <div className="text-brand-alabaster-grey-600 text-xs">
                        {item.id}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${severityClasses(item.severity)}`}
                  >
                    {item.severity}
                  </span>
                </td>
                <td className="text-brand-alabaster-grey-300 px-4 py-3 tabular-nums">
                  {(item.confidence * 100).toFixed(1)}%
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={item.acknowledged ? "acknowledged" : "pending"} />
                </td>
                <td className="text-brand-alabaster-grey-300 px-4 py-3">
                  {formatDateTime(item.detected_at)}
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
