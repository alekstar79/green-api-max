export const DEFAULT_API_BASE_URL = "https://api.green-api.com/v3";

export function resolveApiBaseUrl(configuredUrl?: string): string {
  const apiUrl = configuredUrl ?? DEFAULT_API_BASE_URL;
  return (apiUrl.trim() || DEFAULT_API_BASE_URL).replace(/\/+$/, "");
}

export const API_BASE_URL = resolveApiBaseUrl(import.meta.env.VITE_API_URL);