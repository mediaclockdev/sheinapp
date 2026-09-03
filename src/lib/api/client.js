import axios from "axios";
import { handleUnauthorized, isUnauthorized } from "../sessionExpiry";

export const API_ORIGIN = import.meta.env.VITE_API_BASE_URL;

// Axios errors carry the backend's real message under response.data; err.message
// is just a generic "Request failed with status code 4xx" otherwise.
export const getErrorMessage = (err, fallback) =>
  err.response?.data?.message ||
  err.response?.data?.errors?.map((e) => e.message).join(", ") ||
  fallback ||
  err.message;

const apiClient = axios.create({ baseURL: API_ORIGIN });

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isUnauthorized(error.response?.status, error.response?.data))
      handleUnauthorized();
    return Promise.reject(error);
  },
);

export default apiClient;
