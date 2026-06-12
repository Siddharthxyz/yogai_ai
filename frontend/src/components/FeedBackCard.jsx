import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, XCircle, Info } from "lucide-react";
import { cn } from "./ui";

const VARIANTS = {
  success: {
    icon: CheckCircle2,
    border: "border-emerald-500/30",
    bg: "bg-emerald-500/10",
    glow: "shadow-[0_0_24px_rgba(52,211,153,0.12)]",
    iconColor: "text-emerald-400",
    badge: "bg-emerald-500/20 text-emerald-300",
  },
  warning: {
    icon: AlertTriangle,
    border: "border-amber-500/30",
    bg: "bg-amber-500/10",
    glow: "shadow-[0_0_24px_rgba(245,158,11,0.12)]",
    iconColor: "text-amber-400",
    badge: "bg-amber-500/20 text-amber-300",
  },
  error: {
    icon: XCircle,
    border: "border-rose-500/30",
    bg: "bg-rose-500/10",
    glow: "shadow-[0_0_24px_rgba(244,63,94,0.12)]",
    iconColor: "text-rose-400",
    badge: "bg-rose-500/20 text-rose-300",
  },
  info: {
    icon: Info,
    border: "border-indigo-500/30",
    bg: "bg-indigo-500/10",
    glow: "shadow-[0_0_24px_rgba(99,102,241,0.12)]",
    iconColor: "text-indigo-400",
    badge: "bg-indigo-500/20 text-indigo-300",
  },
};

/**
 * FeedBackCard — AI-generated feedback card with score and message
 *
 * @param {"success"|"warning"|"error"|"info"} type
 * @param {string} title      — e.g. "Form is Correct"
 * @param {string} message    — e.g. "Keep your shoulder stable"
 * @param {number|null} score — 0-100, renders a score ring if provided
 * @param {string} label      — badge label, e.g. "FORM ANALYSIS"
 * @param {string} className
 */
export default function FeedBackCard({
  type = "info",
  title,
  message,
  score = null,
  label,
  className,
}) {
  const v = VARIANTS[type] ?? VARIANTS.info;
  const Icon = v.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-3xl border p-5 backdrop-blur-md",
        v.border,
        v.bg,
        v.glow,
        className
      )}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={cn("rounded-2xl bg-white/8 p-2.5", v.iconColor)}>
            <Icon size={20} />
          </div>
          <div>
            {label && (
              <p className={cn("mb-1 text-[10px] font-bold uppercase tracking-[0.22em]", v.badge, "inline-block rounded-full px-2 py-0.5")}>
                {label}
              </p>
            )}
            {title && (
              <p className="text-sm font-semibold text-white">{title}</p>
            )}
          </div>
        </div>

        {/* Score ring */}
        {score !== null && (
          <ScoreRing value={score} color={v.iconColor} />
        )}
      </div>

      {/* Message */}
      {message && (
        <p className="mt-3 text-sm leading-6 text-slate-300">{message}</p>
      )}

      {/* Subtle animated border pulse */}
      <motion.div
        className={cn("pointer-events-none absolute inset-0 rounded-3xl border", v.border)}
        animate={{ opacity: [0.3, 0.7, 0.3] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  );
}

function ScoreRing({ value, color }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;

  return (
    <div className="relative flex h-14 w-14 shrink-0 items-center justify-center">
      <svg className="-rotate-90" width="56" height="56" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth="4" />
        <circle
          cx="28"
          cy="28"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className={color}
        />
      </svg>
      <span className="absolute text-xs font-bold text-white">{value}%</span>
    </div>
  );
}
