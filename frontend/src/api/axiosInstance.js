import axios from "axios";
import { authStorage } from "../utils/authHelpers";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  timeout: 30000,
});

// Atașează accessToken la fiecare request
axiosInstance.interceptors.request.use((config) => {
  const { accessToken } = authStorage.getTokens();
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// Gestionează 401 → logout și redirect la signin
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      authStorage.clearTokens();
      window.location.href = "/signin";
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;