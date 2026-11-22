/**
 * Centralized API & WebSocket Configuration
 * 
 * Automatically sanitizes the configured API URL (handling markdown link artifacts,
 * extra slashes, etc.) and falls back to production Render backend when deployed.
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

  // In production (Vercel deployment), ensure we never try to call localhost or an empty URL
  if (import.meta.env.PROD) {
    if (!url || url.includes("localhost") || url.includes("127.0.0.1")) {
      return "https://freelancy-backend.onrender.com/api";
    }
  }

  return url || "http://localhost:4000/api";
}

export const API_BASE_URL = resolveApiBaseUrl();

/**
 * Root backend server origin (e.g. "https://freelancy-backend.onrender.com" or "http://localhost:4000")
 * Used for Socket.io and file media URLs.
 */
export const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");
export const SOCKET_BASE_URL = API_ORIGIN;
