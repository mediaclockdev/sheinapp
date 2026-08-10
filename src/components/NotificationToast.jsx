import { useEffect, useState, useCallback } from "react";
import { MessageSquare, X } from "lucide-react";

/* ─── Event Bus ─── */
let listeners = [];
let idCounter = 0;

function emit(payload) {
  const item = { ...payload, id: ++idCounter, createdAt: Date.now() };
  listeners.forEach((fn) => fn(item));
}

export const notificationToast = {
  message: (data) => emit(data), // { title, body, avatar, onClick }
};

/* ─── Constants ─── */
const AUTO_DISMISS_MS = 5000;
const MAX_VISIBLE = 4;

/* ─── Single Notification Toast Item ─── */
const NotificationToastItem = ({ item, onDismiss }) => {
  const [state, setState] = useState("entering"); // entering | visible | leaving

  const dismiss = useCallback(() => {
    if (state === "leaving") return;
    setState("leaving");
    setTimeout(() => onDismiss(item.id), 340);
  }, [item.id, onDismiss, state]);

  // Auto-dismiss
  useEffect(() => {
    const timer = setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [dismiss]);

  // Entering → visible
  useEffect(() => {
    const t = requestAnimationFrame(() => setState("visible"));
    return () => cancelAnimationFrame(t);
  }, []);

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <div
      onClick={() => {
        if (item.onClick) {
          item.onClick();
          dismiss();
        }
      }}
      style={{
        position: "relative",
        display: "flex",
        alignItems: "center",
        gap: "14px",
        padding: "14px 16px",
        width: "380px",
        maxWidth: "calc(100vw - 32px)",
        background: "linear-gradient(135deg, #fff5f7 0%, #FDE2E9 100%)",
        borderRadius: "14px",
        boxShadow:
          "0 8px 32px -4px rgba(0,0,0,0.12), 0 4px 12px -2px rgba(0,0,0,0.05)",
        borderLeft: "4px solid #D24D77",
        cursor: item.onClick ? "pointer" : "default",
        overflow: "hidden",
        boxSizing: "border-box",
        fontFamily: "inherit",
        transform:
          state === "entering"
            ? "translateX(110%) scale(0.95)"
            : state === "leaving"
              ? "translateX(110%) scale(0.95)"
              : "translateX(0) scale(1)",
        opacity: state === "visible" ? 1 : 0,
        transition:
          "transform 0.34s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.34s ease",
      }}
    >
      {/* Avatar */}
      <div
        style={{
          width: "42px",
          height: "42px",
          borderRadius: "50%",
          backgroundColor: "#FFE8EF",
          color: "#D24D77",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          fontWeight: "700",
          fontSize: "14px",
          backgroundImage: item.avatar ? `url(${item.avatar})` : "none",
          backgroundSize: "cover",
          backgroundPosition: "center",
          border: "2px solid rgba(210, 77, 119, 0.15)",
          boxSizing: "border-box",
        }}
      >
        {!item.avatar && getInitials(item.title)}
      </div>

      {/* Content */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          minWidth: 0,
          gap: "3px",
        }}
      >
        {/* Label */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <MessageSquare size={12} color="#D24D77" style={{ flexShrink: 0 }} />
          <span
            style={{
              fontSize: "10px",
              fontWeight: "700",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "#D24D77",
            }}
          >
            New Message
          </span>
        </div>

        {/* Sender Name */}
        <span
          style={{
            fontWeight: "700",
            fontSize: "14px",
            color: "#141D23",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            letterSpacing: "-0.01em",
          }}
        >
          {item.title}
        </span>

        {/* Message Preview */}
        <span
          style={{
            fontSize: "12px",
            color: "#5C5F60",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            lineHeight: "1.4",
          }}
        >
          {item.body}
        </span>
      </div>

      {/* Close Button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          dismiss();
        }}
        aria-label="Close notification"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "4px",
          color: "#D24D77",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          borderRadius: "6px",
          transition: "background 0.15s, opacity 0.15s",
          outline: "none",
          opacity: 0.5,
          alignSelf: "flex-start",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(210, 77, 119, 0.1)";
          e.currentTarget.style.opacity = "1";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "none";
          e.currentTarget.style.opacity = "0.5";
        }}
      >
        <X size={15} />
      </button>

      {/* Progress Bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "3px",
          backgroundColor: "rgba(210, 77, 119, 0.1)",
        }}
      >
        <div
          style={{
            height: "100%",
            backgroundColor: "#D24D77",
            animation: `notifToastShrink ${AUTO_DISMISS_MS}ms linear forwards`,
            borderRadius: "0 2px 2px 0",
          }}
        />
      </div>
    </div>
  );
};

/* ─── Notification Toaster Container ─── */
export function NotificationToaster() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const onToast = (item) => {
      setToasts((prev) => [item, ...prev].slice(0, MAX_VISIBLE));
    };
    listeners.push(onToast);
    return () => {
      listeners = listeners.filter((fn) => fn !== onToast);
    };
  }, []);

  const handleDismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <>
      <style>{`
        @keyframes notifToastShrink {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
      <div
        style={{
          position: "fixed",
          top: "16px",
          right: "16px",
          zIndex: 9998,
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          pointerEvents: "none",
        }}
      >
        {toasts.map((t) => (
          <div key={t.id} style={{ pointerEvents: "auto" }}>
            <NotificationToastItem item={t} onDismiss={handleDismiss} />
          </div>
        ))}
      </div>
    </>
  );
}
