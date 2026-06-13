import { useEffect, useRef, useState } from "react";
import {
  Activity,
  Play,
  Video,
  Waves,
  Wand2,
  ListFilter,
  CheckCircle2,
  UploadCloud,
  Camera,
} from "lucide-react";
import api from "../services/api";
import Webcam from "react-webcam";
import { Button, Card, FadeIn, MetricBox } from "../components/ui";
import { useToast } from "../components/Toast";
import FeedBackCard from "../components/FeedBackCard";
import { useAuth } from "../context/AuthContext";
import { useStats } from "../context/StatsContext";

const poses = [
  { type: "tree", label: "Tree Pose", icon: Activity },
  { type: "warrior", label: "Warrior II", icon: Waves },
  { type: "downward_dog", label: "Downward Dog", icon: Activity },
];

export default function Yoga() {
  const [selected, setSelected] = useState("tree");
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadMode, setUploadMode] = useState(false);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [recommending, setRecommending] = useState(false);
  const [aiRecommendation, setAiRecommendation] = useState("");
  const [sessionAccuracy, setSessionAccuracy] = useState(0);
  const [lastHoldTime, setLastHoldTime] = useState(0);
  const pollingRef = useRef(null);
  const toast = useToast();
  const { user } = useAuth();
  const { stats, incrementStreak } = useStats();

  useEffect(() => {
    if (!session?.session_id) return undefined;

    pollingRef.current = setInterval(async () => {
      try {
        const response = await api.get(`/yoga/status_live/${session.session_id}`);
        setStatus(response.data);
      } catch (error) {
        console.error("Yoga polling failed", error);
      }
    }, 1000);

    return () => {
      clearInterval(pollingRef.current);
      if (session?.session_id) {
        api.post(`/yoga/stop_live/${session.session_id}`).catch(() => {});
      }
    };
  }, [session]);

  const startSession = async () => {
    setLoading(true);
    try {
      const response = await api.post("/yoga/start_live", {
        pose_type: selected,
        source: "0",
      });
      setSession(response.data);
      setStatus(response.data);
      toast.success("Session started!", `${poses.find(p => p.type === selected)?.label} tracking is live.`);
    } catch (error) {
      toast.error("Session failed", "Could not start the yoga tracker.");
    } finally {
      setLoading(false);
    }
  };

  const stopSession = async () => {
    if (!session?.session_id) return;
    try {
      await api.post(`/yoga/stop_live/${session.session_id}`);
      // Capture accuracy and hold time for AI recommendation
      const accuracy = status?.progress ?? 0;
      const holdTime = status?.hold_time ?? 0;
      setSessionAccuracy(accuracy);
      setLastHoldTime(holdTime);
      toast.info("Session ended", `You held perfect form for ${holdTime} seconds.`);
      incrementStreak(); // Streak increments on validated session
    } catch (error) {
      console.error("Stop session failed", error);
    } finally {
      clearInterval(pollingRef.current);
      setSession(null);
      setStatus(null);
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
  };

  const submitVideo = async () => {
    if (!videoFile) return;
    setUploading(true);
    setStatus(null);
    
    const formData = new FormData();
    formData.append("video", videoFile);
    formData.append("pose_type", selected);

    try {
      const response = await api.post("/yoga/upload_video", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      setStatus({
        progress: 100,
        form_msg: response.data.feedback,
        feedback: "Analysis Complete",
        hold_time: response.data.hold_time,
        angles: {}
      });
      incrementStreak(); // Streak increments on successful upload analysis
      toast.success("Analysis Complete", `You held ${poses.find(p=>p.type === selected)?.label} for ${response.data.hold_time} seconds!`);
    } catch (error) {
      toast.error("Upload Failed", "Could not analyze the video.");
    } finally {
      setUploading(false);
    }
  };

  const getAiRecommendation = async () => {
    if (!user) return toast.warning("Sign in required", "Please sign in for personalized recommendations.");
    setRecommending(true);
    try {
      const bmi = user.weight && user.height ? (user.weight/((user.height/100)**2)).toFixed(1) : 'Unknown';
      const context = `Name: ${user.name}, Age: ${user.age}, BMI: ${bmi}, Goals: ${user.goals?.join(', ')}. Currently burnt ${stats.calories} kcal.`;
      const res = await api.post("/yoga/recommend", { 
        context,
        session_accuracy: sessionAccuracy,
        last_pose: selected,
        hold_time: lastHoldTime
      });
      setAiRecommendation(res.data.recommendation);
    } catch (error) {
      toast.error("AI Error", "Failed to fetch recommendation.");
    } finally {
      setRecommending(false);
    }
  };

  return (
    <div className="space-y-8">
      <FadeIn>
        <Card glow="cyan">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="section-label">Live Yoga Coach</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Real-Time Flow
              </h1>
              <p className="mt-4 text-base leading-7 text-slate-300">
                Let our computer vision neural network track your joint angles and correct your posture live as you hold your pose.
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Button variant="secondary" onClick={getAiRecommendation} disabled={recommending}>
                <Wand2 size={16} />
                {recommending ? "Thinking..." : "AI Recommend"}
              </Button>
              <div className="flex bg-white/5 rounded-lg p-1 ml-2">
                 <button 
                   onClick={() => { setUploadMode(false); setStatus(null); setVideoFile(null); }}
                   className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${!uploadMode ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}
                 >
                   <Camera size={14} className="inline mr-2"/>Live
                 </button>
                 <button 
                   onClick={() => { setUploadMode(true); setStatus(null); }}
                   className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${uploadMode ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}
                 >
                   <UploadCloud size={14} className="inline mr-2"/>Upload
                 </button>
              </div>
              {!uploadMode ? (
                <>
                  <Button onClick={startSession} disabled={loading || session}>
                    <Play size={16} />
                    Start Pose
                  </Button>
                  {session && (
                    <Button variant="secondary" onClick={stopSession} className="border-rose-500/50 text-rose-400 hover:bg-rose-500/10">
                      Stop Session
                    </Button>
                  )}
                </>
              ) : (
                <Button onClick={submitVideo} disabled={uploading || !videoFile}>
                  <UploadCloud size={16} />
                  {uploading ? "Analyzing..." : "Analyze Video"}
                </Button>
              )}
            </div>
          </div>

          {/* AI Recommendation Box */}
          {aiRecommendation && (
             <div className="mt-6 overflow-hidden rounded-3xl border border-primary-500/30 bg-slate-900/50 shadow-2xl backdrop-blur-md flex flex-col md:flex-row items-center gap-6 p-6">
               <div className="flex-1">
                 <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-3">
                   <Wand2 size={20} className="text-primary-400" /> 
                   AI Prescribed Flow
                 </h3>
                 <p className="text-base text-slate-300 leading-relaxed bg-white/5 p-4 rounded-2xl border border-white/5">
                   {aiRecommendation}
                 </p>
               </div>
               {(() => {
                 const recLower = aiRecommendation.toLowerCase();
                 const imgMap = {
                   tree: { src: "/assets/tree_pose.png", label: "Tree Pose" },
                   warrior: { src: "/assets/warrior_pose.png", label: "Warrior II" },
                   dog: { src: "/assets/dog_pose.png", label: "Downward Dog" }
                 };
                 const match = Object.keys(imgMap).find(k => recLower.includes(k));
                 if (match) {
                   return (
                     <div className="w-full md:w-64 h-64 shrink-0 rounded-2xl overflow-hidden relative border border-white/10 group shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                       <img 
                         src={imgMap[match].src} 
                         alt={imgMap[match].label} 
                         className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
                       />
                       <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent"></div>
                       <div className="absolute bottom-4 left-4 right-4 text-white">
                         <p className="text-xs font-bold uppercase tracking-wider text-primary-300 mb-1">Recommended</p>
                         <p className="font-semibold text-lg">{imgMap[match].label}</p>
                       </div>
                     </div>
                   );
                 }
                 return null;
               })()}
             </div>
          )}

          {/* Pose Selector */}
          <div className="mt-8 flex gap-3 overflow-x-auto pb-4">
            {poses.map((p) => {
              const Icon = p.icon;
              const active = selected === p.type;
              return (
                <button
                  key={p.type}
                  onClick={() => !session && setSelected(p.type)}
                  className={`flex shrink-0 items-center gap-2 rounded-2xl border px-5 py-3 text-sm font-medium transition ${
                    active
                      ? "border-primary-400/50 bg-primary-400/20 text-primary-200"
                      : session 
                        ? "border-white/5 bg-white/5 text-slate-500 cursor-not-allowed"
                        : "border-white/10 bg-white/5 text-slate-400 hover:bg-white/10"
                  }`}
                  disabled={session}
                >
                  <Icon size={16} className={active ? "text-primary-400" : "text-slate-500"} />
                  {p.label}
                </button>
              );
            })}
          </div>
        </Card>
      </FadeIn>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        {/* Live Camera View */}
        <FadeIn delay={0.08}>
          <Card glow="cyan" className="h-full">
            <div className="flex flex-col h-full">
              <p className="section-label mb-4">{uploadMode ? "Video Upload" : "Live Camera"}</p>
              <div className="relative flex-1 min-h-[400px] overflow-hidden rounded-2xl bg-slate-900/50 border border-white/5">
                {!uploadMode ? (
                  session ? (
                    <Webcam
                      audio={false}
                      className="h-full w-full object-cover"
                      screenshotFormat="image/jpeg"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center text-slate-500">
                      <Video size={48} className="mb-4 opacity-20" />
                      <p>Start a session to enable camera tracking</p>
                    </div>
                  )
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center p-6 relative">
                    {uploading && (
                       <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-950/80 backdrop-blur-sm">
                         <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
                         <p className="mt-4 text-sm font-medium text-white animate-pulse">Running Neural Pipeline on Video...</p>
                       </div>
                    )}
                    {videoPreview ? (
                      <video src={videoPreview} controls className="h-full w-full object-contain rounded-xl" />
                    ) : (
                      <label className="flex flex-col items-center justify-center w-full h-full border-2 border-dashed border-white/10 hover:border-primary-500/50 hover:bg-primary-500/5 rounded-xl cursor-pointer transition">
                        <UploadCloud size={48} className="mb-4 text-slate-400" />
                        <p className="text-white font-medium">Click to upload video</p>
                        <p className="text-slate-500 text-sm mt-1">MP4, MOV (Max 30s)</p>
                        <input type="file" accept="video/mp4,video/quicktime" className="hidden" onChange={handleVideoUpload} />
                      </label>
                    )}
                  </div>
                )}
                
                {/* Live Feedback Overlay (Only for live sessions) */}
                {status && session && !uploadMode && (
                   <div className="absolute bottom-6 left-6 right-6">
                     <div className="flex items-center justify-between rounded-2xl bg-black/70 p-4 backdrop-blur-md border border-white/10">
                        <div>
                          <p className="text-xs uppercase tracking-widest text-slate-400">Current Form</p>
                          <p className={`text-xl font-bold lowercase first-letter:uppercase ${status.progress === 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                            {status.feedback}
                          </p>
                        </div>
                        <div className="text-right">
                           <p className="text-xs uppercase tracking-widest text-slate-400">AI Correction</p>
                           <p className="text-sm font-medium text-white">
                             {status.form_msg}
                           </p>
                        </div>
                     </div>
                   </div>
                )}
              </div>
            </div>
          </Card>
        </FadeIn>

        {/* Real-time Telemetry & Form Card */}
        <FadeIn delay={0.12} className="flex flex-col gap-6">
          <FeedBackCard
            title="Form Accuracy"
            score={status?.progress ?? 0}
            message={status?.form_msg ?? "Waiting for camera..."}
            subMessage={`Pose: ${poses.find(p=>p.type === selected)?.label}`}
          />
          <Card glow="cyan" className="flex-1">
            <div className="flex items-center justify-between">
              <p className="section-label">Session Telemetry</p>
              <Activity className="text-primary-500" size={18} />
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4">
              <MetricBox
                label="Hold Time"
                value={`${status?.hold_time ?? 0}s`}
                icon={CheckCircle2}
                trend="Perfect Form"
              />
              <MetricBox
                label="Angle Checks"
                value={status?.angles ? Object.keys(status.angles).length : 0}
                icon={ListFilter}
                trend="Joints Monitored"
              />
            </div>
            {/* Raw Angles Feed for debugging/cool factor */}
            {status?.angles && Object.keys(status.angles).length > 0 && (
              <div className="mt-6 rounded-xl bg-white/5 p-4 font-mono text-xs text-slate-400 border border-white/5">
                <div className="mb-2 uppercase text-[10px] tracking-widest text-primary-500/70">Raw Joint Angles</div>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(status.angles).map(([joint, angle]) => (
                    <div key={joint} className="flex justify-between border-b border-white/5 pb-1">
                      <span className="opacity-70">{joint}</span>
                      <span className="text-white">{Math.round(angle)}°</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}
