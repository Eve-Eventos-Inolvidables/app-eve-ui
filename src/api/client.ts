import axios from "axios";
import { env } from "../config/env";
import { useAuthStore } from "../stores/auth.store";
import { clearSession } from "../utils/session";

export const apiClient = axios.create({
  baseURL: env.apiUrl,
  headers: { "Content-Type": "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      clearSession({ expired: true });
    }
    return Promise.reject(error);
  },
);
