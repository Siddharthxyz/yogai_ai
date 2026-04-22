import { Children, cloneElement, isValidElement, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import {
  Bell,
  ChefHat,
  Dumbbell,
  LayoutDashboard,
  Menu,
  Moon,
  Search,
  Sparkles,
  Sun,
  User,
  Wind,
  X,
} from "lucide-react";
import { cn } from "./ui";

const navItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Yoga Flow", path: "/yoga", icon: Wind },
  { name: "AI Kitchen", path: "/recipe", icon: ChefHat },
  { name: "Exercise AI", path: "/exercise", icon: Dumbbell },
];

export default function MainLayout({ children }) {
  const [theme, setTheme] = useState("dark");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();

  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 1000], [0, 250]);
  const bgScale = useTransform(scrollY, [0, 1000], [1, 1.1]);

  const isEvening = new Date().getHours() >= 17 || new Date().getHours() <= 4;

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const toggleTheme = () => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  };

  const childrenWithSearch = Children.map(children, (child) => {
    if (!isValidElement(child)) {
      return child;
    }

    return cloneElement(child, { searchQuery });
  });

  return (
    <div className="min-h-screen bg-canvas text-slate-900 dark:text-slate-100">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <motion.div style={{ y: bgY, scale: bgScale }} className="absolute inset-0">
          <div className="absolute inset-x-0 top-0 h-[460px] bg-[radial-gradient(circle_at_top,_rgba(96,165,250,0.18),_transparent_52%)]" />
          <div
            className={cn(
              "absolute right-[-8rem] top-24 h-80 w-80 rounded-full blur-3xl transition-colors duration-1000",
              isEvening ? "bg-orange-500/10 dark:bg-orange-500/15" : "bg-cyan-400/10 dark:bg-cyan-400/12"
            )}
          />
          <div
            className={cn(
              "absolute bottom-0 left-[-6rem] h-96 w-96 rounded-full blur-3xl transition-colors duration-1000",
              isEvening ? "bg-rose-500/10 dark:bg-rose-500/15" : "bg-indigo-500/10 dark:bg-indigo-500/14"
            )}
          />
        </motion.div>
      </div>

      <div className="relative flex min-h-screen">
        <aside className="glass-panel fixed left-0 top-0 z-40 hidden h-screen w-72 border-r border-white/10 px-5 py-6 lg:flex lg:flex-col">
          <Link to="/dashboard" className="flex items-center gap-3 px-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-400 to-cyan-300 text-slate-950 shadow-[0_18px_40px_rgba(96,165,250,0.35)]">
              <Sparkles size={18} />
            </div>
            <div>
              <p className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                YogAI
              </p>
              <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                Neural Wellness
              </p>
            </div>
          </Link>

          <nav className="mt-10 space-y-2">
            {navItems.map((item) => {
              const active = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                    active
                      ? "bg-white/12 text-slate-950 dark:text-white"
                      : "text-slate-600 hover:bg-white/7 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
                  )}
                >
                  {active ? (
                    <motion.div
                      layoutId="sidebar-glow"
                      className="absolute inset-0 rounded-2xl border border-white/10 bg-gradient-to-r from-primary-400/20 to-cyan-300/10"
                    />
                  ) : null}
                  <span className="relative z-10 rounded-xl bg-white/8 p-2">
                    <item.icon size={18} />
                  </span>
                  <span className="relative z-10">{item.name}</span>
                </Link>
              );
            })}
          </nav>

        </aside>

        <AnimatePresence>
          {mobileOpen ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm lg:hidden"
            >
              <motion.aside
                initial={{ x: -24, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: -24, opacity: 0 }}
                className="glass-panel h-full w-72 border-r border-white/10 px-5 py-6"
              >
                <div className="flex items-center justify-between">
                  <Link to="/dashboard" className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-400 to-cyan-300 text-slate-950">
                      <Sparkles size={18} />
                    </div>
                    <span className="text-lg font-semibold text-white">YogAI</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => setMobileOpen(false)}
                    className="rounded-xl border border-white/10 p-2 text-slate-300"
                  >
                    <X size={18} />
                  </button>
                </div>

                <nav className="mt-10 space-y-2">
                  {navItems.map((item) => {
                    const active = location.pathname === item.path;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        className={cn(
                          "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium",
                          active
                            ? "bg-white/12 text-white"
                            : "text-slate-300 hover:bg-white/7"
                        )}
                      >
                        <span className="rounded-xl bg-white/8 p-2">
                          <item.icon size={18} />
                        </span>
                        {item.name}
                      </Link>
                    );
                  })}
                </nav>
              </motion.aside>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="flex min-w-0 flex-1 flex-col lg:pl-72">
          <header className="sticky top-0 z-30 border-b border-white/8 bg-white/55 px-4 py-4 backdrop-blur-xl dark:bg-slate-950/55 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                className="glass-panel rounded-2xl p-3 lg:hidden"
              >
                <Menu size={18} />
              </button>

              <div className="glass-panel flex flex-1 items-center gap-3 rounded-2xl px-4 py-3">
                <Search size={18} className="text-slate-400" />
                <input
                  type="text"
                  placeholder="Search metrics..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-full bg-transparent text-sm text-inherit outline-none placeholder:text-slate-400"
                />
              </div>

              <button
                type="button"
                onClick={toggleTheme}
                className="glass-panel flex h-12 w-12 items-center justify-center rounded-2xl"
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              <button
                type="button"
                className="glass-panel relative flex h-12 w-12 items-center justify-center rounded-2xl"
                aria-label="Notifications"
              >
                <Bell size={18} />
                <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_16px_rgba(103,232,249,0.8)]" />
              </button>

              <button
                type="button"
                className="glass-panel relative flex h-12 w-12 items-center justify-center rounded-2xl"
                aria-label="Settings and Profile"
              >
                <User size={18} />
              </button>

            </div>
          </header>

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, x: 20, filter: "blur(4px)" }}
                animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, x: -20, filter: "blur(4px)" }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              >
                {childrenWithSearch}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}
