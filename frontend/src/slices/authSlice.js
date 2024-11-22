import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isAuthenticated: false,
  user: null,
  token: null,
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
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      localStorage.removeItem("token");
    },
    checkAuth: (state) => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          // Decodifică token-ul JWT dacă e necesar
          const payload = JSON.parse(atob(token.split(".")[1]));
          state.isAuthenticated = true;
          state.user = { email: payload.email, role: payload.role, id: payload.id };
          state.token = token;
        } catch (error) {
          state.isAuthenticated = false;
          state.user = null;
          state.token = null;
        }
      }
    },
  },
});

export const { login, logout, checkAuth } = authSlice.actions;
export default authSlice.reducer;
