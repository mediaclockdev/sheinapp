// Role is stamped at login (the /admin/login route sets "admin") and lives on
// the stored `user` object.
// Client-side only — cosmetic. The API must enforce admin permissions itself.
export const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user")) ?? null;
  } catch {
    return null;
  }
};

export const getRole = () => getUser()?.role?.toLowerCase() ?? null;

export const isAdmin = () => getRole() === "admin";

export const landingPath = () => (isAdmin() ? "/admin" : "/dashboard");

export const logout = () => {
  for (const k of ["token", "user"]) {
    localStorage.removeItem(k);
    sessionStorage.removeItem(k);
  }
};
