import type { ConsoleData } from "../operationsTypes.ts";
import RawDetails from "../RawDetails.tsx";
import SectionCard from "../SectionCard.tsx";
import StatCard from "../StatCard.tsx";
import StatusBadge from "../StatusBadge.tsx";
import { operationsErrorClass } from "../operationsUtils.ts";
import { formatDateTime } from "../../api.ts";

export default function NotificationsSection({
  data,
  error,
}: {
  data: ConsoleData;
  error?: string;
}) {
  return (
    <SectionCard
      title="Notifications"
      subtitle="Delivery status, retry counts, and payload summaries from /notifications."
      action={<StatusBadge status={`${data.summary?.unread_notifications ?? 0} unread`} />}
    >
      <div className="space-y-3">
        {(data.notifications?.items ?? []).map((item) => (
          <details
            key={item.id}
            className="bg-brand-carbon-black-800/50 border-brand-carbon-black-700 overflow-hidden rounded-xl border"
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3">
              <div className="flex items-center gap-3">
                <StatusBadge status={item.status} />
                <span className="text-brand-alabaster-grey-100 text-sm font-medium">
                  {item.notification_type}
                </span>
              </div>
              <span className="text-brand-alabaster-grey-600 text-xs">
                {item.channel} · retries {item.retry_count}
              </span>
            </summary>
            <div className="border-brand-carbon-black-700 border-t space-y-3 p-4">
              <p className="text-brand-alabaster-grey-300 text-sm">
                {item.message_body}
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <StatCard
                  label="Sent at"
                  value={item.sent_at ? formatDateTime(item.sent_at) : "N/A"}
                  detail="Dispatch time"
                />
                <StatCard
                  label="Created at"
                  value={formatDateTime(item.created_at)}
                  detail="Record creation"
                />
                <StatCard
                  label="Detection ref"
                  value={item.detection_event_id ?? "none"}
                  detail="Linked event"
                />
              </div>
              {item.response_data ? (
                <RawDetails label="Response data" value={item.response_data} />
              ) : null}
            </div>
          </details>
        ))}
      </div>
      {error ? (
        <div className={`${operationsErrorClass} mt-4`}>
          {error}
        </div>
      ) : null}
    </SectionCard>
  );
}
