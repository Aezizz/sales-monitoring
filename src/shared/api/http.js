const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "/api";

// fallback: if env belum diset, asumsi API terproxy di path yang sama
if (!import.meta.env.VITE_API_BASE_URL) {
  console.warn("⚠️ VITE_API_BASE_URL is not set; using default '/api'");
}

// Helpful debug: make it visible in browser console which base URL is used
console.log("🌐 apiRequest base:", API_BASE_URL || "/(relative)");

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("token");

  const url = `${API_BASE_URL}${path}`;
  console.log("➡️ apiRequest:", { path, apiBase: API_BASE_URL, url });

  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // IMPORTANT: response body can only be read once.
    // Use text first, then attempt to parse JSON.
    const raw = await response.text();

    let message = "";
    try {
      const data = JSON.parse(raw);
      message = data?.message;
    } catch (_) {
      message = raw;
    }

    throw new Error(message || `Request failed with status ${response.status}`);
  }

  // Handle downloadable files or empty JSON responses
  const contentType = response.headers.get("content-type");
  if (
    contentType &&
    (contentType.includes("application/pdf") ||
      contentType.includes("text/csv") ||
      contentType.includes("spreadsheetml"))
  ) {
    return response.blob();
  }

  try {
    return await response.json();
  } catch (_) {
    return null;
  }
}
