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
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../components/Toast";
import { cn } from "../components/ui";

const GOALS = [
  "Yoga & Flexibility",
  "Weight Loss",
  "Muscle Gain",
  "Stress Relief",
  "Better Nutrition",
  "Cardio Fitness",
];

export default function Register() {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [step, setStep] = useState(1); // 1 = credentials, 2 = goals (register only)
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [goals, setGoals] = useState([]);
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const toggleGoal = (g) =>
    setGoals((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (mode === "register" && step === 1) {
      // Validate before moving to step 2
      if (!form.name.trim()) return toast.warning("Missing field", "Please enter your name.");
      if (!form.email.includes("@")) return toast.warning("Invalid email", "Enter a valid email.");
      if (form.password.length < 6)
        return toast.warning("Weak password", "Password must be at least 6 characters.");
      if (form.password !== form.confirmPassword)
        return toast.error("Password mismatch", "Passwords do not match.");
      setStep(2);
      return;
    }

    setLoading(true);
    try {
      if (mode === "login") {
        await login({ email: form.email, password: form.password });
        toast.success("Welcome back!", "You're now logged in.");
      } else {
        await register({ name: form.name, email: form.email, password: form.password, goals });
        toast.success("Account created!", `Welcome to YogAI, ${form.name}!`);
      }
      navigate("/dashboard");
    } catch (err) {
      toast.error("Auth failed", err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-gray-950 flex items-center justify-center px-4 overflow-hidden selection:bg-primary-500/30">
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[-15%] left-[-10%] h-[600px] w-[600px] rounded-full bg-primary-900/25 blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-5%] h-[500px] w-[500px] rounded-full bg-purple-900/20 blur-[120px]" />
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-primary-400 to-cyan-300 text-slate-950 shadow-[0_20px_50px_rgba(96,165,250,0.4)]">
            <Sparkles size={28} />
          </div>
          <div className="text-center">
            <h1 className="text-3xl font-black tracking-tight text-white">YogAI</h1>
            <p className="text-xs uppercase tracking-[0.22em] text-slate-500">Neural Wellness</p>
          </div>
        </div>

        {/* Card */}
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
          {/* Tab switcher */}
          <div className="mb-8 flex rounded-2xl border border-white/8 bg-white/5 p-1">
            {["login", "register"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => { setMode(m); setStep(1); }}
                className={cn(
                  "flex-1 rounded-xl py-2.5 text-sm font-semibold transition",
                  mode === m
                    ? "bg-white/12 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
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
                onSubmit={handleSubmit}
                className="space-y-4"
              >
                {mode === "register" && (
                  <Field
                    icon={User}
                    type="text"
                    placeholder="Full name"
                    value={form.name}
                    onChange={set("name")}
                    required
                  />
                )}
                <Field
                  icon={Mail}
                  type="email"
                  placeholder="Email address"
                  value={form.email}
                  onChange={set("email")}
                  required
                />
                <div className="relative">
                  <Field
                    icon={Lock}
                    type={showPass ? "text" : "password"}
                    placeholder="Password"
                    value={form.password}
                    onChange={set("password")}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass((s) => !s)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {mode === "register" && (
                  <Field
                    icon={Lock}
                    type={showPass ? "text" : "password"}
                    placeholder="Confirm password"
                    value={form.confirmPassword}
                    onChange={set("confirmPassword")}
                    required
                  />
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="group mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-sm font-black text-slate-950 transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                >
                  {loading ? "Authenticating..." : mode === "login" ? "Sign In" : "Continue"}
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>

                {mode === "login" && (
                  <p className="text-center text-xs text-slate-500">
                    Don't have an account?{" "}
                    <button
                      type="button"
                      onClick={() => setMode("register")}
                      className="text-primary-400 hover:underline"
                    >
                      Create one
                    </button>
                  </p>
                )}
              </motion.form>
            )}

            {/* ── Step 2: Goals (register only) ── */}
            {step === 2 && mode === "register" && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <p className="mb-2 text-sm font-semibold text-white">
                  What are your wellness goals?
                </p>
                <p className="mb-5 text-xs text-slate-400">
                  Select all that apply — you can change these later.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {GOALS.map((g) => {
                    const active = goals.includes(g);
                    return (
                      <button
                        key={g}
                        type="button"
                        onClick={() => toggleGoal(g)}
                        className={cn(
                          "flex items-center gap-2 rounded-2xl border px-3 py-3 text-left text-xs font-semibold transition",
                          active
                            ? "border-primary-400/50 bg-primary-400/12 text-primary-200"
                            : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/8 hover:text-white"
                        )}
                      >
                        {active && <CheckCircle2 size={13} className="shrink-0 text-primary-400" />}
                        {g}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSubmit}
                  className="group mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-white py-3.5 text-sm font-black text-slate-950 transition hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                >
                  {loading ? "Creating account..." : "Launch YogAI"}
                  <Sparkles size={16} />
                </button>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="mt-3 w-full text-center text-xs text-slate-500 hover:text-white"
                >
                  ← Back
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="mt-6 text-center text-xs text-slate-600">
          By continuing, you agree to YogAI's terms of service.
        </p>
      </motion.div>
    </div>
  );
}

function Field({ icon: Icon, ...props }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
        <Icon size={16} />
      </span>
      <input
        {...props}
        className="w-full rounded-2xl border border-white/10 bg-white/6 py-3 pl-10 pr-4 text-sm text-white outline-none placeholder:text-slate-400 focus:border-primary-400/50 focus:ring-1 focus:ring-primary-400/20 transition"
      />
    </div>
  );
}
