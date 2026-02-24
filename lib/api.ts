/**
 * Centralized API client.
 * - Sends credentials (cookies) with every request.
 * - Handles 401 globally (redirect to login).
 * - Typed request/response.
 * - Uses env-based backend URL (dev vs production).
 */

const isDev = process.env.NODE_ENV === "development";
const API_BASE =
  (isDev ? process.env.NEXT_PUBLIC_API_URL_DEV : process.env.NEXT_PUBLIC_API_URL) ??
  process.env.NEXT_PUBLIC_API_URL ??
  process.env.NEXT_PUBLIC_API_URL_DEV ??
  "";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public body?: unknown
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const fullUrl = url.startsWith("http") ? url : `${API_BASE}${url}`;

  const res = await fetch(fullUrl, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (res.status === 401) {
    if (typeof window !== "undefined") {
      // Clear panel cookie first to break redirect loop (middleware won't redirect back to dashboard)
      await fetch("/api/auth/clear-cookie", { method: "POST", credentials: "include" }).catch(() => {});
      window.location.href = "/login";
    }
    throw new ApiError("Unauthorized", 401);
  }

  if (!res.ok) {
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      body = await res.text();
    }
    throw new ApiError(
      (body as { message?: string })?.message ?? res.statusText,
      res.status,
      body
    );
  }

  const contentType = res.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    return res.json() as Promise<T>;
  }
  return res.text() as Promise<T>;
}

export const api = {
  get: <T>(url: string) => apiRequest<T>(url, { method: "GET" }),
  post: <T>(url: string, data?: unknown) =>
    apiRequest<T>(url, { method: "POST", body: data ? JSON.stringify(data) : undefined }),
  put: <T>(url: string, data?: unknown) =>
    apiRequest<T>(url, { method: "PUT", body: data ? JSON.stringify(data) : undefined }),
  patch: <T>(url: string, data?: unknown) =>
    apiRequest<T>(url, { method: "PATCH", body: data ? JSON.stringify(data) : undefined }),
  delete: <T>(url: string) => apiRequest<T>(url, { method: "DELETE" }),
};
