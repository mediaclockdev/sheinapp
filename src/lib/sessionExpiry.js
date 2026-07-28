import { toast } from "../components/Toast";

// This API returns 403 (not 401) for a missing/invalid/expired token, e.g.
// {"error":"Invalid or Expired Token"} — checking both covers either convention.
export const isUnauthorized = (status) => status === 401 || status === 403;

// Called wherever an authenticated API call comes back unauthorized (token missing/expired).
export const handleUnauthorized = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  toast.error("Your session has ended. Please log in again.");
  window.location.href = "/login";
};
