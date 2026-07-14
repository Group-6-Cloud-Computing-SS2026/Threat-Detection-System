import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../api.ts";
import type { DetectionEvent, PaginatedResponse } from "../../../shared/types";
import type {
  ClusterProjection,
  ClusterRun,
  ConsoleData,
  DashboardSummary,
  InfrastructureStatus,
  NotificationItem,
  ServiceStatus,
  StorageStatus,
  SystemLog,
  UserProfile,
} from "./operationsTypes.ts";

export type ConsoleErrors = Record<string, string | undefined>;

export function useBackendConsole(
  apiBaseUrl: string,
  token: string | undefined,
) {
  const [data, setData] = useState<ConsoleData>({
    summary: null,
    detections: null,
    logs: null,
    notifications: null,
    infra: null,
    services: null,
    storage: null,
    clusterHistory: null,
    clusterComparison: null,
    auth: null,
    metrics: null,
  });
  const [errors, setErrors] = useState<ConsoleErrors>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const requests = [
      {
        key: "summary" as const,
        run: () =>
          apiFetch(apiBaseUrl, token, "/dashboard/summary") as Promise<DashboardSummary>,
      },
      {
        key: "detections" as const,
        run: () =>
          apiFetch(apiBaseUrl, token, "/detections/recent?limit=12") as Promise<DetectionEvent[]>,
      },
      {
        key: "logs" as const,
        run: () =>
          apiFetch(apiBaseUrl, token, "/logs?limit=20") as Promise<PaginatedResponse<SystemLog>>,
      },
      {
        key: "notifications" as const,
        run: () =>
          apiFetch(apiBaseUrl, token, "/notifications?limit=20") as Promise<PaginatedResponse<NotificationItem>>,
      },
      {
        key: "infra" as const,
        run: () =>
          apiFetch(apiBaseUrl, token, "/infrastructure/status") as Promise<InfrastructureStatus>,
      },
      {
        key: "services" as const,
        run: () => apiFetch(apiBaseUrl, token, "/infrastructure/services") as Promise<ServiceStatus[]>,
      },
      {
        key: "storage" as const,
        run: () => apiFetch(apiBaseUrl, token, "/infrastructure/storage") as Promise<StorageStatus>,
      },
      {
        key: "clusterHistory" as const,
        run: () => apiFetch(apiBaseUrl, token, "/cluster/mpi/history?limit=8") as Promise<ClusterRun[]>,
      },
      {
        key: "clusterComparison" as const,
        run: () =>
          apiFetch(
            apiBaseUrl,
            token,
            "/cluster/mpi/scaling-comparison?parallel_fraction=0.98&max_procs=8",
          ) as Promise<{
            parallel_fraction: number;
            max_procs: number;
            projections: ClusterProjection[];
          }>,
      },
      {
        key: "auth" as const,
        run: () => apiFetch(apiBaseUrl, token, "/auth/me") as Promise<UserProfile>,
      },
      {
        key: "metrics" as const,
        run: async () => {
          const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/metrics`, {
            headers: {
              accept: "text/plain",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          });
          if (!response.ok) {
            throw new Error(`Failed to load metrics: ${response.status}`);
          }
          return response.text();
        },
      },
    ];

    setLoading(true);
    setErrors({});

    const settled = await Promise.allSettled(requests.map((request) => request.run()));
    const nextData: Partial<ConsoleData> = {};
    const nextErrors: ConsoleErrors = {};

    settled.forEach((result, index) => {
      const key = requests[index].key;
      if (result.status === "fulfilled") {
        nextData[key] = result.value as never;
      } else {
        nextErrors[key] =
          result.reason instanceof Error ? result.reason.message : "Request failed";
      }
    });

    setData((current) => ({ ...current, ...nextData }));
    setErrors(nextErrors);
    setLoading(false);
  }, [apiBaseUrl, token]);

  useEffect(() => {
    void load();
  }, [load]);

  return { data, errors, loading, refresh: load };
}

