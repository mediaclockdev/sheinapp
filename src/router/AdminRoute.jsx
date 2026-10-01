import { Navigate } from "react-router-dom";
import { isAdmin, isSuperAdmin } from "../lib/auth";

// `superOnly` sends regular admins back to the admin home.
const AdminRoute = ({ children, superOnly = false }) => {
  if (!isAdmin()) return <Navigate to="/dashboard" replace />;
  if (superOnly && !isSuperAdmin()) return <Navigate to="/admin" replace />;
  return children;
};

export default AdminRoute;
