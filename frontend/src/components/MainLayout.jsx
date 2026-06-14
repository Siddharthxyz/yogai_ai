import { createContext, useContext, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useScroll, useTransform } from "framer-motion";
import {
  Bell,
  ChefHat,
  Dumbbell,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Search,
  Sparkles,
  Sun,
  User,
  Wind,
  X,
} from "lucide-react";
import { cn, Button } from "./ui";
import { useAuth } from "../context/AuthContext";
import { useStats } from "../context/StatsContext";
import { useToast } from "./Toast";

// ─── Search Context (replaces cloneElement prop-drilling) ─────────────────────
export const SearchContext = createContext("");
export function useSearch() { return useContext(SearchContext); }

const navItems = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Yoga Flow",  path: "/yoga",      icon: Wind },
  { name: "AI Kitchen", path: "/recipe",    icon: ChefHat },
  { name: "Exercise AI",path: "/exercise",  icon: Dumbbell },
];

export default function MainLayout({ children }) {
  const [theme, setTheme]           = useState(() => localStorage.getItem("yogai_theme") || "dark");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  const location = useLocation();
  const navigate  = useNavigate();
  const { user, logout } = useAuth();
  const { addHydration } = useStats();
  const toast = useToast();

  const { scrollY } = useScroll();
  const bgY     = useTransform(scrollY, [0, 1000], [0, 250]);
  const bgScale = useTransform(scrollY, [0, 1000], [1, 1.1]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("yogai_theme", theme);
  }, [theme]);

  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  // Hydration Reminder
  useEffect(() => {
    const triggerHydration = () => {
      setNotifications(prev => [
        {
          id: Date.now(),
          type: "hydration",
          title: "Time to Hydrate!",
          message: "Drink a glass of water (250ml) to maintain optimal neural focus.",
          action: "Confirm Drink"
        },
        ...prev
      ]);
    };

    // Trigger shortly after load for testing/visibility
    const initialTimer = setTimeout(triggerHydration, 5000);
    // Then every 30 minutes
    const hydrationInterval = setInterval(triggerHydration, 30 * 60 * 1000);
    
    return () => {
      clearTimeout(initialTimer);
      clearInterval(hydrationInterval);
    };
  }, []);

  const handleNotificationAction = (notif) => {
    if (notif.type === "hydration") {
      addHydration(0.25);
      toast.success("Hydration Logged", "Added +250ml to your daily tracker.");
    }
    setNotifications(prev => prev.filter(n => n.id !== notif.id));
    setNotificationsOpen(false);
  };

  const dismissNotification = (e, id) => {
    e.stopPropagation();
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleLogout = () => {
    logout();
    toast.info("Signed out", "See you next time!");
    navigate("/login");
  };

  // Avatar initials
  const initials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";

  return (
    <SearchContext.Provider value={searchQuery}>
      <div className="min-h-screen bg-canvas text-slate-900 dark:text-slate-100">
        {/* ── Parallax Background ── */}
        <div className="pointer-events-none fixed inset-0 overflow-hidden bg-[#0B0F19]">
          <motion.div style={{ y: bgY, scale: bgScale }} className="absolute inset-0">
            {/* Dynamic Grid */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>
            
            {/* Animated Glowing Orbs */}
            <motion.div 
              animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }} 
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute right-[-10rem] top-[-5rem] h-[500px] w-[500px] rounded-full bg-primary-500/20 blur-[120px]" 
            />
            <motion.div 
              animate={{ scale: [1, 1.5, 1], opacity: [0.2, 0.5, 0.2] }} 
              transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
              className="absolute left-[-10rem] top-[20rem] h-[600px] w-[600px] rounded-full bg-purple-500/15 blur-[130px]" 
            />
            <motion.div 
              animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }} 
              transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 4 }}
              className="absolute bottom-[-10rem] right-[20rem] h-[400px] w-[400px] rounded-full bg-emerald-500/15 blur-[100px]" 
            />
          </motion.div>
        </div>

        <div className="relative flex min-h-screen">
          {/* ── Desktop Sidebar ── */}
          <aside className="glass-panel fixed left-0 top-0 z-40 hidden h-screen w-72 border-r border-white/10 px-5 py-6 lg:flex lg:flex-col">
            <Link to="/dashboard" className="flex items-center gap-3 px-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-400 to-cyan-300 text-slate-950 shadow-[0_18px_40px_rgba(96,165,250,0.35)]">
                <Sparkles size={18} />
              </div>
              <div>
                <p className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">YogAI</p>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Neural Wellness</p>
              </div>
            </Link>

            <nav className="mt-10 flex-1 space-y-2">
              {navItems.map((item) => {
                const active = location.pathname === item.path;
                return (
                  <Link key={item.path} to={item.path}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                      active
                        ? "bg-white/12 text-slate-950 dark:text-white"
                        : "text-slate-600 hover:bg-white/7 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
                    )}
                  >
                    {active && (
                      <motion.div layoutId="sidebar-glow"
                        className="absolute inset-0 rounded-2xl border border-white/10 bg-gradient-to-r from-primary-400/20 to-cyan-300/10" />
                    )}
                    <span className="relative z-10 rounded-xl bg-white/8 p-2"><item.icon size={18} /></span>
                    <span className="relative z-10">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* User profile panel at bottom */}
            <div className="relative mt-4 border-t border-white/8 pt-4">
              <button
                type="button"
                onClick={() => setProfileOpen((o) => !o)}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 transition hover:bg-white/8"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400/60 to-cyan-400/60 text-sm font-bold text-white">
                  {initials}
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <p className="truncate text-sm font-semibold text-white">{user?.name || "User"}</p>
                  <p className="truncate text-xs text-slate-500">{user?.email || ""}</p>
                </div>
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="absolute bottom-full left-0 right-0 mb-2 rounded-2xl border border-white/10 bg-slate-900/90 p-2 backdrop-blur-xl"
                  >
                    <Link to="/profile" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-white/8 hover:text-white transition">
                      <User size={15} /> View Profile
                    </Link>
                    <button type="button" onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 transition">
                      <LogOut size={15} /> Sign Out
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </aside>

          {/* ── Mobile Drawer ── */}
          <AnimatePresence>
            {mobileOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm lg:hidden">
                <motion.aside
                  initial={{ x: -24, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -24, opacity: 0 }}
                  className="glass-panel h-full w-72 border-r border-white/10 px-5 py-6 flex flex-col"
                >
                  <div className="flex items-center justify-between">
                    <Link to="/dashboard" className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-400 to-cyan-300 text-slate-950">
                        <Sparkles size={18} />
                      </div>
                      <span className="text-lg font-semibold text-white">YogAI</span>
                    </Link>
                    <button type="button" onClick={() => setMobileOpen(false)}
                      className="rounded-xl border border-white/10 p-2 text-slate-300">
                      <X size={18} />
                    </button>
                  </div>

                  <nav className="mt-10 flex-1 space-y-2">
                    {navItems.map((item) => {
                      const active = location.pathname === item.path;
                      return (
                        <Link key={item.path} to={item.path}
                          className={cn("flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium",
                            active ? "bg-white/12 text-white" : "text-slate-300 hover:bg-white/7")}>
                          <span className="rounded-xl bg-white/8 p-2"><item.icon size={18} /></span>
                          {item.name}
                        </Link>
                      );
                    })}
                  </nav>

                  <div className="border-t border-white/8 pt-4">
                    <Link to="/profile" onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-slate-300 hover:bg-white/8 transition">
                      <User size={15} /> Profile
                    </Link>
                    <button type="button" onClick={handleLogout}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-rose-400 hover:bg-rose-500/10 transition">
                      <LogOut size={15} /> Sign Out
                    </button>
                  </div>
                </motion.aside>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Main Content ── */}
          <div className="flex min-w-0 flex-1 flex-col lg:pl-72">
            {/* Top Header */}
            <header className="sticky top-0 z-30 border-b border-white/8 bg-white/55 px-4 py-4 backdrop-blur-xl dark:bg-slate-950/55 sm:px-6 lg:px-8">
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setMobileOpen(true)}
                  className="glass-panel rounded-2xl p-3 lg:hidden">
                  <Menu size={18} />
                </button>

                <div className="glass-panel flex flex-1 items-center gap-3 rounded-2xl px-4 py-3">
                  <Search size={18} className="text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search metrics..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent text-sm text-inherit outline-none placeholder:text-slate-400"
                  />
                </div>

                <button type="button" onClick={toggleTheme}
                  className="glass-panel flex h-12 w-12 items-center justify-center rounded-2xl"
                  aria-label="Toggle theme">
                  {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
                </button>

                <div className="relative">
                  <button 
                    type="button" 
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className="glass-panel relative flex h-12 w-12 items-center justify-center rounded-2xl" 
                    aria-label="Notifications"
                  >
                    <Bell size={18} />
                    {notifications.length > 0 && (
                      <span className="absolute right-3 top-3 flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500 shadow-[0_0_16px_rgba(103,232,249,0.8)]"></span>
                      </span>
                    )}
                  </button>

                  <AnimatePresence>
                    {notificationsOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.95 }}
                        className="absolute right-0 top-full mt-2 w-80 rounded-2xl border border-white/10 bg-slate-900/95 p-3 backdrop-blur-xl shadow-2xl z-50"
                      >
                        <div className="flex items-center justify-between px-2 pb-2 border-b border-white/10 mb-2">
                          <h3 className="text-sm font-semibold text-white">Notifications</h3>
                          {notifications.length > 0 && (
                            <span className="text-xs bg-white/10 px-2 py-0.5 rounded-full text-slate-300">{notifications.length}</span>
                          )}
                        </div>
                        
                        {notifications.length === 0 ? (
                          <div className="py-6 text-center text-sm text-slate-400">
                            You're all caught up!
                          </div>
                        ) : (
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            {notifications.map(notif => (
                              <div key={notif.id} className="relative group rounded-xl bg-white/5 p-3 hover:bg-white/10 transition border border-white/5">
                                <button 
                                  onClick={(e) => dismissNotification(e, notif.id)}
                                  className="absolute top-2 right-2 text-slate-500 hover:text-white opacity-0 group-hover:opacity-100 transition"
                                >
                                  <X size={14} />
                                </button>
                                <h4 className="text-sm font-semibold text-white flex items-center gap-2">
                                  {notif.type === "hydration" && <Wind size={14} className="text-cyan-400" />}
                                  {notif.title}
                                </h4>
                                <p className="text-xs text-slate-400 mt-1 mb-3 pr-4">{notif.message}</p>
                                {notif.action && (
                                  <Button 
                                    variant="primary" 
                                    className="w-full py-2 text-xs"
                                    onClick={() => handleNotificationAction(notif)}
                                  >
                                    {notif.action}
                                  </Button>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <Link to="/profile" className="glass-panel relative flex h-12 w-12 items-center justify-center rounded-2xl font-bold text-sm text-white" aria-label="Profile">
                  {initials}
                </Link>
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
                  {children}
                </motion.div>
              </AnimatePresence>
            </main>
          </div>
        </div>
      </div>
    </SearchContext.Provider>
  );
}
