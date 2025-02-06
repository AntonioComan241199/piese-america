import { store } from "../redux/store/store";
import { logout, setAccessToken } from "../slices/authSlice";

export const fetchWithAuth = async (url, options = {}, rawResponse = false) => {
  const state = store.getState();
  let accessToken = state.auth.accessToken;
  const refreshToken = state.auth.refreshToken;

  if (!accessToken) {
    if (refreshToken) {
      try {
        const refreshResponse = await fetch("http://localhost:5000/api/auth/refresh-token", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: refreshToken }),
        });

        if (!refreshResponse.ok) {
          console.error("Refresh token invalid. Logging out...");
          
          if (refreshResponse.status === 401 || refreshResponse.status === 400) {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            store.dispatch(logout());
          }

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
    } else {
      store.dispatch(logout());
      throw new Error("No access token available");
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      method: options.method?.toUpperCase() || "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        ...(options.headers || {}),
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.error("Unauthorized request. Logging out...");
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        store.dispatch(logout());
        throw new Error("Unauthorized. Please log in again.");
      }

      const errorData = await response.json();
      throw new Error(errorData.message || `Error: ${response.status}`);
    }

    return rawResponse ? response : response.json();
  } catch (err) {
    console.error("fetchWithAuth error:", err.message);
    throw new Error(err.message || "Unknown error occurred");
  }
};
