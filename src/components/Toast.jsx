import { useEffect, useState } from "react";
import {
  CheckCircle2,
  AlertTriangle,
  Info,
  XCircle,
  Power,
  PowerOff,
  X,
} from "lucide-react";

let listeners = [];
let idCounter = 0;

export const toast = {
  success: (message) => emit({ type: "success", message }),
  error: (message) => emit({ type: "error", message }),
  info: (message) => emit({ type: "info", message }),
  warning: (message) => emit({ type: "warning", message }),
  active: (message) => emit({ type: "active", message }),
  inactive: (message) => emit({ type: "inactive", message }),
  show: ({ type, message }) => emit({ type, message }),
};

function emit(payload) {
  const item = { ...payload, id: ++idCounter, createdAt: Date.now() };
  listeners.forEach((fn) => fn(item));
}

export function Toaster() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const onToast = (item) => {
      setToasts((prev) => [...prev, item]);
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== item.id)),
        4000,
      );
    };
    listeners.push(onToast);
    return () => {
      listeners = listeners.filter((fn) => fn !== onToast);
    };
  }, []);

  const removeToast = (idToRemove) => {
    setToasts((prev) => prev.filter((t) => t.id !== idToRemove));
  };

  const getToastConfig = (type) => {
    switch (type) {
      case "active":
        return {
          bg: "bg-emerald-600 border-emerald-700 text-white shadow-emerald-900/20",
          icon: <Power size={18} className="shrink-0 text-emerald-100" />,
          label: "Active",
          labelBg: "bg-emerald-700/80 text-emerald-100",
        };
      case "inactive":
        return {
          bg: "bg-amber-600 border-amber-700 text-white shadow-amber-900/20",
          icon: <PowerOff size={18} className="shrink-0 text-amber-100" />,
          label: "Inactive",
          labelBg: "bg-amber-700/80 text-amber-100",
        };
      case "success":
        return {
          bg: "bg-emerald-600 border-emerald-700 text-white shadow-emerald-900/20",
          icon: <CheckCircle2 size={18} className="shrink-0 text-emerald-100" />,
        };
      case "warning":
        return {
          bg: "bg-amber-600 border-amber-700 text-white shadow-amber-900/20",
          icon: <AlertTriangle size={18} className="shrink-0 text-amber-100" />,
        };
      case "info":
        return {
          bg: "bg-blue-600 border-blue-700 text-white shadow-blue-900/20",
          icon: <Info size={18} className="shrink-0 text-blue-100" />,
        };
      case "error":
      default:
        return {
          bg: "bg-rose-600 border-rose-700 text-white shadow-rose-900/20",
          icon: <XCircle size={18} className="shrink-0 text-rose-100" />,
        };
    }
  };

  return (
    <div className="fixed top-5 right-5 z-[200] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => {
        const config = getToastConfig(t.type);
        return (
          <div
            key={t.id}
            className={`pointer-events-auto flex items-center justify-between gap-3 px-4 py-3 rounded-xl border shadow-xl transition-all duration-300 transform ${config.bg}`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              {config.icon}
              {config.label && (
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md shrink-0 ${config.labelBg}`}
                >
                  {config.label}
                </span>
              )}
              <span className="text-sm font-medium leading-snug truncate">
                {t.message}
              </span>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 opacity-75 hover:opacity-100 transition-opacity p-0.5 rounded-md hover:bg-white/10"
              aria-label="Close Toast"
            >
              <X size={15} />
            </button>
          </div>
        );
      })}
    </div>
  );
}
