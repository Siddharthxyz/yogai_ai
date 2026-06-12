import { motion } from "framer-motion";
import { cn } from "./ui";

/**
 * Loader — versatile loading indicator
 * @param {string} size   — "sm" | "md" | "lg" | "xl"
 * @param {string} variant — "spinner" | "dots" | "pulse"
 * @param {string} label  — optional text below the spinner
 * @param {string} className
 */
export default function Loader({ size = "md", variant = "spinner", label, className }) {
  const sizeMap = {
    sm: "h-5 w-5",
    md: "h-8 w-8",
    lg: "h-12 w-12",
    xl: "h-16 w-16",
  };

  if (variant === "dots") {
    return (
      <div className={cn("flex flex-col items-center gap-3", className)}>
        <div className="flex items-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-2.5 w-2.5 rounded-full bg-primary-400"
              animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
            />
          ))}
        </div>
        {label && <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>}
      </div>
    );
  }

  if (variant === "pulse") {
    return (
      <div className={cn("flex flex-col items-center gap-3", className)}>
        <motion.div
          className={cn("rounded-full bg-primary-400/30", sizeMap[size])}
          animate={{ scale: [1, 1.4, 1], opacity: [0.4, 0.9, 0.4] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
        />
        {label && <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>}
      </div>
    );
  }

  // Default: spinner
  return (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <motion.div
        className={cn(
          "rounded-full border-2 border-white/10 border-t-primary-400",
          sizeMap[size]
        )}
        animate={{ rotate: 360 }}
        transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
      />
      {label && <p className="text-xs uppercase tracking-[0.2em] text-slate-400">{label}</p>}
    </div>
  );
}

/** Full-page centered loader overlay */
export function PageLoader({ label = "Loading..." }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center gap-6"
      >
        {/* Logo pulse */}
        <motion.div
          className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary-400 to-cyan-300 text-slate-950 shadow-[0_18px_60px_rgba(96,165,250,0.4)]"
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <span className="text-3xl">🧘</span>
        </motion.div>

        <Loader size="md" variant="dots" label={label} />
      </motion.div>
    </div>
  );
}

/** Inline skeleton block for content placeholders */
export function Skeleton({ className }) {
  return (
    <motion.div
      className={cn("rounded-2xl bg-white/6", className)}
      animate={{ opacity: [0.4, 0.8, 0.4] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
    />
  );
}
