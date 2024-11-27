import { store } from "../redux/store/store";
import { logout, setToken } from "../slices/authSlice";

export const fetchWithAuth = async (url, options = {}, rawResponse = false) => {
  const state = store.getState();
  const token = state.auth.token;
  const refreshToken = state.auth.refreshToken;

  if (!token) throw new Error("No access token available");

  try {
    // Asigură-te că Content-Type este setat pentru cererile POST, PUT, PATCH
    const isBodyMethod = ["POST", "PUT", "PATCH"].includes(options.method?.toUpperCase());
    const defaultHeaders = {
      Authorization: `Bearer ${token}`,
      ...(isBodyMethod && { "Content-Type": "application/json" }), // Setează doar dacă metoda necesită corp
    };

    let response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers, // Permite suprascrierea headerelor
      },
    });

    // Gestionare token expirat
    if (response.status === 401 && refreshToken) {
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

      // Actualizează token-ul în Redux și localStorage
      store.dispatch(setToken({ token: refreshData.accessToken }));

      // Reface cererea originală cu noul token
      response = await fetch(url, {
        ...options,
        headers: {
          ...defaultHeaders,
          Authorization: `Bearer ${refreshData.accessToken}`, // Folosește noul token
        },
      });
    }

    // Dacă răspunsul trebuie returnat brut
    if (rawResponse) return response;

    // Procesare răspuns JSON
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || `Error: ${response.status}`);
    }

    return response.json();
  } catch (err) {
    console.error("fetchWithAuth error:", err.message);
    throw new Error(err.message || "Unknown error occurred");
  }
};
