import { useState, useEffect } from "react";
import { Outlet, useLocation, Link, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import { handleUnauthorized, isUnauthorized } from "../../lib/sessionExpiry";
import { useSocket } from "../../hooks/useSocket";

const API_BASE_URL = "https://shelynx.mediaclocksoft.com.au";
const PROFILE_API_URL = `${API_BASE_URL}/api/agent-profile`;
const SETTINGS_API_URL = `${API_BASE_URL}/api/settings`;

const PAGE_TITLES = {
  "/dashboard": "Dashboard",
  "/orders": "Order Management",
  "/neworders": "New Orders",
  "/payments": "Payments",
  "/batch-queue": "Batch Queue",
  "/tracking": "Tracking",
  "/customers": "Customers",
  "/conversation": "Conversations",
  "/reports": "Reports",
  "/settings": "Settings",
  "/profile": "Profile",
};

const DashboardLayout = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { socket } = useSocket();
  const title = PAGE_TITLES[pathname] || "Dashboard";
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [now, setNow] = useState(new Date());

  // Update time for relative timestamps
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  console.log("Now ", now);

  useEffect(() => {
    if (!socket) return;
    const handleNotification = (message) => {
      if (message.senderType === "CUSTOMER") {
        setNotifications((prev) => {
          const newNotif = {
            id: Date.now(),
            type: "message",
            title: "New Message",
            senderName: message.chatPartner?.name || "Customer",
            body: message.content ? message.content.substring(0, 80) : "",
            conversationId: message.conversationId,
            time: new Date(),
            read: false,
          };
          const updated = [newNotif, ...prev];
          return updated.slice(0, 20); // max 20
        });
      }
    };
    socket.on("inbox_notification", handleNotification);
    return () => {
      socket.off("inbox_notification", handleNotification);
    };
  }, [socket]);

  const getRelativeTime = (date) => {
    const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
    if (diffInSeconds < 60) return "just now";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays}d ago`;
  };

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotificationClick = (notif) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n)),
    );
    setIsNotificationOpen(false);
    navigate("/conversation");
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const [isAgentActive, setIsAgentActive] = useState(true);

  useEffect(() => {
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
      .then(({ data }) => {
        setAvatarUrl(data?.avatarUrl || null);
        if (data) setUser(data);
      })
      .catch((err) => console.error("Failed to load agent profile:", err));

    fetch(SETTINGS_API_URL, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (isUnauthorized(res.status)) return Promise.reject(res.status);
        return res.ok ? res.json() : Promise.reject(res.status);
      })
      .then(({ data }) => {
        setIsAgentActive(
          data?.isAcceptingOrders != null
            ? Boolean(data.isAcceptingOrders)
            : true,
        );
      })
      .catch((err) => console.error("Failed to load agent status:", err));
  }, []);

  const displayName = user?.name || "Agent";
  const agentText = user?.id
    ? `Verified Agent #${user.id}`
    : "Verified Agent";
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
          <div className="flex items-center gap-3 lg:gap-6 relative">
            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative p-2 rounded-lg hover:bg-slate-100 transition duration-200"
              >
                <span className="text-lg">🔔</span>
                {/* Notification Badge */}
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 bg-[#D24D77] rounded-full border border-white text-[10px] text-white flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {isNotificationOpen && (
                <>
                  {/* Invisible backdrop to close when clicking outside */}
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsNotificationOpen(false)}
                  ></div>

                  <div className="absolute right-0 mt-2 w-80 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-[#E8DFE1] z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-[#E8DFE1] flex items-center justify-between bg-[#FAFAFA]/90">
                      <h3 className="font-bold text-[#17222B]">
                        Notifications
                      </h3>
                      {unreadCount > 0 && (
                        <button
                          onClick={markAllRead}
                          className="text-xs font-bold text-[#D24D77] hover:underline"
                        >
                          Mark all read
                        </button>
                      )}
                    </div>
                    <div className="max-h-[300px] overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-8 text-center text-[#8C959F] flex flex-col items-center">
                          <span className="text-4xl mb-2">📭</span>
                          <p className="text-sm font-medium">
                            No new notifications
                          </p>
                        </div>
                      ) : (
                        notifications.map((notif) => (
                          <div
                            key={notif.id}
                            onClick={() => handleNotificationClick(notif)}
                            className={`p-4 border-b border-[#E8DFE1] hover:bg-[#F8FAFF] cursor-pointer transition flex gap-3 ${notif.read ? "opacity-60" : ""}`}
                          >
                            <div className="h-10 w-10 shrink-0 rounded-full bg-[#FFE8EF] flex items-center justify-center text-lg">
                              💬
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[10px] font-bold text-[#D24D77] uppercase tracking-wider mb-0.5">{notif.title}</p>
                              <p className="text-sm font-semibold text-[#141D23] truncate leading-tight">{notif.senderName || "Customer"}</p>
                              <p className="text-xs text-[#5C5F60] mt-1 line-clamp-2 leading-snug">{notif.body}</p>
                              <p className="text-[10px] text-[#8C959F] mt-1.5 font-medium">{getRelativeTime(notif.time)}</p>
                            </div>
                            {!notif.read && (
                              <div className="h-2 w-2 rounded-full bg-[#D24D77] shrink-0 mt-1"></div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <div className="p-3 border-t border-[#E8DFE1] bg-[#FAFAFA]/90 text-center">
                        <button
                          onClick={() => {
                            setIsNotificationOpen(false);
                            navigate("/conversation");
                          }}
                          className="text-sm font-semibold text-[#141D23] hover:text-[#D24D77] transition"
                        >
                          View all conversations
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

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
              <div className="relative h-10 w-10 shrink-0">
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
                <span
                  className={`absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white transition-colors duration-300 ${isAgentActive ? "bg-green-500" : "bg-gray-400"}`}
                ></span>
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
              isAgentActive,
              onStatusChange: setIsAgentActive,
            }}
          />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
