export function resolveApiOrigin(apiBaseUrl: string) {
  const trimmed = apiBaseUrl.replace(/\/api\/v1\/?$/, "").replace(/\/$/, "");
  if (!trimmed) return window.location.origin;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `${window.location.origin}${trimmed.startsWith("/") ? trimmed : `/${trimmed}`}`;
}

export function bytesToHuman(value: number | undefined) {
  if (value === undefined) return "N/A";
  const units = ["B", "KB", "MB", "GB", "TB"];
  let current = value;
  let unit = 0;
  while (current >= 1024 && unit < units.length - 1) {
    current /= 1024;
    unit += 1;
  }
  return `${current.toFixed(current >= 10 || unit === 0 ? 0 : 1)} ${units[unit]}`;
}

export function buildMetricsPreview(raw: string) {
  return raw
    .split("\n")
    .filter((line) => line && !line.startsWith("#"))
    .slice(0, 18)
    .join("\n");
}

