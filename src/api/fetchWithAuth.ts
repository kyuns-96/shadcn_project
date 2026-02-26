import { store } from "@/store";
import { logout } from "@/store/reducers/authReducer";

/**
 * Authenticated fetch wrapper. Automatically attaches Bearer token and
 * dispatches logout on 401 so all API callers handle auth expiry uniformly.
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {},
): Promise<Response> {
  const token = store.getState().auth.token;
  const resp = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string> | undefined),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (resp.status === 401) {
    store.dispatch(logout());
    throw new Error("Session expired. Please log in again.");
  }

  return resp;
}
