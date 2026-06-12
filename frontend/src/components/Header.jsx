import { motion } from "framer-motion";
import { cn } from "./ui";

/**
 * Header — reusable page-level header block
 *
 * @param {string}      label      — small pill label, e.g. "Yoga Flow"
 * @param {string}      title      — main heading
 * @param {string}      subtitle   — supporting text
 * @param {ReactNode}   actions    — buttons / controls on the right
 * @param {string}      className
 */
export default function Header({ label, title, subtitle, actions, className }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between",
        className
      )}
    >
      <div className="max-w-2xl">
        {label && (
          <span className="section-label">{label}</span>
        )}
        {title && (
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            {title}
          </h1>
        )}
        {subtitle && (
          <p className="mt-4 text-base leading-7 text-slate-300">{subtitle}</p>
        )}
      </div>

      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-3">
          {actions}
        </div>
      )}
    </motion.div>
  );
}

/**
 * SectionHeader — lighter in-page section heading
 */
export function SectionHeader({ icon: Icon, title, className }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      {Icon && <Icon size={20} className="text-primary-200" />}
      <h2 className="text-2xl font-semibold text-white">{title}</h2>
    </div>
  );
}
