import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Activity,
  BrainCircuit,
  ChefHat,
  Dumbbell,
  Flame,
  Sparkles,
  TrendingUp,
  Wind,
  Zap,
} from "lucide-react";
import api from "../services/api";
import { motion } from "framer-motion";
import { Button, Card, FadeIn, MetricBox, ProgressPill, cn } from "../components/ui";

const features = [
  {
    to: "/yoga",
    title: "Yoga Pose Monitor",
    description: "Alignment correction with AI pose analysis and flow history.",
    icon: Wind,
    tone: "indigo",
  },
  {
    to: "/recipe",
    title: "AI Kitchen Hub",
    description: "Recipe generation from ingredients, scans, and chat prompts.",
    icon: ChefHat,
    tone: "emerald",
  },
  {
    to: "/exercise",
    title: "Metric Counter",
    description: "Rep tracking, form hints, and live exercise session metrics.",
    icon: Dumbbell,
    tone: "rose",
  },
];

const spotlightMetrics = [
  {
    label: "Metabolic Load",
    value: "Balanced",
    delta: "Recovery window looks strong for a yoga + strength split.",
    icon: Sparkles,
    tone: "emerald",
  },
  {
    label: "Adaptive Guidance",
    value: "3 AI prompts ready",
    delta: "Suggested next actions for flow, food, and exercise.",
    icon: BrainCircuit,
    tone: "indigo",
  },
];

const weeklyInsights = [
  { label: "Movement quality", value: "Excellent" },
  { label: "Kitchen adherence", value: "Strong" },
  { label: "Training output", value: "Rising" },
  { label: "Goal alignment", value: "On track" },
];

