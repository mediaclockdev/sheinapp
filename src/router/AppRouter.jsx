import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthPortal } from "../components/login";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import Dashboard from "../views/Dashboard";
import OrderManagement from "../views/OrderManagement";
import {
  PaymentsView,
  TrackingView,
  CustomersView,
  ReportsView,
} from "../views/PlaceholderViews";
import Settings from "../views/Settings";
import Profile from "../views/Profile";
import BatchQueue from "../views/BatchQueue";
import NewOrders from "../views/NewOrders";

const isAuthenticated = () => {
  return !!(localStorage.getItem("token") || sessionStorage.getItem("token"));
};

function AppRoutes() {
  const { pathname } = useLocation();
  const isAuth = isAuthenticated();

  const authPaths = [
    "/login",
    "/forgot-password",
    // "/verify-otp",
    "/reset-password",
    "/register",
  ];

  const isAuthPath = authPaths.includes(pathname);

  // Redirect authenticated users away from login/register to dashboard
  if (isAuth && isAuthPath) {
    return <Navigate to="/dashboard" replace />;
  }

  // Redirect unauthenticated users trying to access dashboard/inner pages to login
  if (!isAuth && !isAuthPath) {
    return <Navigate to="/login" replace />;
  }

  // Render auth pages
  if (isAuthPath) {
    return <AuthPortal />;
  }

  // Otherwise, render the Dashboard layout and pages
  return (
    <Routes>
      <Route path="/" element={<DashboardLayout />}>
        {/* Default Route redirects to Dashboard */}
        <Route index element={<Navigate to="/dashboard" replace />} />

        {/* Sub Pages */}
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="orders" element={<OrderManagement />} />
        <Route path="neworders" element={<NewOrders />} />
        <Route path="payments" element={<PaymentsView />} />
        <Route path="batch-queue" element={<BatchQueue />} />
        <Route path="tracking" element={<TrackingView />} />
        <Route path="customers" element={<CustomersView />} />
        <Route path="reports" element={<ReportsView />} />
        <Route path="settings" element={<Settings />} />
        <Route path="profile" element={<Profile />} />
      </Route>

      {/* Fallback Catch-all -> redirects to dashboard */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
