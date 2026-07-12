export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function api(path, options = {}) {
  const token = localStorage.getItem("accessToken");
  const headers = new Headers(options.headers || {});
  if (!(options.body instanceof FormData)) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
    credentials: "include"
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: response.statusText }));
    const error = new Error(errorBody.message || "Request failed");
    Object.assign(error, errorBody, { status: response.status });
    throw error;
  }
  if (response.status === 204) return null;
  return response.json();
}
