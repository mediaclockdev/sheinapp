import { useEffect, useState } from "react";

let listeners = [];
let id = 0;

export const toast = {
  success: (message) => emit({ type: "success", message }),
  error: (message) => emit({ type: "error", message }),
};

function emit(t) {
  const item = { ...t, id: ++id };
  listeners.forEach((fn) => fn(item));
}

export function Toaster() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const onToast = (item) => {
      setToasts((prev) => [...prev, item]);
      setTimeout(
        () => setToasts((prev) => prev.filter((t) => t.id !== item.id)),
        3000,
      );
    };
    listeners.push(onToast);
    return () => {
      listeners = listeners.filter((fn) => fn !== onToast);
    };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-2.5 rounded-lg shadow-lg text-sm font-semibold text-white ${
            t.type === "success" ? "bg-green-600" : "bg-red-500"
          }`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
