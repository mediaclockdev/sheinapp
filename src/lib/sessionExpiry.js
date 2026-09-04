import { toast } from "../components/Toast";

// This API returns 403 (not 401) for a missing/invalid/expired token, e.g.
// {"error":"Invalid or Expired Token"}, and every 403 the app can hit in practice
// is a dead session — so both codes end it.
// ponytail: if the API later starts using 403 for real permission denials
// ("you may not touch this resource"), this will log valid users out mid-click;
// gate it on the body blaming the token at that point.
export const isUnauthorized = (status) => status === 401 || status === 403;

// Called wherever an authenticated API call comes back unauthorized (token missing/expired).
export const handleUnauthorized = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  toast.error("Your session has ended. Please log in again.");
  window.location.href = window.location.pathname.startsWith("/admin")
    ? "/admin/login"
    : "/login";
};
