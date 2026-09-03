import { Navigate } from "react-router-dom";
import { isAdmin } from "../lib/auth";

const AdminRoute = ({ children }) =>
  isAdmin() ? children : <Navigate to="/dashboard" replace />;

export default AdminRoute;
