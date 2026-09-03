import { toast } from "../components/Toast";

// This API returns 403 (not 401) for a missing/invalid/expired token, e.g.
// {"error":"Invalid or Expired Token"}. But 403 is also plain "you may not touch
// this resource" — killing the session on that logs a valid user out mid-click,
// so a 403 only ends the session when the body actually blames the token.
const TOKEN_BLAMED = /token|expired|session/i;

export const isUnauthorized = (status, data) =>
  status === 401 ||
  (status === 403 &&
    TOKEN_BLAMED.test(
      [data?.error, data?.message].filter(Boolean).join(" ") || "token",
    ));

// Called wherever an authenticated API call comes back unauthorized (token missing/expired).
export const handleUnauthorized = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  toast.error("Your session has ended. Please log in again.");
  window.location.href = window.location.pathname.startsWith("/admin")
    ? "/admin/login"
    : "/login";
};
