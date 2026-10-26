import axios from "axios";
import { useAuthStore } from "../stores/auth.store";

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().clearAuth(); // boots user if cookie expired
    }
    return Promise.reject(error);
  }
);