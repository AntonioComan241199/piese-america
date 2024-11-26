import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isAuthenticated: false,
  user: null,
  token: null,
  refreshToken: null,
  loading: true, // Stare pentru încărcarea autentificării
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (state, action) => {
      state.isAuthenticated = true;
      state.user = {
        email: action.payload.email,
        role: action.payload.role,
        id: action.payload.id,
      };
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.loading = false; // Autentificarea este finalizată

      // Salvează token-urile în localStorage
      localStorage.setItem("token", action.payload.token);
      localStorage.setItem("refreshToken", action.payload.refreshToken);
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.loading = false; // Finalizează starea de încărcare

      // Șterge token-urile din localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
    },
    checkAuth: (state) => {
      const token = localStorage.getItem("token");
      const refreshToken = localStorage.getItem("refreshToken");

      if (token) {
        try {
          const payload = JSON.parse(atob(token.split(".")[1]));
          const currentTime = Math.floor(Date.now() / 1000);

          if (payload.exp > currentTime) {
            state.isAuthenticated = true;
            state.user = { email: payload.email, role: payload.role, id: payload.id };
            state.token = token;
            state.refreshToken = refreshToken;
          } else {
            // Token expirat
            state.isAuthenticated = false;
            state.user = null;
            state.token = null;
            state.refreshToken = refreshToken; // Poate fi folosit pentru reîmprospătare
          }
        } catch (error) {
          state.isAuthenticated = false;
          state.user = null;
          state.token = null;
          state.refreshToken = null;
        }
      } else {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
      }

      state.loading = false; // Finalizează starea de încărcare
    },
    setToken: (state, action) => {
      state.token = action.payload.token;
      localStorage.setItem("token", action.payload.token);
    },
  },
});

export const { login, logout, checkAuth, setToken } = authSlice.actions;
export default authSlice.reducer;
