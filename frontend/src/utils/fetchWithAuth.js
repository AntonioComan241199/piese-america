import { store } from "../redux/store/store";
import { updateAccessToken, forceLogout } from "../slices/authSlice";

const API_URL = import.meta.env.VITE_API_URL;

// Custom error classes
class AuthError extends Error {
  constructor(message, status = 401) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
  }
}

class NetworkError extends Error {
  constructor(message, status = 0) {
    super(message);
    this.name = 'NetworkError';
    this.status = status;
  }
}

// Retry configuration
const RETRY_CONFIG = {
  maxRetries: 3,
  baseDelay: 1000, // 1 second
  maxDelay: 5000,  // 5 seconds
  retryableStatuses: [408, 429, 500, 502, 503, 504]
};

// Sleep utility for retries
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Calculate retry delay with exponential backoff
const getRetryDelay = (attempt) => {
  const delay = RETRY_CONFIG.baseDelay * Math.pow(2, attempt);
  const jitter = Math.random() * 0.1 * delay; // Add 10% jitter
  return Math.min(delay + jitter, RETRY_CONFIG.maxDelay);
};

// Check if status code is retryable
const isRetryableStatus = (status) => {
  return RETRY_CONFIG.retryableStatuses.includes(status);
};

// Refresh access token
const refreshAccessToken = async () => {
  const state = store.getState();
  const refreshToken = state.auth.refreshToken;

  if (!refreshToken) {
    throw new AuthError("No refresh token available");
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  try {
    const response = await fetch(`${API_URL}/auth/refresh-token`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify({ token: refreshToken }),
      signal: controller.signal
    });

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        store.dispatch(forceLogout());
        throw new AuthError("Session expired. Please log in again.", 401);
      }
      throw new NetworkError(`Refresh failed: ${response.status}`, response.status);
    }

    const data = await response.json();
    
    if (!data.accessToken) {
      throw new AuthError("Invalid refresh response");
    }

    store.dispatch(updateAccessToken(data.accessToken));
    return data.accessToken;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new NetworkError("Request timeout");
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
};

// Main fetch function with authentication and retry logic
export const fetchWithAuth = async (
  url, 
  options = {}, 
  config = {}
) => {
  const {
    rawResponse = false,
    timeout = 30000,
    retries = RETRY_CONFIG.maxRetries,
    skipAuth = false
  } = config;

  let attempt = 0;
  let lastError;

  while (attempt <= retries) {
    try {
      const state = store.getState();
      let accessToken = state.auth.accessToken;

      // Handle authentication if required
      if (!skipAuth) {
        if (!accessToken && state.auth.refreshToken) {
          try {
            accessToken = await refreshAccessToken();
          } catch (error) {
            if (error instanceof AuthError) {
              throw error;
            }
            // Continue with request if refresh fails but we want to try anyway
          }
        }

        if (!accessToken && !skipAuth) {
          store.dispatch(forceLogout());
          throw new AuthError("Authentication required");
        }
      }

      // Setup request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const requestOptions = {
        ...options,
        method: options.method?.toUpperCase() || "GET",
        headers: {
          "Accept": "application/json",
          ...(!skipAuth && accessToken && { Authorization: `Bearer ${accessToken}` }),
          ...(options.headers || {})
        },
        signal: controller.signal
      };

      // Add Content-Type for requests with body (except FormData)
      if (requestOptions.body && !(requestOptions.body instanceof FormData)) {
        requestOptions.headers["Content-Type"] = requestOptions.headers["Content-Type"] || "application/json";
      }

      try {
        const response = await fetch(url, requestOptions);
        clearTimeout(timeoutId);

        // Handle authentication errors
        if (response.status === 401 && !skipAuth) {
          // Try to refresh token once
          if (attempt === 0 && state.auth.refreshToken) {
            try {
              accessToken = await refreshAccessToken();
              // Retry the request with new token
              attempt++;
              continue;
            } catch (refreshError) {
              store.dispatch(forceLogout());
              throw new AuthError("Session expired. Please log in again.", 401);
            }
          } else {
            store.dispatch(forceLogout());
            throw new AuthError("Unauthorized access", 401);
          }
        }

        // Handle other client errors (don't retry)
        if (response.status >= 400 && response.status < 500 && response.status !== 408 && response.status !== 429) {
          let errorMessage = `Request failed: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch {
            // Use default error message if parsing fails
          }
          throw new Error(errorMessage);
        }

        // Handle server errors (potentially retryable)
        if (!response.ok) {
          if (isRetryableStatus(response.status) && attempt < retries) {
            throw new NetworkError(`Server error: ${response.status}`, response.status);
          }
          
          let errorMessage = `Request failed: ${response.status}`;
          try {
            const errorData = await response.json();
            errorMessage = errorData.message || errorData.error || errorMessage;
          } catch {
            // Use default error message if parsing fails
          }
          throw new Error(errorMessage);
        }

        // Success - return response
        return rawResponse ? response : response.json();

      } finally {
        clearTimeout(timeoutId);
      }

    } catch (error) {
      lastError = error;

      // Don't retry auth errors or client errors
      if (error instanceof AuthError || 
          (error.status >= 400 && error.status < 500 && !isRetryableStatus(error.status))) {
        throw error;
      }

      // Don't retry if we've exhausted attempts
      if (attempt >= retries) {
        break;
      }

      // Wait before retry
      if (attempt < retries) {
        const delay = getRetryDelay(attempt);
        if (process.env.NODE_ENV === 'development') {
          console.warn(`Request failed, retrying in ${delay}ms (attempt ${attempt + 1}/${retries + 1}):`, error.message);
        }
        await sleep(delay);
      }

      attempt++;
    }
  }

  // All retries exhausted
  const finalError = lastError instanceof Error 
    ? lastError 
    : new NetworkError("Request failed after multiple attempts");
    
  throw finalError;
};

// Convenience methods
export const get = (url, config = {}) => 
  fetchWithAuth(url, { method: 'GET' }, config);

export const post = (url, data, config = {}) => 
  fetchWithAuth(url, { 
    method: 'POST', 
    body: data instanceof FormData ? data : JSON.stringify(data) 
  }, config);

export const put = (url, data, config = {}) => 
  fetchWithAuth(url, { 
    method: 'PUT', 
    body: data instanceof FormData ? data : JSON.stringify(data) 
  }, config);

export const del = (url, config = {}) => 
  fetchWithAuth(url, { method: 'DELETE' }, config);

export const patch = (url, data, config = {}) => 
  fetchWithAuth(url, { 
    method: 'PATCH', 
    body: data instanceof FormData ? data : JSON.stringify(data) 
  }, config);

// Export error classes for usage in components
export { AuthError, NetworkError };