import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { cn } from "./ui";

// ─── Context ──────────────────────────────────────────────────────────────────
const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
};

const STYLES = {
  success: {
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/12",
    icon: "text-emerald-400",
    progress: "bg-emerald-400",
  },
  warning: {
    border: "border-amber-500/30",
    bg: "bg-amber-500/12",
    icon: "text-amber-400",
    progress: "bg-amber-400",
  },
  error: {
    border: "border-rose-500/30",
    bg: "bg-rose-500/12",
    icon: "text-rose-400",
    progress: "bg-rose-400",
  },
  info: {
    border: "border-indigo-500/30",
    bg: "bg-indigo-500/12",
    icon: "text-indigo-400",
    progress: "bg-indigo-400",
  },
};

// ─── Provider ─────────────────────────────────────────────────────────────────
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ type = "info", title, message, duration = 4000 }) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, type, title, message, duration }]);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 w-80 pointer-events-none">
        <AnimatePresence>
          {toasts.map((toast) => (
            <Toast key={toast.id} {...toast} onDismiss={() => removeToast(toast.id)} />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");

  return {
    success: (title, message) => ctx.addToast({ type: "success", title, message }),
    warning: (title, message) => ctx.addToast({ type: "warning", title, message }),
    error: (title, message) => ctx.addToast({ type: "error", title, message }),
    info: (title, message) => ctx.addToast({ type: "info", title, message }),
  };
}

// ─── Single Toast ─────────────────────────────────────────────────────────────
function Toast({ id, type, title, message, duration, onDismiss }) {
  const s = STYLES[type] ?? STYLES.info;
  const Icon = ICONS[type] ?? Info;
  const [progress, setProgress] = useState(100);
  const intervalRef = useRef(null);

  useEffect(() => {
    const tick = 50; // ms
    const steps = duration / tick;
    let current = 100;

    intervalRef.current = setInterval(() => {
      current -= 100 / steps;
      setProgress(Math.max(0, current));
      if (current <= 0) {
        clearInterval(intervalRef.current);
        onDismiss();
      }
    }, tick);

    return () => clearInterval(intervalRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 40, scale: 0.92 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40, scale: 0.92 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className={cn(
        "pointer-events-auto relative overflow-hidden rounded-3xl border backdrop-blur-xl",
        s.border,
        s.bg
      )}
    >
      <div className="flex items-start gap-3 px-4 py-4">
        <div className={cn("mt-0.5 shrink-0", s.icon)}>
          <Icon size={18} />
        </div>
        <div className="min-w-0 flex-1">
          {title && <p className="text-sm font-semibold text-white">{title}</p>}
          {message && (
            <p className="mt-0.5 text-sm leading-5 text-slate-300">{message}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 rounded-lg p-1 text-slate-400 hover:text-white transition"
        >
          <X size={14} />
        </button>
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 h-0.5 w-full bg-white/5">
        <motion.div
          className={cn("h-full", s.progress)}
          style={{ width: `${progress}%` }}
          transition={{ duration: 0.05 }}
        />
      </div>
    </motion.div>
  );
}
