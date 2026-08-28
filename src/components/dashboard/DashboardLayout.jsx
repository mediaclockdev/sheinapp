import { useState, useEffect } from "react";
import { Outlet, useLocation, Link, useNavigate } from "react-router-dom";
import { X } from "lucide-react";
import Sidebar from "./Sidebar";
import { useSocket } from "../../hooks/useSocket";
import { requestFirebaseToken } from "../../config/firebase";
import apiClient, { API_ORIGIN } from "../../lib/api/client";
import { ENDPOINTS } from "../../lib/api/endpoints";

const PAGE_TITLES = {
  "/dashboard": "Dashboard",
  "/orders": "Order Management",
  "/neworders": "MarketPlace",
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
  const [unreadCount, setUnreadCount] = useState(0);
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
          let wasUnread = false;

          // Remove any existing notification for this same conversation to prevent spam
          const filtered = prev.filter((n) => {
            if (
              n.type === "MESSAGE" &&
              n.metadata?.conversationId === message.conversationId
            ) {
              if (!n.isRead) wasUnread = true;
              return false; // Remove the old one
            }
            return true;
          });

          // Only increment global badge if there wasn't ALREADY an unread notification for this chat
          if (!wasUnread) {
            setUnreadCount((c) => c + 1);
          }

          const newNotif = {
            id: Date.now(),
            title: "New Message",
            body: message.content ? message.content.substring(0, 80) : "",
            type: "MESSAGE",
            metadata: {
              sender: {
                name: message.chatPartner?.name || "Customer",
              },
              conversationId: message.conversationId,
            },
            isRead: false,
            createdAt: new Date().toISOString(),
          };

          // Put the newest message at the top
          return [newNotif, ...filtered];
        });
      }
    };

    const handleMessageRead = (data) => {
      // If the AGENT read the message, we clear the global bell notifications for this chat!
      if (data.readBy === "AGENT" && data.conversationId) {
        setNotifications((prev) => {
          let readCount = 0;
          const updated = prev.map((n) => {
            if (
              !n.isRead &&
              n.type === "MESSAGE" &&
              n.metadata?.conversationId === data.conversationId
            ) {
              readCount++;
              return { ...n, isRead: true };
            }
            return n;
          });

          if (readCount > 0) {
            setUnreadCount((c) => Math.max(0, c - readCount));
          }
          return updated;
        });
      }
    };

    socket.on("inbox_notification", handleNotification);
    socket.on("message_read", handleMessageRead);

    return () => {
      socket.off("inbox_notification", handleNotification);
      socket.off("message_read", handleMessageRead);
    };
  }, [socket]);

  // 2. Fetch it exactly once when the Dashboard loads
  useEffect(() => {
    // 1. Create the fetch function
    const fetchNotifications = async () => {
      try {
        const res = await apiClient.get(
          `${ENDPOINTS.notifications.list}?page=1&limit=20`,
        );
        // The backend returns { message: "...", data: [...], meta: { unreadCount: 5 } }
        if (res.data) {
          if (res.data.data) {
            setNotifications(res.data.data);
          }
          if (res.data.meta && res.data.meta.unreadCount !== undefined) {
            setUnreadCount(res.data.meta.unreadCount);
          }
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    };
    fetchNotifications();
  }, []);

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

  // const markAllRead = () => {
  //   setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  // };
  const markAllRead = async () => {
    try {
      // Optimistic UI update
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);

      await apiClient.patch(ENDPOINTS.notifications.readAll, {});
    } catch (error) {
      console.error("Failed to mark all as read", error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      // Optimistic UI update
      setNotifications([]);
      setUnreadCount(0);

      await apiClient.delete(ENDPOINTS.notifications.clearAll);
    } catch (error) {
      console.error("Failed to clear all notifications", error);
    }
  };

  const clearNotification = async (id, e) => {
    e.stopPropagation(); // Don't trigger the click that navigates
    try {
      // Optimistic update
      setNotifications((prev) => {
        const notif = prev.find((n) => n.id === id);
        if (notif && !notif.isRead) {
          setUnreadCount((c) => Math.max(0, c - 1));
        }
        return prev.filter((n) => n.id !== id);
      });

      await apiClient.delete(ENDPOINTS.notifications.byId(id));
    } catch (error) {
      console.error("Failed to clear notification", error);
    }
  };

  const handleNotificationClick = async (notif) => {
    console.log("Clicked notification:", notif);

    // Sometimes backend returns metadata as a stringified JSON
    let meta = notif.metadata;
    if (typeof meta === "string") {
      try {
        meta = JSON.parse(meta);
      } catch (e) {
        console.error("Failed to parse metadata", e);
      }
    }

    try {
      if (!notif.isRead) {
        // Optimistic UI update: instantly mark as read so UI feels snappy
        setUnreadCount((c) => Math.max(0, c - 1));
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)),
        );

        // For MESSAGE notifications, opening the chat emits 'mark_as_read' via socket,
        // which magically handles the backend cleanup. No need to hit the notifications API!
        if (notif.type !== "MESSAGE") {
          await apiClient.patch(ENDPOINTS.notifications.read(notif.id), {});
        }
      }
    } catch (error) {
      console.error("Failed to mark as read", error);
    }

    setIsNotificationOpen(false); // Close dropdown

    console.log("Navigating to:", notif.type, meta);

    if (notif.type === "MESSAGE" && meta?.conversationId) {
      navigate(`/conversation`, {
        state: { conversationId: meta.conversationId },
      });
    } else if (notif.type === "ORDER") {
      navigate(`/orders`);
    } else {
      // Fallback if metadata is missing
      navigate(`/conversation`);
    }
  };

  const [isAgentActive, setIsAgentActive] = useState(true);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        // Avoid setting state if already set to same ID to prevent loops
        setUser((prev) => (prev?.id === parsed.id ? prev : parsed));
      }
    } catch (e) {
      console.error("Failed to parse user data", e);
    }

    apiClient
      .get(ENDPOINTS.agentProfile.get)
      .then(({ data: { data } }) => {
        setAvatarUrl(data?.avatarUrl || null);
        if (data) setUser(data);
      })
      .catch((err) => console.error("Failed to load agent profile:", err));

    apiClient
      .get(ENDPOINTS.settings.get)
      .then(({ data: { data } }) => {
        setIsAgentActive(
          data?.isAcceptingOrders != null
            ? Boolean(data.isAcceptingOrders)
            : true,
        );
      })
      .catch((err) => console.error("Failed to load agent status:", err));

    const setupFCM = async () => {
      try {
        const fcmToken = await requestFirebaseToken();
        if (fcmToken) {
          await apiClient.patch(ENDPOINTS.agentProfile.fcmToken, {
            fcmToken,
          });
        }
      } catch (err) {
        console.error("Failed to setup FCM token:", err);
      }
    };
    setupFCM();
  }, []);

  const displayName = user?.name || "Agent";
  const agentText = user?.id ? `Verified Agent #${user.id}` : "Verified Agent";
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
                      <div className="flex items-center gap-2">
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllRead}
                            className="text-[11px] font-bold text-[#D24D77] hover:underline"
                          >
                            Mark all read
                          </button>
                        )}
                        {unreadCount > 0 && notifications.length > 0 && (
                          <span className="text-[#E8DFE1] text-[10px]">|</span>
                        )}
                        {notifications.length > 0 && (
                          <button
                            onClick={clearAllNotifications}
                            className="text-[11px] font-bold text-[#8C959F] hover:text-[#D24D77] hover:underline"
                          >
                            Clear all
                          </button>
                        )}
                      </div>
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
                            className={`group relative p-4 border-b border-[#E8DFE1] hover:bg-[#F8FAFF] cursor-pointer transition flex gap-3 ${notif.isRead ? "opacity-60" : ""}`}
                          >
                            <div className="relative h-10 w-10 shrink-0 rounded-full bg-[#FFE8EF] flex items-center justify-center text-lg">
                              {/* We can dynamically change this icon based on the type enum! */}
                              {notif.type === "MESSAGE" ? "💬" : "📦"}

                              {/* Unread dot as a badge on the avatar */}
                              {!notif.isRead && (
                                <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D24D77] opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#D24D77] border-[1.5px] border-white"></span>
                                </span>
                              )}
                            </div>

                            <div className="flex-1 min-w-0 pr-8">
                              <p className="text-[10px] font-bold text-[#D24D77] uppercase tracking-wider mb-0.5">
                                {notif.title}
                              </p>

                              <p className="text-sm font-semibold text-[#141D23] truncate leading-tight">
                                {notif.metadata?.sender?.name || "System"}
                              </p>

                              <p className="text-xs text-[#5C5F60] mt-0.5 line-clamp-1 leading-snug">
                                {notif.body}
                              </p>

                              <p className="text-[10px] text-[#8C959F] mt-1.5 font-medium">
                                {getRelativeTime(notif.createdAt)}
                              </p>
                            </div>

                            {/* Floating Delete button (shows on hover) */}
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => clearNotification(notif.id, e)}
                                className="p-1.5 rounded-full bg-white shadow-sm border border-[#E8DFE1] text-[#8C959F] hover:bg-[#FFE8EF] hover:text-[#D24D77] hover:border-[#FFE8EF] transition-all"
                                title="Clear notification"
                              >
                                <X size={14} />
                              </button>
                            </div>
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
                          : `${API_ORIGIN}${avatarUrl}`
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
