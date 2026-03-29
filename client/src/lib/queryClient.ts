import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getToken, refreshAccessToken, clearToken } from "./auth";

const API_BASE = ".";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

/** Build auth headers, attaching the JWT access token when available. */
function authHeaders(extra?: Record<string, string>): Record<string, string> {
  const token = getToken();
  return {
    ...(extra || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/** Handle a 401 response — attempt token refresh, then redirect to login. */
async function handle401(): Promise<void> {
  const refreshed = await refreshAccessToken();
  if (!refreshed) {
    clearToken();
    window.location.hash = "#/login";
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  const headers = authHeaders(data ? { "Content-Type": "application/json" } : {});

  let res = await fetch(`${API_BASE}${url}`, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  // Attempt a single token refresh on 401
  if (res.status === 401) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      res = await fetch(`${API_BASE}${url}`, {
        method,
        headers: authHeaders(data ? { "Content-Type": "application/json" } : {}),
        body: data ? JSON.stringify(data) : undefined,
      });
    } else {
      clearToken();
      window.location.hash = "#/login";
    }
  }

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    const path = queryKey.join("/").replace(/\/\/+/g, "/");

    let res = await fetch(`${API_BASE}${path}`, { headers: authHeaders() });

    // Attempt a single token refresh on 401
    if (res.status === 401) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        res = await fetch(`${API_BASE}${path}`, { headers: authHeaders() });
      } else {
        clearToken();
        window.location.hash = "#/login";
        if (unauthorizedBehavior === "returnNull") return null;
        throw new Error("401: Unauthorized");
      }
    }

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
