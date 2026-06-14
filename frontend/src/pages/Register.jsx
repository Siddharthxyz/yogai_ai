import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Sparkles,
  User,
  CheckCircle2,
  Zap,
  Brain,
  Leaf,
  Dumbbell,
  Heart,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { cn } from "../components/ui";

const GOALS = [
  { label: "Yoga & Flexibility", icon: "🧘" },
  { label: "Weight Loss", icon: "🔥" },
  { label: "Muscle Gain", icon: "💪" },
  { label: "Stress Relief", icon: "🧠" },
  { label: "Better Nutrition", icon: "🥗" },
  { label: "Cardio Fitness", icon: "❤️" },
];

const FEATURES = [
  { icon: Brain, label: "AI-Powered Coaching", desc: "Groq Llama 3 analyses your form in real-time" },
  { icon: Zap, label: "Live Pose Detection", desc: "MediaPipe tracks 33 body landmarks instantly" },
  { icon: Leaf, label: "Smart Nutrition", desc: "YOLO ingredient detection meets AI meal planning" },
  { icon: Dumbbell, label: "Rep Counting", desc: "Computer vision counts every rep with form feedback" },
];

export default function Register() {
  const [mode, setMode] = useState("login");
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [goals, setGoals] = useState([]);
  const [showPass, setShowPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));
  const toggleGoal = (g) =>
    setGoals((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));

  const handleSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (mode === "register" && step === 1) {
      if (!form.name.trim()) return toast.warning("Missing field", "Please enter your name.");
      if (!form.email.includes("@")) return toast.warning("Invalid email", "Enter a valid email.");
      if (form.password.length < 6) return toast.warning("Weak password", "Password must be at least 6 characters.");
      if (form.password !== form.confirmPassword) return toast.error("Mismatch", "Passwords do not match.");
      setStep(2);
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await login({ email: form.email, password: form.password });
        toast.success("Welcome back!", "You're now logged in.");
      } else {
        const selectedGoals = goals.map(g => g); // already strings
        await register({ name: form.name, email: form.email, password: form.password, goals: selectedGoals });
        toast.success("Account created!", `Welcome to YogAI, ${form.name}!`);
      }
      navigate("/dashboard");
    } catch (err) {
      toast.error("Auth failed", err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-950">
      {/* ── Left Panel: Visual ── */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900" />
        {/* Glows */}
        <div className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-violet-600/20 blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-cyan-500/15 blur-[100px]" />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)", backgroundSize: "60px 60px" }}
        />

        {/* Content */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-400 to-cyan-400">
              <Sparkles size={20} className="text-slate-950" />
            </div>
            <span className="text-xl font-black text-white tracking-tight">YogAI</span>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <div>
            <h2 className="text-4xl font-black leading-tight">
              <span style={{ color: '#e2e8f0' }}>Your body.</span><br />
              <span className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                Amplified by AI.
              </span>
            </h2>
            <p className="mt-4 text-base leading-relaxed max-w-sm" style={{ color: '#94a3b8' }}>
              Join thousands who train smarter with real-time pose correction, AI nutrition, and personalised streaks.
            </p>
          </div>

          <div className="space-y-4">
            {FEATURES.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-4">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/8 border border-white/10">
                  <Icon size={16} className="text-violet-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#e2e8f0' }}>{label}</p>
                  <p className="text-xs mt-0.5" style={{ color: '#94a3b8' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/5 p-4 backdrop-blur-sm">
            <Heart size={16} className="text-rose-400 shrink-0" />
            <p className="text-xs" style={{ color: '#94a3b8' }}>
              <span className="font-semibold" style={{ color: '#e2e8f0' }}>2,400+ active users</span> tracking their wellness journey with AI
            </p>
          </div>
        </div>
      </div>

      {/* ── Right Panel: Form ── */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 relative">
        <div className="absolute inset-0 bg-slate-950 lg:bg-slate-900/50" />
        {/* Mobile glow */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full bg-violet-600/10 blur-[80px] lg:hidden" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 w-full max-w-md"
        >
          {/* Mobile Logo */}
          <div className="mb-8 flex flex-col items-center gap-2 lg:hidden">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-400 to-cyan-400">
              <Sparkles size={22} className="text-slate-950" />
            </div>
            <h1 className="text-2xl font-black text-white">YogAI</h1>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Neural Wellness</p>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="text-2xl font-black" style={{ color: '#f1f5f9' }}>
              {mode === "login" ? "Welcome back" : step === 1 ? "Create your account" : "Set your goals"}
            </h2>
            <p className="mt-1 text-sm" style={{ color: '#94a3b8' }}>
              {mode === "login"
                ? "Sign in to continue your wellness journey."
                : step === 1
                ? "Start your AI-powered wellness journey today."
                : "Choose what matters most to you — you can change this anytime."}
            </p>
          </div>

          {/* Mode toggle */}
          <div className="mb-8 flex rounded-xl border border-white/10 bg-white/5 p-1">
            {["login", "register"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setStep(1); }}
                className={cn(
                  "flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all duration-200",
                  mode === m
                    ? "bg-gradient-to-r from-violet-500/30 to-cyan-500/20 text-white border border-violet-400/30 shadow-sm"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                {m === "login" ? "Sign In" : "Create Account"}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {/* ── Step 1: Credentials ── */}
            {step === 1 && (
              <motion.form
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {mode === "register" && (
                  <InputField
                    icon={User}
                    type="text"
                    placeholder="Full name"
                    value={form.name}
                    onChange={set("name")}
                    label="Name"
                  />
                )}
                <InputField
                  icon={Mail}
                  type="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={set("email")}
                  label="Email"
                />
                <InputField
                  icon={Lock}
                  type={showPass ? "text" : "password"}
                  placeholder="Password"
                  value={form.password}
                  onChange={set("password")}
                  label="Password"
                  suffix={
                    <button type="button" onClick={() => setShowPass(s => !s)} className="text-slate-500 hover:text-white transition">
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                />
                {mode === "register" && (
                  <InputField
                    icon={Lock}
                    type={showConfirmPass ? "text" : "password"}
                    placeholder="Confirm password"
                    value={form.confirmPassword}
                    onChange={set("confirmPassword")}
                    label="Confirm Password"
                    suffix={
                      <button type="button" onClick={() => setShowConfirmPass(s => !s)} className="text-slate-500 hover:text-white transition">
                        {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                  />
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative mt-2 flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 py-3.5 text-sm font-bold text-white shadow-[0_8px_32px_rgba(139,92,246,0.35)] transition-all hover:shadow-[0_8px_40px_rgba(139,92,246,0.55)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-violet-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative flex items-center gap-2">
                    {loading ? "Authenticating..." : mode === "login" ? "Sign In" : "Continue"}
                    {!loading && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
                  </span>
                </button>

                <div className="flex items-center gap-3 my-4">
                  <div className="flex-1 h-px bg-white/8" />
                  <span className="text-xs text-slate-600">or</span>
                  <div className="flex-1 h-px bg-white/8" />
                </div>

                <p className="text-center text-xs text-slate-500">
                  {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                  <button
                    type="button"
                    onClick={() => { setMode(mode === "login" ? "register" : "login"); setStep(1); }}
                    className="text-violet-400 hover:text-violet-300 font-semibold transition"
                  >
                    {mode === "login" ? "Create one free" : "Sign in instead"}
                  </button>
                </p>
              </motion.form>
            )}

            {/* ── Step 2: Goals ── */}
            {step === 2 && mode === "register" && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
              >
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {GOALS.map(({ label, icon }) => {
                    const active = goals.includes(label);
                    return (
                      <button
                        key={label}
                        type="button"
                        onClick={() => toggleGoal(label)}
                        className={cn(
                          "relative flex items-center gap-3 rounded-xl border px-3 py-3.5 text-left text-sm font-semibold transition-all duration-200",
                          active
                            ? "border-violet-400/50 bg-gradient-to-br from-violet-500/15 to-cyan-500/10 text-white shadow-[0_0_20px_rgba(139,92,246,0.15)]"
                            : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/8 hover:text-white hover:border-white/20"
                        )}
                      >
                        <span className="text-lg">{icon}</span>
                        <span className="text-xs leading-tight">{label}</span>
                        {active && (
                          <CheckCircle2 size={14} className="absolute top-2 right-2 text-violet-400 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSubmit}
                  className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-violet-500 to-cyan-500 py-3.5 text-sm font-bold text-white shadow-[0_8px_32px_rgba(139,92,246,0.35)] transition-all hover:shadow-[0_8px_40px_rgba(139,92,246,0.55)] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-violet-600 to-cyan-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="relative flex items-center gap-2">
                    {loading ? "Creating account..." : "Launch my wellness journey"}
                    {!loading && <Sparkles size={16} />}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="mt-3 w-full text-center text-xs text-slate-500 hover:text-slate-300 transition"
                >
                  ← Back to credentials
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <p className="mt-8 text-center text-xs text-slate-700">
            By continuing, you agree to YogAI's Terms of Service and Privacy Policy.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function InputField({ icon: Icon, label, suffix, ...props }) {
  return (
    <div className="group">
      {label && <label className="mb-1.5 block text-xs font-medium" style={{ color: '#cbd5e1' }}>{label}</label>}
      <div className="relative flex items-center">
        <span className="pointer-events-none absolute left-4 group-focus-within:text-violet-400 transition-colors" style={{ color: '#94a3b8' }}>
          <Icon size={16} />
        </span>
        <input
          {...props}
          style={{ color: '#f1f5f9' }}
          className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-11 pr-11 text-sm outline-none placeholder:text-slate-500 focus:border-violet-400/60 focus:bg-white/8 focus:ring-2 focus:ring-violet-400/15 transition-all"
        />
        {suffix && (
          <span className="absolute right-4">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
