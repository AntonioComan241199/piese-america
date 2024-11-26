import { store } from "../redux/store/store";
import { logout, setToken } from "../slices/authSlice";

export const fetchWithAuth = async (url, options = {}) => {
  const state = store.getState();
  const token = state.auth.token;
  const refreshToken = state.auth.refreshToken;

  if (!token) throw new Error("No access token available");

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401 && refreshToken) {
      // Încercare de reîmprospătare a token-ului
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

      // Actualizează token-ul în Redux
      store.dispatch(setToken({ token: refreshData.accessToken }));

      // Reface cererea originală cu noul token
      const retryResponse = await fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${refreshData.accessToken}`,
        },
      });

      if (!retryResponse.ok) {
        throw new Error(`Error: ${retryResponse.status}`);
      }

      return retryResponse.json();
    }

    // Dacă răspunsul inițial este ok
    if (!response.ok) {
      throw new Error(`Error: ${response.status}`);
    }

    return response.json();
  } catch (err) {
    console.error("fetchWithAuth error:", err.message);
    throw new Error(err.message || "Unknown error occurred");
  }
};
