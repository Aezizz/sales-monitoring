const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

// fallback: if env belum diset, asumsi API terproxy di path yang sama
if (!API_BASE_URL) {
  console.warn("⚠️ VITE_API_BASE_URL is not set; using relative path /api");
}

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("token");

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
    let message = "";
    try {
      const data = await response.json();
      message = data.message;
    } catch (_) {
      message = await response.text();
    }
    throw new Error(message || "Request failed");
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
