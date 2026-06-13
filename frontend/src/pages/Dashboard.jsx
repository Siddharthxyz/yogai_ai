import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
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
  ChevronRight
} from "lucide-react";
import api from "../services/api";
import { motion } from "framer-motion";
import { Button, Card, FadeIn, cn } from "../components/ui";
import { useSearch } from "../components/MainLayout";
import { useAuth } from "../context/AuthContext";
import { useStats } from "../context/StatsContext";

export default function Dashboard() {
  const searchQuery = useSearch();
  const { user } = useAuth();
  const { stats } = useStats();
  const navigate = useNavigate();
  const firstName = user?.name ? user.name.split(" ")[0] : "Yogi";

  const [status, setStatus] = useState("checking");

  const hour = new Date().getHours();
  const greeting = hour < 12 ? `Good morning, ${firstName}` : hour < 17 ? `Good afternoon, ${firstName}` : `Good evening, ${firstName}`;

  useEffect(() => {
    api
      .get("/status")
      .then(() => setStatus("online"))
      .catch(() => setStatus("offline"));
  }, []);

  return (
    <div className="space-y-8 pb-12">
      {/* ── Premium Hero Banner ── */}
      <FadeIn>
        <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 shadow-2xl">
          {/* Beautiful Aurora / Mesh Gradient Background */}
          <div className="absolute inset-0">
            <img 
              src="/assets/zen_garden.png" 
              alt="Zen Garden" 
              className="h-full w-full object-cover opacity-40 mix-blend-overlay"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/80 via-purple-600/70 to-emerald-500/60 mix-blend-multiply"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
          </div>

          <div className="relative z-10 p-8 sm:p-12 lg:p-16 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-black/30 backdrop-blur-md px-3 py-1.5 text-xs font-semibold tracking-widest text-emerald-300 uppercase border border-white/10 mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Neural Core {status === "online" ? "Online" : "Offline"}
              </div>
              
              <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl mb-4">
                {greeting}
              </h1>
              <p className="text-lg text-slate-200/90 leading-relaxed max-w-xl">
                Your neural wellness sanctuary is ready. You have a <strong className="text-white">{stats.activeMinutes} min</strong> active window today. Perfect conditions for a mobility flow.
              </p>
              
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Button onClick={() => navigate("/yoga")} className="bg-white text-slate-900 hover:bg-slate-100 border-none shadow-[0_0_40px_rgba(255,255,255,0.3)] rounded-full px-8 py-4 text-base">
                  Start Daily Flow <ChevronRight size={18} className="ml-1" />
                </Button>
              </div>
            </div>

            {/* Quick Stats Grid inside Hero */}
            <div className="grid grid-cols-2 gap-4 w-full md:w-auto min-w-[300px]">
              <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl p-5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Day Streak</p>
                <p className="text-3xl font-black text-white">{stats.streak} <span className="text-lg text-slate-400 font-medium tracking-normal">days</span></p>
              </div>
              <div className="bg-black/20 backdrop-blur-xl border border-white/10 rounded-3xl p-5">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Focus Score</p>
                <p className="text-3xl font-black text-white">{stats.focus}<span className="text-lg text-slate-400 font-medium tracking-normal">%</span></p>
              </div>
            </div>
          </div>
        </div>
      </FadeIn>

      {/* ── Modern Bento Box Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Module 1: Yoga */}
        <FadeIn delay={0.1}>
          <Link to="/yoga" className="block h-full group">
            <div className="relative h-full overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 p-8 transition-all duration-500 hover:shadow-[0_20px_60px_-15px_rgba(99,102,241,0.4)] hover:-translate-y-1">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity duration-500 transform group-hover:scale-110">
                <Wind size={120} />
              </div>
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400 mb-6">
                  <Wind size={28} />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">Yoga Flow</h2>
                <p className="text-slate-400 leading-relaxed mb-8 flex-1">
                  AI-powered alignment correction and live pose analysis. Master your form safely.
                </p>
                <div className="flex items-center text-sm font-bold text-indigo-400 group-hover:text-indigo-300 transition-colors">
                  Open Workspace <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>
        </FadeIn>

        {/* Module 2: AI Kitchen */}
        <FadeIn delay={0.2}>
          <Link to="/recipe" className="block h-full group">
            <div className="relative h-full overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 p-8 transition-all duration-500 hover:shadow-[0_20px_60px_-15px_rgba(16,185,129,0.4)] hover:-translate-y-1">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity duration-500 transform group-hover:scale-110">
                <ChefHat size={120} />
              </div>
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 mb-6">
                  <ChefHat size={28} />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">AI Kitchen</h2>
                <p className="text-slate-400 leading-relaxed mb-8 flex-1">
                  Snap a photo of your fridge. Let the LLM generate a personalized, macro-friendly recipe.
                </p>
                <div className="flex items-center text-sm font-bold text-emerald-400 group-hover:text-emerald-300 transition-colors">
                  Open Workspace <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>
        </FadeIn>

        {/* Module 3: Exercise */}
        <FadeIn delay={0.3}>
          <Link to="/exercise" className="block h-full group">
            <div className="relative h-full overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 p-8 transition-all duration-500 hover:shadow-[0_20px_60px_-15px_rgba(244,63,94,0.4)] hover:-translate-y-1">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity duration-500 transform group-hover:scale-110">
                <Dumbbell size={120} />
              </div>
              <div className="relative z-10 flex flex-col h-full">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 mb-6">
                  <Dumbbell size={28} />
                </div>
                <h2 className="text-2xl font-bold text-white mb-3">Exercise AI</h2>
                <p className="text-slate-400 leading-relaxed mb-8 flex-1">
                  Live rep tracking and form validation. Push your limits with an AI spotter.
                </p>
                <div className="flex items-center text-sm font-bold text-rose-400 group-hover:text-rose-300 transition-colors">
                  Open Workspace <ChevronRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>
        </FadeIn>
      </div>

      {/* ── Daily Biometrics Section ── */}
      <FadeIn delay={0.4}>
        <div className="mt-8">
          <div className="flex items-center justify-between mb-6 px-2">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <Activity className="text-primary-400" /> Daily Biometrics
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <BiometricCard 
              label="Calories Burned" 
              value={stats.calories} 
              icon={Flame} 
              color="text-orange-400" 
              bg="bg-orange-500/10" 
            />
            <BiometricCard 
              label="Hydration" 
              value={`${stats.hydration}L`} 
              icon={Activity} 
              color="text-cyan-400" 
              bg="bg-cyan-500/10" 
            />
            <BiometricCard 
              label="Recovery Score" 
              value={`${stats.recovery}%`} 
              icon={Zap} 
              color="text-amber-400" 
              bg="bg-amber-500/10" 
            />
            <BiometricCard 
              label="Goal Accuracy" 
              value={`${stats.goalAccuracy}%`} 
              icon={TrendingUp} 
              color="text-primary-400" 
              bg="bg-primary-500/10" 
            />
          </div>
        </div>
      </FadeIn>
    </div>
  );
}

function BiometricCard({ label, value, icon: Icon, color, bg }) {
  return (
    <div className="flex items-center gap-5 rounded-[2rem] bg-slate-900 border border-white/5 p-6 transition-transform hover:-translate-y-1">
      <div className={cn("flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl", bg, color)}>
        <Icon size={28} />
      </div>
      <div>
        <p className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-1">{label}</p>
        <p className="text-3xl font-black text-white">{value}</p>
      </div>
    </div>
  );
}
