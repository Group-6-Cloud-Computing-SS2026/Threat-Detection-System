import { useMemo, useState } from "react";
import { useAuth } from "../../auth/AuthContext.tsx";
import Button from "../../../shared/components/ui/Button.tsx";
import {
  IconActivity,
  IconBarChart,
  IconDocs,
  IconFileCode,
  IconSearch,
  IconSettings,
} from "../../../shared/components/ui/icons/NavIcons.tsx";
import { homePanelClass } from "../homeSurface.ts";
import { useApiSettings } from "../useApiSettings.ts";
import type { ConsoleSection, SectionNavItem } from "./operationsTypes.ts";
import { operationsErrorClass, resolveApiOrigin } from "./operationsUtils.ts";
import { useBackendConsole } from "./useBackendConsole.ts";
import SummarySection from "./sections/SummarySection.tsx";
import DetectionsSection from "./sections/DetectionsSection.tsx";
import LogsSection from "./sections/LogsSection.tsx";
import NodesSection from "./sections/NodesSection.tsx";
import NotificationsSection from "./sections/NotificationsSection.tsx";
import InfrastructureSection from "./sections/InfrastructureSection.tsx";
import ClusterSection from "./sections/ClusterSection.tsx";
import AuthSection from "./sections/AuthSection.tsx";
import MetricsSection from "./sections/MetricsSection.tsx";

const NAV_ITEMS: SectionNavItem[] = [
  {
    id: "summary",
    label: "Overview",
    icon: <IconActivity className="h-4 w-4" />,
  },
  {
    id: "detections",
    label: "Detections",
    icon: <IconSearch className="h-4 w-4" />,
  },
  { id: "logs", label: "Logs", icon: <IconFileCode className="h-4 w-4" /> },
  { id: "nodes", label: "Nodes", icon: <IconSettings className="h-4 w-4" /> },
  {
    id: "notifications",
    label: "Notifications",
    icon: <IconDocs className="h-4 w-4" />,
  },
  {
    id: "infrastructure",
    label: "Infrastructure",
    icon: <IconBarChart className="h-4 w-4" />,
  },
  {
    id: "cluster",
    label: "Cluster",
    icon: <IconBarChart className="h-4 w-4" />,
  },
  { id: "auth", label: "Auth", icon: <IconSettings className="h-4 w-4" /> },
  {
    id: "metrics",
    label: "Metrics",
    icon: <IconFileCode className="h-4 w-4" />,
  },
];

function HeaderStat({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <div className={`${homePanelClass} p-4`}>
      <div className="text-brand-alabaster-grey-600 text-[11px] tracking-[0.18em] uppercase">
        {label}
      </div>
      <div className="text-brand-alabaster-grey-100 mt-1 text-2xl font-semibold tabular-nums">
        {value}
      </div>
      <div className="text-brand-alabaster-grey-600 mt-1 text-xs">{detail}</div>
    </div>
  );
}

