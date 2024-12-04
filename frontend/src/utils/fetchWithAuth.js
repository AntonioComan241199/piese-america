import { store } from "../redux/store/store";
import { logout, setAccessToken } from "../slices/authSlice";

export const fetchWithAuth = async (url, options = {}, rawResponse = false) => {
  const state = store.getState();
  let accessToken = state.auth.accessToken;
  const refreshToken = state.auth.refreshToken;

  if (!accessToken && refreshToken) {
    try {
      const refreshResponse = await fetch("http://localhost:5000/api/auth/refresh-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: refreshToken }),
      });

      if (!refreshResponse.ok) {
        store.dispatch(logout());
        throw new Error("Session expired. Please log in again.");
      }

      const refreshData = await refreshResponse.json();
      store.dispatch(setAccessToken({ accessToken: refreshData.accessToken }));
      accessToken = refreshData.accessToken;
    } catch (err) {
      console.error("Failed to refresh token:", err.message);
      store.dispatch(logout());
      throw new Error("Failed to refresh token");
    }
  }

  if (!accessToken) {
    store.dispatch(logout());
    throw new Error("No access token available");
  }

  try {
    const method = options.method?.toUpperCase() || "GET";
    const isBodyMethod = ["POST", "PUT", "PATCH", "DELETE"].includes(method);
    const defaultHeaders = {
      Authorization: `Bearer ${accessToken}`,
      ...(isBodyMethod && { "Content-Type": "application/json" }),
    };

    const response = await fetch(url, {
      ...options,
      method,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        store.dispatch(logout());
        throw new Error("Unauthorized. Please log in again.");
      }

      const errorData = await response.json();
      throw new Error(errorData.message || `Error: ${response.status}`);
    }

    if (rawResponse) return response;
    return response.json();
  } catch (err) {
    console.error("fetchWithAuth error:", err.message);
    throw new Error(err.message || "Unknown error occurred");
  }
};