/**
 * Centralized API & WebSocket Configuration
 * 
 * Automatically sanitizes and normalizes the API URL:
 * - Strips markdown link artifacts like [url](url)
 * - Strips trailing slashes
 * - Resolves duplicated or missing /api
 * - Guarantees that API_BASE_URL always ends with /api
 * - In production (Vercel deployment), falls back to the live Render backend
 */
function resolveApiBaseUrl() {
  const rawEnv = import.meta.env.VITE_API_BASE_URL;
  let url = typeof rawEnv === "string" ? rawEnv.trim() : "";

  // Extract clean URL if markdown link syntax [url](url) or wrapped in brackets/quotes
  if (url) {
    const markdownMatch = url.match(/https?:\/\/[^\s)\]"']+/);
    if (markdownMatch) {
      url = markdownMatch[0];
    }
  }

  // Remove trailing slashes
  url = url.replace(/\/+$/, "");

  // If duplicated /api/api, normalize to single
  while (url.endsWith("/api/api")) {
    url = url.slice(0, -4);
  }

  // In production (Vercel deployment), ensure we never try to call localhost or an empty URL
  if (import.meta.env.PROD) {
    if (!url || url.includes("localhost") || url.includes("127.0.0.1")) {
      url = "https://freelancy-backend.onrender.com";
    }
  }

  if (!url) {
    url = "http://localhost:4000";
  }

  // Guarantee that API_BASE_URL ends with /api
  if (!url.endsWith("/api")) {
    url = `${url}/api`;
  }

  return url;
}

export const API_BASE_URL = resolveApiBaseUrl();

/**
 * Root backend server origin (e.g. "https://freelancy-backend.onrender.com" or "http://localhost:4000")
 * Used for Socket.io and file media URLs.
 */
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");
export const SOCKET_BASE_URL = API_ORIGIN;

/**
 * Smart URL joiner that safely appends a path to the API base URL.
 * Guarantees that:
 * - /api is never duplicated (e.g. /api/api/auth/register)
 * - /api is never omitted (e.g. /auth/register)
 * - Leading slashes are handled cleanly
 * 
 * @param {string} path - E.g. "/auth/register", "auth/register", or "/api/auth/register"
 * @returns {string} Fully qualified URL
 */
export function buildApiUrl(path = "") {
  const cleanPath = String(path || "")
    .trim()
    .replace(/^\/?(api\/?)?/, "");

  return `${API_BASE_URL}/${cleanPath}`;
}
