import axios from "axios";
import { handleUnauthorized, isUnauthorized } from "../sessionExpiry";

export const API_ORIGIN = import.meta.env.VITE_API_BASE_URL;

// Axios errors carry the backend's real message under response.data (as
// `message` or `error`); err.message is just a generic "Request failed with
// status code 4xx" otherwise.
export const getErrorMessage = (err, fallback) =>
  err.response?.data?.message ||
  (typeof err.response?.data?.error === "string" && err.response.data.error) ||
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
    // Only a request that carried a token has a session to end. Public calls
    // (login, activate) 403 for their own reasons, e.g. a suspended account,
    // and the caller must get to show that message instead of a redirect.
    if (
      isUnauthorized(error.response?.status) &&
      error.config?.headers?.Authorization
    )
      handleUnauthorized(error.response?.data?.message);
    return Promise.reject(error);
  },
);

export default apiClient;