export default function OperationsPage() {
  const { auth } = useAuth();
  const { apiBaseUrl } = useApiSettings();
  const token = auth?.token;
  const apiOrigin = useMemo(() => resolveApiOrigin(apiBaseUrl), [apiBaseUrl]);
  const { data, errors, loading, refresh } = useBackendConsole(
    apiBaseUrl,
    token,
  );
  const [activeSection, setActiveSection] = useState<ConsoleSection>("summary");

  const overviewCards = useMemo(() => {
    const summary = data.summary;
    return [
      {
        label: "Detections",
        value: summary?.detection_stats.total_events ?? 0,
        detail: `${summary?.detection_stats.unacknowledged_count ?? 0} unacknowledged`,
      },
      {
        label: "Nodes",
        value:
          summary?.cluster_health.total_nodes ??
          data.infra?.nodes_summary.total ??
          0,
        detail: `${summary?.cluster_health.online_nodes ?? data.infra?.nodes_summary.online ?? 0} online`,
      },
      {
        label: "Notifications",
        value: summary?.unread_notifications ?? 0,
        detail: "Unread items",
      },
      {
        label: "Services",
        value:
          data.services?.filter((service) => service.status === "connected")
            .length ?? 0,
        detail: `${data.services?.length ?? 0} monitored`,
      },
    ];
  }, [data]);

  return (
    <div className="space-y-6">
      <section className={`${homePanelClass} p-5 md:p-6`} data-aos="fade-up">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-4 self-start">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-brand-light-green-300 bg-brand-light-green-950/70 border-brand-light-green-500/20 rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-[0.18em] uppercase">
                Backend console
              </span>
              <span className="text-brand-alabaster-grey-600 border-brand-carbon-black-700 bg-brand-carbon-black-800 rounded-full border px-2.5 py-1 text-[11px] font-medium">
                {loading ? "Refreshing" : "Live"}
              </span>
            </div>
            <div className="mb-8 space-y-2">
              <h1 className="text-brand-alabaster-grey-100 text-3xl font-semibold md:text-4xl">
                Backend operations
              </h1>
              <p className="text-brand-alabaster-grey-600 max-w-2xl text-sm md:text-base">
                Review detections, logs, nodes, notifications, infrastructure,
                cluster runs, your auth profile, and raw metrics in one place.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                className="cursor-pointer transition-transform hover:-translate-y-px"
                variant="secondary"
                href="/docs"
              >
                <IconDocs className="h-4 w-4" />
                Open API docs
              </Button>
              <Button
                className="cursor-pointer transition-transform hover:-translate-y-px"
                variant="secondary"
                href={`${apiOrigin}/docs`}
                target="_blank"
                rel="noreferrer"
              >
                <IconFileCode className="h-4 w-4" />
                Open Swagger UI
              </Button>
              <Button
                className="transition-transform hover:-translate-y-px"
                variant="secondary"
                onClick={() => void refresh()}
              >
                Refresh data
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:w-[34rem]">
            {overviewCards.map((card) => (
              <HeaderStat
                key={card.label}
                label={card.label}
                value={String(card.value)}
                detail={card.detail}
              />
            ))}
          </div>
        </div>
      </section>

      <section
        className={`${homePanelClass} p-4 md:p-5`}
        data-aos="fade-up"
        data-aos-delay={80}
      >
        <div className="flex flex-wrap gap-2 justify-center md:justify-between">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveSection(item.id)}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition hover:-translate-y-px ${
                activeSection === item.id
                  ? "border-brand-light-green-500/30 bg-brand-light-green-950/70 text-brand-light-green-300 hover:border-brand-light-green-400/50 hover:bg-brand-light-green-950/90"
                  : "border-brand-carbon-black-700 bg-brand-carbon-black-800 text-brand-alabaster-grey-500 hover:border-brand-carbon-black-500 hover:bg-brand-carbon-black-700 hover:text-brand-alabaster-grey-300"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {activeSection === "summary" ? <SummarySection data={data} /> : null}
      {activeSection === "detections" ? (
        <DetectionsSection
          data={data}
          apiBaseUrl={apiBaseUrl}
          error={errors.detections}
        />
      ) : null}
      {activeSection === "logs" ? (
        <LogsSection data={data} error={errors.logs} />
      ) : null}
      {activeSection === "nodes" ? (
        <NodesSection data={data} error={errors.nodes} />
      ) : null}
      {activeSection === "notifications" ? (
        <NotificationsSection data={data} error={errors.notifications} />
      ) : null}
      {activeSection === "infrastructure" ? (
        <InfrastructureSection data={data} />
      ) : null}
      {activeSection === "cluster" ? <ClusterSection data={data} /> : null}
      {activeSection === "auth" ? <AuthSection data={data} /> : null}
      {activeSection === "metrics" ? (
        <MetricsSection
          data={data}
          apiBaseUrl={apiBaseUrl}
          error={errors.metrics}
        />
      ) : null}

      {Object.values(errors).some(Boolean) ? (
        <div className={operationsErrorClass}>
          Some backend panels could not be loaded. The page keeps the sections
          that did succeed.
        </div>
      ) : null}
    </div>
  );
}
