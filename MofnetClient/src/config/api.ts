export const ONLINE_API_URL = "http://192.168.254.6:8000";
export const OFFLINE_API_URL = "http://192.168.4.2:8000";

export function getApiBaseUrl(): string {
  return ONLINE_API_URL;
}

export function getFallbackApiUrl(): string {
  return OFFLINE_API_URL;
}
