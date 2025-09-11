import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API_URL = import.meta.env.VITE_API_URL;

const initialState = {
  isAuthenticated: false,
  user: null,
  accessToken: null,
  refreshToken: null,
  loading: false,
  authChecked: false,
  error: null,
  sessionExpired: false
};

// Safe JWT token validation
const validateAndDecodeToken = (token) => {
  try {
    if (!token || typeof token !== 'string') return null;
    
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Add 30 second buffer for clock skew
    if (payload.exp && payload.exp <= currentTime + 30) {
      return null; // Token expired or about to expire
    }
    
    return {
      email: payload.email,
      role: payload.role,
      id: payload.id,
      exp: payload.exp
    };
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Token validation failed:', error);
    }
    return null;
  }
};

// Safe localStorage operations
const safeLocalStorage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to save to localStorage:', error);
      }
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Failed to remove from localStorage:', error);
      }
    }
  }
};

// Async thunk for checking authentication
export const checkAuth = createAsyncThunk(
  "auth/checkAuth",
  async (_, { rejectWithValue }) => {
    try {
      const accessToken = safeLocalStorage.getItem("accessToken");
      const refreshToken = safeLocalStorage.getItem("refreshToken");

      if (!refreshToken) {
        return rejectWithValue("No refresh token found");
      }

      // Validate existing access token
      if (accessToken) {
        const tokenData = validateAndDecodeToken(accessToken);
        if (tokenData) {
          return {
            accessToken,
            refreshToken,
            user: tokenData
          };
        }
      }

      // Attempt to refresh token
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      try {
        const refreshResponse = await fetch(`${API_URL}/auth/refresh-token`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({ token: refreshToken }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!refreshResponse.ok) {
          if (refreshResponse.status === 401 || refreshResponse.status === 403) {
            throw new Error("REFRESH_TOKEN_EXPIRED");
          }
          throw new Error(`Refresh failed with status: ${refreshResponse.status}`);
        }

        const refreshData = await refreshResponse.json();
        
        if (!refreshData.accessToken) {
          throw new Error("Invalid refresh response");
        }

        const newTokenData = validateAndDecodeToken(refreshData.accessToken);
        if (!newTokenData) {
          throw new Error("Invalid new access token");
        }

        safeLocalStorage.setItem("accessToken", refreshData.accessToken);

        return {
          accessToken: refreshData.accessToken,
          refreshToken,
          user: newTokenData
        };
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      // Clear tokens on auth failure
      safeLocalStorage.removeItem("accessToken");
      safeLocalStorage.removeItem("refreshToken");
      
      if (error.name === 'AbortError') {
        return rejectWithValue("Network timeout");
      }
      
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for login
export const loginUser = createAsyncThunk(
  "auth/login",
  async ({ email, password }, { rejectWithValue }) => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const response = await fetch(`${API_URL}/auth/signin`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({ email, password }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || "Login failed");
        }

        const data = await response.json();
        
        if (!data.accessToken || !data.refreshToken) {
          throw new Error("Invalid login response");
        }

        const userData = validateAndDecodeToken(data.accessToken);
        if (!userData) {
          throw new Error("Invalid access token received");
        }

        return {
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          user: userData
        };
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        return rejectWithValue("Request timeout");
      }
      return rejectWithValue(error.message);
    }
  }
);

// Async thunk for logout
export const logoutUser = createAsyncThunk(
  "auth/logout",
  async (_, { getState }) => {
    try {
      const { auth } = getState();
      
      // Attempt to notify server of logout
      if (auth.refreshToken) {
        fetch(`${API_URL}/auth/signout`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({ token: auth.refreshToken })
        }).catch(() => {
          // Ignore server errors on logout
        });
      }
    } catch {
      // Ignore all errors during logout
    } finally {
      // Always clear local storage
      safeLocalStorage.removeItem("accessToken");
      safeLocalStorage.removeItem("refreshToken");
      safeLocalStorage.removeItem("redirectTo");
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Clear error state
    clearError: (state) => {
      state.error = null;
    },
    
    // Clear session expired flag
    clearSessionExpired: (state) => {
      state.sessionExpired = false;
    },
    
    // Update access token (for refresh operations)
    updateAccessToken: (state, action) => {
      const tokenData = validateAndDecodeToken(action.payload);
      if (tokenData) {
        state.accessToken = action.payload;
        state.user = tokenData;
        safeLocalStorage.setItem("accessToken", action.payload);
      }
    },
    
    // Force logout (for session expiry)
    forceLogout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.loading = false;
      state.authChecked = true;
      state.sessionExpired = true;
      state.error = null;

      safeLocalStorage.removeItem("accessToken");
      safeLocalStorage.removeItem("refreshToken");
      safeLocalStorage.removeItem("redirectTo");
    }
  },
  extraReducers: (builder) => {
    builder
      // Check Auth
      .addCase(checkAuth.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.authChecked = false;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.loading = false;
        state.authChecked = true;
        state.error = null;
        state.sessionExpired = false;
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.loading = false;
        state.authChecked = true;
        state.error = action.payload;
        state.sessionExpired = action.payload === "REFRESH_TOKEN_EXPIRED";
      })
      
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.refreshToken = action.payload.refreshToken;
        state.loading = false;
        state.authChecked = true;
        state.error = null;
        state.sessionExpired = false;

        safeLocalStorage.setItem("accessToken", action.payload.accessToken);
        safeLocalStorage.setItem("refreshToken", action.payload.refreshToken);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        state.loading = false;
        state.authChecked = true;
        state.error = null;
        state.sessionExpired = false;
      });
  }
});

export const { 
  clearError, 
  clearSessionExpired, 
  updateAccessToken, 
  forceLogout 
} = authSlice.actions;

export default authSlice.reducer;