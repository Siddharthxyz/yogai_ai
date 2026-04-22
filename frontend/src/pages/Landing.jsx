import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight, BrainCircuit, Heart, Zap, Shield, Star, Users } from "lucide-react";
import { motion } from "framer-motion";

function Landing() {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-gray-950 overflow-hidden selection:bg-primary-500/30">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[800px] h-[800px] bg-primary-900/20 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[800px] h-[800px] bg-purple-900/10 blur-[150px] rounded-full" />
        <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-indigo-900/20 blur-[100px] rounded-full animate-pulse-slow" />
      </div>

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-24 text-center">
        {/* Badge */}
        <motion.div 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full glass border border-white/10 text-primary-400 font-bold text-sm mb-12"
        >
          <Sparkles size={16} />
          <span className="tracking-wide uppercase">AI-Powered Wellness Ecosystem</span>
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
            Mind & Body
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p 
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-2xl mx-auto text-xl text-gray-400 leading-relaxed mb-12"
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
            onClick={() => navigate("/dashboard")}
            className="px-10 py-5 bg-white text-gray-950 rounded-2xl font-black text-lg flex items-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-[0_20px_40px_rgba(255,255,255,0.1)] group"
          >
            Enter Ecosystem 
            <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button className="px-10 py-5 glass border border-white/10 text-white rounded-2xl font-black text-lg hover:bg-white/5 transition-all">
            Watch Vision AI
          </button>
        </motion.div>

        {/* Stats / Features Row */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-white/5 pt-12"
        >
          <Feature icon={BrainCircuit} label="Neural Pose Analysis" color="text-primary-400" />
          <Feature icon={Heart} label="Visi-Pantry Synthesis" color="text-pink-400" />
          <Feature icon={Zap} label="Real-time Dynamics" color="text-purple-400" />
        </motion.div>

        {/* Floating Vision AI tags */}
        <FloatingTag label="VISION AI" position="top-[15%] left-[5%]" delay={0} />
        <FloatingTag label="CULINARY AI" position="bottom-[25%] right-[5%]" delay={2} />
        <FloatingTag label="REAL-TIME" position="top-[40%] right-[8%]" delay={1} />
      </main>

      {/* Background Grid Pattern */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-gray-950 to-transparent z-10" />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#fff 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
    </div>
  );
}

function Feature({ icon: Icon, label, color }) {
  return (
    <div className="flex flex-col items-center gap-4 group">
      <div className={`p-4 rounded-2xl bg-white/5 border border-white/10 ${color} group-hover:scale-110 transition-transform`}>
        <Icon size={32} />
      </div>
      <span className="font-bold text-gray-200 tracking-wide text-sm uppercase">{label}</span>
    </div>
  );
}

function FloatingTag({ label, position, delay }) {
  return (
    <motion.div 
      initial={{ y: 0 }}
      animate={{ y: [-10, 10, -10] }}
      transition={{ duration: 6, delay, repeat: Infinity, ease: "easeInOut" }}
      className={`absolute ${position} hidden lg:block px-4 py-2 glass border border-white/10 rounded-xl font-black text-[10px] text-gray-500 tracking-[0.2em] uppercase`}
    >
      {label}
    </motion.div>
  );
}

export default Landing;
