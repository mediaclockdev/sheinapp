import { useEffect } from "react";
import { CheckCircle2, X } from "lucide-react";

const SuccessToast = ({ message, onClose }) => {
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex items-center gap-2 bg-[#166534] text-white px-4 py-3 rounded-lg shadow-lg">
      <CheckCircle2 size={18} className="shrink-0" />
      <span className="text-sm font-medium">{message}</span>
      <button
        onClick={onClose}
        className="ml-2 text-white/80 hover:text-white"
      >
        <X size={14} />
      </button>
    </div>
  );
};

export default SuccessToast;