export default function Dashboard({ searchQuery = "" }) {
  const [status, setStatus] = useState("checking");
  const [lastUpdated, setLastUpdated] = useState(0);
  const [stats, setStats] = useState({
    streak: 18,
    activeMinutes: 64,
    goalAccuracy: "96%",
    calories: "1,284 kcal",
    focus: "88%",
    hydration: "2.8L",
    recovery: "91",
    weeklyPerformance: 84,
  });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning, Siddharth" : hour < 17 ? "Good afternoon, Siddharth" : "Good evening, Siddharth";

  useEffect(() => {
    const idleSim = setInterval(() => {
      setLastUpdated((prev) => prev + 2);
      if (Math.random() > 0.6) {
        setStats((prev) => {
          const calNum = parseInt(prev.calories.replace(/\D/g, "")) + Math.floor(Math.random() * 3);
          const focusNum = Math.min(99, parseInt(prev.focus) + (Math.random() > 0.5 ? 1 : -1));
          return {
            ...prev,
            calories: `${calNum.toLocaleString()} kcal`,
            focus: `${focusNum}%`,
          };
        });
      }
    }, 2000);

    api
      .get("/status")
      .then(() => setStatus("online"))
      .catch(() => setStatus("offline"));

    return () => clearInterval(idleSim);
  }, []);

  const query = searchQuery.trim().toLowerCase();
  const matches = (...values) =>
    !query || values.some((value) => String(value).toLowerCase().includes(query));

  const filteredFeatures = features.filter((feature) =>
    matches(feature.title, feature.description, "workspace")
  );

  const statPills = [
    { label: "Day Streak", value: stats.streak },
    { label: "Active Minutes", value: `${stats.activeMinutes} min` },
    { label: "Goal Accuracy", value: stats.goalAccuracy },
  ].filter((item) => matches(item.label, item.value));

  const filteredSpotlightMetrics = spotlightMetrics.filter((item) =>
    matches(item.label, item.value, item.delta)
  );

  const biometrics = [
    {
      label: "Calories Burned",
      value: stats.calories,
      delta: "+12% compared to last week",
      icon: Flame,
      tone: "rose",
    },
    {
      label: "Neural Focus",
      value: stats.focus,
      delta: "Flow tracking suggests high attention recovery.",
      icon: BrainCircuit,
      tone: "indigo",
    },
    {
      label: "Hydration",
      value: stats.hydration,
      delta: "0.7L left to hit your hydration target.",
      icon: Activity,
      tone: "emerald",
    },
    {
      label: "Recovery Score",
      value: stats.recovery,
      delta: "HRV and mobility windows are both trending upward.",
      icon: Zap,
      tone: "amber",
    },
  ].filter((item) => matches(item.label, item.value, item.delta));

  const filteredWeeklyInsights = weeklyInsights.filter((item) =>
    matches(item.label, item.value, "Weekly Performance", `${stats.weeklyPerformance}%`)
  );

  const showHero = matches(
    "Neural Performance",
    "Monitor your entire wellness stack from one premium cockpit: posture quality, nutrition intelligence, and training output.",
    status === "online" ? "Neural Core Online" : "Backend Offline",
    "Initialize Routine"
  );

  const showBiometricsSection = matches("Daily Biometrics") || biometrics.length > 0;
  const showWeeklyPerformance =
    matches("Weekly Performance", `${stats.weeklyPerformance}%`, "Weekly Score") ||
    filteredWeeklyInsights.length > 0;
  const hasResults =
    showHero ||
    filteredFeatures.length > 0 ||
    showBiometricsSection ||
    showWeeklyPerformance;

  return (
    <div className="space-y-8">
      {!hasResults ? (
        <FadeIn>
          <Card glow="indigo">
            <div className="space-y-3">
              <p className="section-label">No Search Results</p>
              <h2 className="text-3xl font-semibold text-white">Nothing matched "{searchQuery}"</h2>
              <p className="max-w-2xl text-sm leading-6 text-slate-400">
                Try metric names like calories, hydration, recovery, yoga, focus, or weekly.
              </p>
            </div>
          </Card>
        </FadeIn>
      ) : null}

      {showHero ? (
        <FadeIn>
          <Card className="overflow-hidden" glow="indigo">
            <div className="grid gap-8 lg:grid-cols-[1.35fr_0.9fr]">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-300">
                  <motion.span
                    animate={status === "online" ? { scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                    className={cn(
                      "h-2 w-2 rounded-full",
                      status === "online" ? "bg-emerald-300 shadow-[0_0_8px_rgba(110,231,183,0.8)]" : "bg-rose-300"
                    )}
                  />
                  {status === "online" ? "Neural Core Online" : "Backend Offline"}
                </div>
                <h1 className="mt-6 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                  {greeting}
                </h1>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                  Monitor your entire wellness stack from one premium cockpit:
                  posture quality, nutrition intelligence, and training output.
                </p>

                {statPills.length > 0 ? (
                  <div className="mt-8 grid gap-4 sm:grid-cols-3">
                    {statPills.map((item) => (
                      <ProgressPill key={item.label} label={item.label} value={item.value} />
                    ))}
                  </div>
                ) : null}

                <div className="mt-8 space-y-6">
                  <Button>Start Today’s Session</Button>
                  
                  <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-5 backdrop-blur-md">
                    <motion.div
                      className="absolute inset-0 rounded-2xl border-2 border-indigo-400/30"
                      animate={{ opacity: [0.3, 0.8, 0.3], scale: [0.99, 1.01, 0.99] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <div className="relative z-10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Sparkles className="text-indigo-400" size={18} />
                        <h3 className="text-sm font-semibold text-white">AI Insight</h3>
                      </div>
                      <span className="text-[10px] uppercase tracking-[0.2em] text-indigo-300/70 font-mono">
                        Updated {lastUpdated}s ago
                      </span>
                    </div>
                    <p className="relative z-10 mt-2 text-sm text-slate-300 flex items-center flex-wrap gap-1">
                      <span>You're slightly under-hydrated today. Drink 700ml in next 2 hours.</span>
                      <motion.span
                        animate={{ opacity: [1, 0, 1] }}
                        transition={{ duration: 1, repeat: Infinity, ease: "steps(2)" }}
                        className="inline-block h-3.5 w-1.5 bg-indigo-400"
                      />
                    </p>
                  </div>
                </div>
              </div>

              {filteredSpotlightMetrics.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                  {filteredSpotlightMetrics.map((item) => (
                    <MetricBox
                      key={item.label}
                      label={item.label}
                      value={item.value}
                      delta={item.delta}
                      icon={item.icon}
                      tone={item.tone}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </Card>
        </FadeIn>
      ) : null}

      {filteredFeatures.length > 0 ? (
        <div className="grid gap-5 xl:grid-cols-3">
          {filteredFeatures.map((feature, index) => (
          <FadeIn key={feature.title} delay={0.08 * (index + 1)}>
            <Link to={feature.to} className="block h-full">
              <Card
                className="h-full transition duration-300 hover:-translate-y-1"
                glow={feature.tone}
              >
                <div className="flex h-full flex-col">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/8 text-white">
                    <feature.icon size={22} />
                  </div>
                  <h2 className="mt-6 text-2xl font-semibold text-white">
                    {feature.title}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    {feature.description}
                  </p>
                  <div className="mt-auto pt-8 text-sm font-semibold text-primary-200">
                    Open workspace
                  </div>
                </div>
              </Card>
            </Link>
          </FadeIn>
          ))}
        </div>
      ) : null}

      {showBiometricsSection || showWeeklyPerformance ? (
        <div className="grid gap-6 xl:grid-cols-[1.5fr_0.8fr]">
          {showBiometricsSection ? (
            <FadeIn delay={0.16}>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="text-primary-200" size={20} />
                  <h2 className="text-2xl font-semibold text-white">Daily Biometrics</h2>
                </div>
                {biometrics.length > 0 ? (
                  <div className="grid gap-5 md:grid-cols-2">
                    {biometrics.map((item) => (
                      <MetricBox
                        key={item.label}
                        label={item.label}
                        value={item.value}
                        delta={item.delta}
                        icon={item.icon}
                        tone={item.tone}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            </FadeIn>
          ) : null}

          {showWeeklyPerformance ? (
            <FadeIn delay={0.22}>
              <Card className="h-full" glow="emerald">
                <p className="section-label">Weekly Performance</p>
                <div className="mt-8 flex items-center justify-center">
                  <DonutChart value={stats.weeklyPerformance} />
                </div>
                {filteredWeeklyInsights.length > 0 ? (
                  <div className="mt-8 grid gap-3">
                    {filteredWeeklyInsights.map((item) => (
                      <InsightRow key={item.label} label={item.label} value={item.value} />
                    ))}
                  </div>
                ) : null}
              </Card>
            </FadeIn>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function DonutChart({ value }) {
  const circumference = 2 * Math.PI * 74;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative h-52 w-52">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 180 180">
        <circle
          cx="90"
          cy="90"
          r="74"
          fill="none"
          stroke="rgba(148,163,184,0.14)"
          strokeWidth="14"
        />
        <circle
          cx="90"
          cy="90"
          r="74"
          fill="none"
          stroke="url(#yogai-gradient)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
        <defs>
          <linearGradient id="yogai-gradient" x1="0%" x2="100%">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="100%" stopColor="#60a5fa" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-4xl font-semibold text-white">{value}%</p>
        <p className="mt-2 text-xs uppercase tracking-[0.24em] text-slate-400">
          Weekly Score
        </p>
      </div>
    </div>
  );
}

function InsightRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-white/8 bg-white/5 px-4 py-3">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-white">{value}</span>
    </div>
  );
}
