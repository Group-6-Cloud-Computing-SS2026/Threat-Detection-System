import { useEffect, useState } from "react";
import { DEFAULT_API_BASE_URL } from "./api.ts";

const SETTINGS_STORAGE_KEY = "tds-detection-dashboard";

function loadApiBaseUrl(): string {
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (!raw) return DEFAULT_API_BASE_URL;
    const parsed = JSON.parse(raw) as { apiBaseUrl?: string };
    return parsed.apiBaseUrl?.trim() || DEFAULT_API_BASE_URL;
  } catch {
    return DEFAULT_API_BASE_URL;
  }
}

export function useApiSettings() {
  const [apiBaseUrl, setApiBaseUrl] = useState(loadApiBaseUrl);

  useEffect(() => {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify({ apiBaseUrl }));
  }, [apiBaseUrl]);

  function saveApiBaseUrl(next: string) {
    setApiBaseUrl(next.trim() || DEFAULT_API_BASE_URL);
  }

  return { apiBaseUrl, saveApiBaseUrl };
}
