import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AuthPortal } from "../components/login";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import Dashboard from "../views/Dashboard";
import {
  OrdersView,
  PaymentsView,
  BatchQueueView,
  TrackingView,
  CustomersView,
  ReportsView,
  SettingsView,
} from "../views/PlaceholderViews";

function AppRoutes() {
  const { pathname } = useLocation();
  const authPaths = [
    "/login",
    "/forgot-password",
    "/verify-otp",
    "/reset-password",
    "/register"
  ];

  // If we are on any of the authentication pages, render the AuthPortal directly at the top level
  if (authPaths.includes(pathname)) {
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
        <Route path="orders" element={<OrdersView />} />
        <Route path="payments" element={<PaymentsView />} />
        <Route path="batch-queue" element={<BatchQueueView />} />
        <Route path="tracking" element={<TrackingView />} />
        <Route path="customers" element={<CustomersView />} />
        <Route path="reports" element={<ReportsView />} />
        <Route path="settings" element={<SettingsView />} />
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
