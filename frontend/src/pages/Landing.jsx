import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  ArrowRight,
  BrainCircuit,
  Heart,
  Zap,
  Play,
  X,
  ChefHat,
  Dumbbell,
  Wind,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Landing() {
  const navigate = useNavigate();
  const [videoOpen, setVideoOpen] = useState(false);

  return (
    <div className="relative min-h-screen bg-gray-950 overflow-hidden selection:bg-primary-500/30">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-primary-900/20 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] bg-purple-900/10 blur-[150px] rounded-full" />
        <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-indigo-900/20 blur-[100px] rounded-full animate-pulse" />
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.025]" style={{ backgroundImage: "radial-gradient(#fff 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
      </div>

      {/* Minimal top nav */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary-400 to-cyan-300 text-slate-950">
            <Sparkles size={16} />
          </div>
          <span className="text-xl font-black tracking-tight text-white">YogAI</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/login")}
            className="text-base font-black transition drop-shadow-md hover:scale-105"
            style={{ color: '#ffffff' }}
          >
            Sign In
          </button>
          <button
            onClick={() => navigate("/login")}
            className="rounded-xl bg-white px-5 py-2.5 text-base font-black text-gray-900 hover:bg-gray-200 hover:scale-105 transition"
          >
            Get Started
          </button>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-24 text-center">
        {/* Badge */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border-2 border-white/50 bg-white/20 backdrop-blur font-black text-sm mb-12 shadow-lg"
          style={{ color: '#ffffff' }}
        >
          <Sparkles size={18} color="#ffffff" />
          <span className="tracking-wide uppercase drop-shadow-md">AI-Powered Wellness Ecosystem</span>
        </motion.div>

        {/* Hero Title */}
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-6xl md:text-8xl font-black tracking-tighter text-white mb-8 leading-[0.9]"
        >
          Elevate your <br />
          <span className="bg-gradient-to-r from-primary-400 via-purple-400 to-pink-500 bg-clip-text text-transparent">
            Mind &amp; Body
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl mx-auto text-2xl font-bold leading-relaxed mb-12 drop-shadow-md"
          style={{ color: '#ffffff' }}
        >
          The world's most advanced neural assistant for personal yoga,
          gourmet nutrition, and high-performance exercise tracking.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row justify-center items-center gap-6"
        >
          <button
            onClick={() => navigate("/login")}
            className="px-10 py-5 bg-white text-gray-950 rounded-2xl font-black text-lg flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)] group"
          >
            Enter Ecosystem
            <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
          </button>

          <button
            onClick={() => setVideoOpen(true)}
            className="px-10 py-5 border-2 border-white/50 bg-white/20 backdrop-blur rounded-2xl font-black text-lg hover:bg-white/30 transition-all flex items-center gap-3 group"
            style={{ color: '#ffffff' }}
          >
            <Play size={20} className="text-white group-hover:scale-110 transition-transform" />
            Watch Vision AI
          </button>
        </motion.div>

        {/* Features Row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-white/5 pt-12"
        >
          <Feature icon={BrainCircuit} label="Neural Pose Analysis"   color="text-primary-400" />
          <Feature icon={Heart}        label="Visi-Pantry Synthesis"  color="text-pink-400" />
          <Feature icon={Zap}          label="Real-time Dynamics"     color="text-purple-400" />
        </motion.div>

        {/* Feature cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6 text-left"
        >
          {[
            { icon: Wind,     title: "Yoga Flow AI",     desc: "Upload a pose and get instant alignment feedback powered by computer vision." },
            { icon: ChefHat,  title: "AI Kitchen",       desc: "Scan your pantry, detect ingredients with YOLO, and generate custom recipes." },
            { icon: Dumbbell, title: "Exercise Counter",  desc: "Real-time rep counting for 5 exercises with live form analysis." },
          ].map((card) => (
            <div key={card.title} className="rounded-3xl border-2 border-white/40 bg-white/20 p-7 backdrop-blur hover:bg-white/30 transition shadow-lg">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-500/50 text-white mb-5 shadow-inner">
                <card.icon size={24} />
              </div>
              <h3 className="text-xl font-black" style={{ color: '#ffffff' }}>{card.title}</h3>
              <p className="mt-3 text-base font-bold leading-relaxed" style={{ color: '#ffffff' }}>{card.desc}</p>
            </div>
          ))}
        </motion.div>

        {/* Floating tags */}
        <FloatingTag label="VISION AI"   position="top-[15%] left-[5%]"   delay={0} />
        <FloatingTag label="CULINARY AI" position="bottom-[25%] right-[5%]" delay={2} />
        <FloatingTag label="REAL-TIME"   position="top-[40%] right-[8%]"   delay={1} />
      </main>

      {/* Bottom gradient */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-gray-950 to-transparent z-10" />

      {/* ── Vision AI Modal ── */}
      <AnimatePresence>
        {videoOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
            onClick={() => setVideoOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.88, opacity: 0 }}
              transition={{ type: "spring", stiffness: 280, damping: 24 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-2xl rounded-3xl border border-white/10 bg-gray-900 p-8"
            >
              <button
                onClick={() => setVideoOpen(false)}
                className="absolute right-5 top-5 rounded-xl border border-white/10 p-2 text-slate-400 hover:text-white transition"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary-500/50 text-white shadow-lg">
                  <BrainCircuit size={20} />
                </div>
                <div>
                  <h3 className="text-xl font-black" style={{ color: '#ffffff' }}>Vision AI — How It Works</h3>
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#ffffff' }}>YogAI Neural Stack</p>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { step: "01", title: "Pose Detection", desc: "Upload a photo of your yoga pose. Our MediaPipe + YOLO pipeline detects 33 body landmarks in real-time." },
                  { step: "02", title: "Angle Analysis",  desc: "Joint angles are computed (shoulder, elbow, knee, hip) and compared against ideal pose reference data." },
                  { step: "03", title: "AI Feedback",     desc: "Groq LLM synthesizes alignment feedback into plain-language coaching tips tailored to your posture." },
                  { step: "04", title: "Rep Counting",    desc: "For exercises, the system tracks full range-of-motion cycles and counts reps with form validation." },
                ].map((item) => (
                  <div key={item.step} className="flex gap-4 rounded-2xl border-2 border-white/30 bg-white/10 p-4 shadow-md">
                    <span className="shrink-0 text-3xl font-black text-primary-300">{item.step}</span>
                    <div>
                      <p className="text-base font-black" style={{ color: '#ffffff' }}>{item.title}</p>
                      <p className="mt-1 text-sm font-bold leading-5" style={{ color: '#ffffff' }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => { setVideoOpen(false); navigate("/login"); }}
                className="mt-6 w-full rounded-2xl bg-white py-3 text-sm font-black text-slate-950 hover:scale-[1.02] transition"
              >
                Start Using Vision AI →
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Feature({ icon: Icon, label, color }) {
  return (
    <div className="flex flex-col items-center gap-4 group">
      <div className={`p-5 rounded-2xl bg-white/20 border-2 border-white/50 text-white group-hover:scale-110 transition-transform shadow-lg`}>
        <Icon size={36} color="#ffffff" />
      </div>
      <span className="font-black tracking-widest text-base uppercase drop-shadow-md" style={{ color: '#ffffff' }}>{label}</span>
    </div>
  );
}

function FloatingTag({ label, position, delay }) {
  return (
    <motion.div
      initial={{ y: 0 }}
      animate={{ y: [-10, 10, -10] }}
      transition={{ duration: 6, delay, repeat: Infinity, ease: "easeInOut" }}
      className={`absolute ${position} hidden lg:block px-5 py-2.5 border-2 border-white/50 bg-white/30 backdrop-blur-md rounded-xl font-black text-xs tracking-[0.25em] uppercase shadow-lg`}
      style={{ color: '#ffffff' }}
    >
      {label}
    </motion.div>
  );
}
