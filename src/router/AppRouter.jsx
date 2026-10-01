import { lazy, Suspense } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import { AuthPortal } from "../components/login";
import DashboardLayout from "../components/dashboard/DashboardLayout";
const Dashboard = lazy(() => import("../views/Dashboard"));
const OrderManagement = lazy(() => import("../views/OrderManagement"));
// Small, so kept eager rather than split into its own chunk
import {
  PaymentsView,
  ReportsView,
  PagePlaceholder,
} from "../views/PlaceholderViews";
const Tracking = lazy(() => import("../views/Tracking"));
const Settings = lazy(() => import("../views/Settings"));
const Profile = lazy(() => import("../views/Profile"));
const BatchQueue = lazy(() => import("../views/BatchQueue"));
const NewOrders = lazy(() => import("../views/NewOrders"));
const Customers = lazy(() => import("../views/Customers"));
const Conversations = lazy(() => import("../views/Conversations"));
const ScanSku = lazy(() => import("../views/ScanSku"));
import MobileOnlyRoute from "./MobileOnlyRoute";
import AdminRoute from "./AdminRoute";
import { landingPath } from "../lib/auth";
import AdminLayout from "../components/admin/AdminLayout";
const AdminDashboard = lazy(() => import("../views/admin/AdminDashboard"));
const AgentManagement = lazy(() => import("../views/admin/AgentManagement"));
const AgentDetail = lazy(() => import("../views/admin/AgentDetail"));

const isAuthenticated = () => {
  return !!localStorage.getItem("token");
};

function AppRoutes() {
  const { pathname } = useLocation();
  const isAuth = isAuthenticated();

  const authPaths = [
    "/login",
    "/admin/login",
    "/forgot-password",
    // "/verify-otp",
    "/reset-password",
    "/register",
  ];

  const isAuthPath = authPaths.includes(pathname);

  // Redirect authenticated users away from login/register to dashboard
  if (isAuth && isAuthPath) {
    return <Navigate to={landingPath()} replace />;
  }

  // Redirect unauthenticated users trying to access dashboard/inner pages to login
  if (!isAuth && !isAuthPath) {
    return (
      <Navigate
        to={pathname.startsWith("/admin") ? "/admin/login" : "/login"}
        replace
      />
    );
  }

  // Render auth pages
  if (isAuthPath) {
    return <AuthPortal />;
  }

  // Otherwise, render the Dashboard layout and pages
  return (
    <Suspense
      fallback={<div className="p-6 text-sm text-gray-500">Loading...</div>}
    >
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          {/* Default Route redirects to Dashboard */}
          <Route index element={<Navigate to={landingPath()} replace />} />

          {/* Sub Pages */}
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="orders" element={<OrderManagement />} />
          <Route path="neworders" element={<NewOrders />} />
          <Route path="payments" element={<PaymentsView />} />
          <Route path="batch-queue" element={<BatchQueue />} />
          <Route path="tracking" element={<Tracking />} />
          <Route path="customers" element={<Customers />} />
          <Route path="reports" element={<ReportsView />} />
          <Route path="settings" element={<Settings />} />
          <Route path="profile" element={<Profile />} />
          <Route path="conversation" element={<Conversations />} />
          <Route
            path="scanSku"
            element={
              <MobileOnlyRoute>
                <ScanSku />
              </MobileOnlyRoute>
            }
          />
        </Route>

        {/* Admin panel — own layout, admin role only */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminLayout />
            </AdminRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="agents" element={<AgentManagement />} />
          <Route path="agents/:id" element={<AgentDetail />} />
          <Route
            path="settings"
            element={<PagePlaceholder title="Admin Settings" />}
          />
        </Route>

        {/* Fallback Catch-all -> redirects to dashboard */}
        <Route path="*" element={<Navigate to={landingPath()} replace />} />
      </Routes>
    </Suspense>
  );
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
