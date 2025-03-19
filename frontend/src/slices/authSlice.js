import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API_URL = import.meta.env.VITE_API_URL;

const initialState = {
  isAuthenticated: false,
  user: null,
  accessToken: null,
  refreshToken: null,
  loading: true,
  authChecked: false,
};

export const checkAuth = createAsyncThunk(
  "auth/checkAuth",
  async (_, { rejectWithValue }) => {
    try {
      const accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");

      if (!refreshToken) {
        return rejectWithValue("No refresh token found");
      }

      if (accessToken) {
        const payload = JSON.parse(atob(accessToken.split(".")[1]));
        const currentTime = Math.floor(Date.now() / 1000);

        if (payload.exp > currentTime) {
          return {
            accessToken,
            refreshToken,
            user: { email: payload.email, role: payload.role, id: payload.id },
          };
        }
      }

      const refreshResponse = await fetch(`${API_URL}/auth/refresh-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: refreshToken }),
      });

      if (!refreshResponse.ok) {
        throw new Error("Refresh token expired or invalid");
      }

      const refreshData = await refreshResponse.json();
      localStorage.setItem("accessToken", refreshData.accessToken);

      const refreshedPayload = JSON.parse(atob(refreshData.accessToken.split(".")[1]));

      return {
        accessToken: refreshData.accessToken,
        refreshToken,
        user: {
          email: refreshedPayload.email,
          role: refreshedPayload.role,
          id: refreshedPayload.id,
        },
      };
    } catch (error) {
      console.error("checkAuth error:", error.message);
      return rejectWithValue(error.message);
    }
  }
);


const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    login: (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.refreshToken = action.payload.refreshToken;
      state.loading = false;
      state.authChecked = true;

      localStorage.setItem("accessToken", action.payload.accessToken);
      localStorage.setItem("refreshToken", action.payload.refreshToken);
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.loading = false;
      state.authChecked = true;

      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("redirectTo"); // Șterge redirectTo la logout
    },
    setAccessToken: (state, action) => {
      state.accessToken = action.payload.accessToken;
      localStorage.setItem("accessToken", action.payload.accessToken);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
        state.authChecked = false;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.loading = false;
        state.authChecked = true;
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.loading = false;
        state.authChecked = true;
      });
  },
});

export const { login, logout, setAccessToken } = authSlice.actions;
export default authSlice.reducer;
