import type { ConsoleData } from "../operationsTypes.ts";
import SectionCard from "../SectionCard.tsx";
import StatCard from "../StatCard.tsx";
import StatusBadge from "../StatusBadge.tsx";
import { formatDateTime } from "../../api.ts";

export default function AuthSection({ data }: { data: ConsoleData }) {
  return (
    <SectionCard
      title="Authenticated user"
      subtitle="Profile returned by /auth/me and the account metadata that drives the session."
      action={<StatusBadge status={data.auth?.role ?? "unknown"} />}
    >
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Username"
          value={data.auth?.username ?? "N/A"}
          detail="Current session"
        />
        <StatCard
          label="Email"
          value={data.auth?.email ?? "N/A"}
          detail="Account contact"
        />
        <StatCard
          label="Active"
          value={data.auth?.is_active ? "Yes" : "No"}
          detail="Enabled state"
        />
        <StatCard
          label="Role"
          value={data.auth?.role ?? "N/A"}
          detail="Authorization scope"
        />
        <StatCard
          label="Created"
          value={data.auth ? formatDateTime(data.auth.created_at) : "N/A"}
          detail="Registration"
        />
        <StatCard
          label="Updated"
          value={data.auth ? formatDateTime(data.auth.updated_at) : "N/A"}
          detail="Last change"
        />
      </div>
    </SectionCard>
  );
}
