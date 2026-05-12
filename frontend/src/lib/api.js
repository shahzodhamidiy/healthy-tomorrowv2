import axios from "axios";

const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export const API_BASE = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API_BASE,
});

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("ht_token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      // Token expired or invalid — clear and let the app re-route
      localStorage.removeItem("ht_token");
    }
    return Promise.reject(err);
  }
);

export const BACKEND_ROOT = BACKEND_URL;
export default api;
