import { useState, useEffect } from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import { handleUnauthorized, isUnauthorized } from "../../lib/sessionExpiry";

const API_BASE_URL = "https://shelynx.mediaclocksoft.com.au";
const PROFILE_API_URL = `${API_BASE_URL}/api/agent-profile`;

const PAGE_TITLES = {
  "/dashboard": "Dashboard",
  "/orders": "Order Management",
  "/neworders": "New Orders",
  "/payments": "Payments",
  "/batch-queue": "Batch Queue",
  "/tracking": "Tracking",
  "/customers": "Customers",
  "/reports": "Reports",
  "/settings": "Settings",
  "/profile": "Profile",
};

const DashboardLayout = () => {
  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] || "Dashboard";
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error("Failed to parse user data", e);
    }

    const token = localStorage.getItem("token");
    fetch(PROFILE_API_URL, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (isUnauthorized(res.status)) {
          handleUnauthorized();
          return Promise.reject(res.status);
        }
        return res.ok ? res.json() : Promise.reject(res.status);
      })
      .then(({ data }) => setAvatarUrl(data?.avatarUrl || null))
      .catch((err) => console.error("Failed to load agent avatar:", err));
  }, []);

  const displayName = user?.name || "Sarah Chen";
  const agentText = user?.id
    ? `Verified Agent #${user.id}`
    : "Verified Agent #48219";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);

  return (
    <div className="flex bg-[#F8FAFF] min-h-screen text-[#17222B] font-sans antialiased">
      {/* Left Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Right-side container */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-[70px] bg-white border-b border-[#E8DFE1] px-4 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-[0_2px_12px_rgba(0,0,0,0.01)]">
          {/* Hamburger Menu for Mobile/Tablet */}
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-100 mr-2 transition duration-200"
            aria-label="Open Sidebar"
          >
            <span className="text-xl">☰</span>
          </button>

          {/* Page Title (replaces search bar) */}
          <div className="min-w-0">
            <h1 className="text-2xl lg:text-[32px] font-bold text-[#17222B] tracking-tight">
              {title}
            </h1>
          </div>
          {/* User profile & Notifications */}
          <div className="flex items-center gap-3 lg:gap-6">
            {/* Notification Bell */}
            <button className="relative p-2 rounded-lg hover:bg-slate-100 transition duration-200">
              {/* Commented out img for notification bell icon */}
              {/* <img src="bell.svg" alt="Notifications" className="h-5 w-5" /> */}
              <span className="text-lg">🔔</span>

              {/* Notification Badge */}
              <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-[#E14878] rounded-full border border-white"></span>
            </button>

            {/* Vertical Divider */}
            <div className="h-8 w-px bg-slate-200"></div>

            {/* User Profile Info */}
            <Link to="/profile" className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-base font-bold text-[#141D23] hidden lg:block leading-tight">
                  {displayName}
                </span>
                <span className="text-xs font-medium text-[#5C5F60]/70 hidden lg:block">
                  {agentText}
                </span>
              </div>

              {/* Profile Avatar Image */}
              <div className="h-10 w-10 rounded-full border border-[#dec9ce] overflow-hidden bg-[#FFE8EF] flex items-center justify-center font-bold text-[#D24D77] text-sm shadow-sm">
                {avatarUrl ? (
                  <img
                    src={
                      avatarUrl.startsWith("http")
                        ? avatarUrl
                        : `${API_BASE_URL}${avatarUrl}`
                    }
                    alt={displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
            </Link>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet
            context={{
              onAvatarChange: setAvatarUrl,
              onUserChange: (patch) =>
                setUser((u) => ({ ...(u || {}), ...patch })),
            }}
          />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
