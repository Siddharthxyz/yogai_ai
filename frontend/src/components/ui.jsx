import { motion } from "framer-motion";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function Card({ className, glow = "indigo", children }) {
  const glowMap = {
    indigo: "from-primary-500/18 via-sky-400/8 to-transparent",
    emerald: "from-emerald-400/18 via-primary-500/8 to-transparent",
    rose: "from-rose-400/18 via-orange-400/8 to-transparent",
    amber: "from-amber-300/18 via-orange-400/8 to-transparent",
  };

  return (
    <motion.div
      initial={{ scale: 1 }}
      animate={{ scale: [1, 1.006, 1] }}
      transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      className={cn(
        "glass-panel relative overflow-hidden rounded-3xl border border-white/10 p-6 shadow-soft sm:p-8",
        className
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-br opacity-80 blur-2xl transition-opacity duration-700",
          glowMap[glow]
        )}
      />
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

export function Button({
  className,
  variant = "primary",
  children,
  ...props
}) {
  const variants = {
    primary:
      "bg-primary-500 text-slate-950 shadow-[0_18px_50px_rgba(96,165,250,0.35)] hover:bg-primary-400 border border-transparent",
    secondary:
      "border border-white/12 bg-white/6 text-slate-100 hover:bg-white/10",
    ghost:
      "text-slate-300 hover:bg-white/6 hover:text-white border border-transparent",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.95 }}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-semibold transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-60",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </motion.button>
  );
}

export function MetricBox({
  label,
  value,
  delta,
  icon: Icon,
  tone = "indigo",
  className,
}) {
  const toneMap = {
    indigo: "bg-primary-500/14 text-primary-200",
    emerald: "bg-emerald-400/14 text-emerald-200",
    rose: "bg-rose-400/14 text-rose-200",
    amber: "bg-amber-300/14 text-amber-100",
  };

  return (
    <Card className={cn("min-h-[170px]", className)} glow={tone}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">
            {label}
          </p>
          <h3 className="mt-4 text-3xl font-semibold tracking-tight text-white">
            {value}
          </h3>
          {delta ? (
            <p className="mt-2 text-sm text-slate-400">{delta}</p>
          ) : null}
        </div>
        {Icon ? (
          <div className={cn("rounded-2xl p-3", toneMap[tone])}>
            <Icon size={20} />
          </div>
        ) : null}
      </div>
    </Card>
  );
}

export function ProgressPill({ label, value, className }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/8 bg-white/5 px-4 py-3",
        className
      )}
    >
      <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-xl font-semibold text-white">{value}</p>
    </div>
  );
}

export function FadeIn({ children, delay = 0, className }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.98, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.98, y: -15 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
