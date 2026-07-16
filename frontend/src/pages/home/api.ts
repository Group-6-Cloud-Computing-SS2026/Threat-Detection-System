import type { QueryState } from "../../shared/types";

export const DEFAULT_API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "/api/v1";

export const SEVERITY_ORDER = ["critical", "high", "medium", "low"] as const;

export const EMPTY_QUERY: QueryState = {
  eventType: "",
  severity: "",
  sensorId: "",
  acknowledged: "",
  startTime: "",
  endTime: "",
  skip: "0",
  limit: "50",
};

export function formatDateTime(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

// Severity maps to brand accents: critical/high read as danger (red), low reads
// as safe (green), medium stays neutral rather than inventing an off-brand amber.
export function severityClasses(severity: string) {
  switch (severity.toLowerCase()) {
    case "critical":
      return "bg-brand-brick-red-950 text-brand-brick-red-300";
    case "high":
      return "bg-brand-brick-red-950/70 text-brand-brick-red-400";
    case "low":
      return "bg-brand-light-green-950 text-brand-light-green-400";
    case "medium":
    default:
      return "bg-brand-carbon-black-700 text-brand-alabaster-grey-400";
  }
}

export function buildImageUrl(
  previewUrl: string | null | undefined,
  apiBaseUrl: string,
): string | null {
  if (!previewUrl) return null;
  if (previewUrl.startsWith("http://") || previewUrl.startsWith("https://"))
    return previewUrl;
  // Relative path — prepend the API origin so the browser can reach it.
  const origin = apiBaseUrl.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "");
  return `${origin}${previewUrl}`;
}

export function buildQueryString(query: QueryState) {
  const params = new URLSearchParams();

  if (query.eventType.trim()) params.set("event_type", query.eventType.trim());
  if (query.severity.trim()) params.set("severity", query.severity.trim());
  if (query.sensorId.trim()) params.set("sensor_id", query.sensorId.trim());
  if (query.acknowledged !== "") params.set("acknowledged", query.acknowledged);
  if (query.startTime.trim()) params.set("start_time", query.startTime.trim());
  if (query.endTime.trim()) params.set("end_time", query.endTime.trim());
  params.set("skip", query.skip || "0");
  params.set("limit", query.limit || "50");

  return params.toString();
}

export async function apiFetch(
  apiBaseUrl: string,
  token: string | undefined,
  path: string,
  options?: RequestInit,
) {
  const headers = new Headers(options?.headers);
  headers.set("accept", "application/json");
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(`${response.status} ${message}`);
  }

  return response.json();
}
