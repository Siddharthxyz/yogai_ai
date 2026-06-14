import { useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowUp,
  Camera,
  Dumbbell,
  MoveDown,
  Play,
  PersonStanding,
  Timer,
  UploadCloud,
  Video,
  Waves,
} from "lucide-react";
import api from "../services/api";
import { Button, Card, FadeIn, MetricBox } from "../components/ui";
import { useToast } from "../components/Toast";
import FeedBackCard from "../components/FeedBackCard";
import { useStats } from "../context/StatsContext";

const workouts = [
  { type: "bicep_curl", label: "Bicep Curl", icon: Dumbbell },
  { type: "pushup", label: "Push-Up", icon: ArrowUp },
  { type: "squat", label: "Squat", icon: MoveDown },
  { type: "pullup", label: "Pull-Up", icon: PersonStanding },
];

export default function Exercise() {
  const [selected, setSelected] = useState("bicep_curl");
  const [session, setSession] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploadMode, setUploadMode] = useState(false);
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const pollingRef = useRef(null);
  const imgRef = useRef(null);
  const frameTimerRef = useRef(null);
  const toast = useToast();
  const { incrementStreak, incrementSessions, addActiveMinutes } = useStats();

  // Poll status whenever a session is active
  useEffect(() => {
    if (!session?.session_id) return undefined;

    setAnalysisComplete(false);

    pollingRef.current = setInterval(async () => {
      try {
        const response = await api.get(`/exercise/status/${session.session_id}`);
        setStatus(response.data);

        // Detect when a video analysis session finishes
        if (response.data.is_running === false && uploadMode) {
          clearInterval(pollingRef.current);
          setAnalysisComplete(true);
          toast.success(
            "Analysis complete",
            `${workouts.find(w => w.type === selected)?.label} — ${response.data.reps ?? 0} reps counted.`
          );
        }
      } catch (error) {
        console.error("Exercise polling failed", error);
      }
    }, 800);

    return () => {
      clearInterval(pollingRef.current);
    };
  }, [session]); // eslint-disable-line react-hooks/exhaustive-deps

  // Continuously refresh the annotated frame image while session is running
  useEffect(() => {
    clearInterval(frameTimerRef.current);
    if (!session?.session_id) return;

    const refreshFrame = () => {
      if (imgRef.current) {
        const ts = Date.now();
        imgRef.current.src = `${api.defaults.baseURL}/exercise/frame/${session.session_id}?t=${ts}`;
      }
    };

    // Give the backend a moment to process the first frame
    const init = setTimeout(refreshFrame, 600);
    frameTimerRef.current = setInterval(refreshFrame, 200); // ~5fps annotated preview

    return () => {
      clearTimeout(init);
      clearInterval(frameTimerRef.current);
    };
  }, [session]);

  const startSession = async () => {
    setLoading(true);
    try {
      const response = await api.post("/exercise/start", {
        exercise_type: selected,
        source: "0",
      });
      setSession(response.data);
      setStatus(response.data);
      toast.success("Session started!", `${workouts.find(w => w.type === selected)?.label} tracking is live.`);
    } catch (error) {
      console.error("Exercise session failed", error);
      toast.error("Session failed", "Could not start the exercise tracker. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  const stopSession = async () => {
    if (!session?.session_id) return;
    clearInterval(pollingRef.current);
    clearInterval(frameTimerRef.current);
    try {
      await api.post(`/exercise/stop/${session.session_id}`);
      toast.info("Session ended", `You completed ${status?.reps ?? 0} reps in ${status?.duration ?? 0}s.`);
      incrementStreak();
      incrementSessions();
      addActiveMinutes(Math.max(1, Math.round((status?.duration ?? 0) / 60)));
    } catch (error) {
      console.error("Stop session failed", error);
    } finally {
      setSession(null);
      setStatus(null);
    }
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setVideoFile(file);
    setVideoPreview(URL.createObjectURL(file));
    setStatus(null);
    setSession(null);
    setAnalysisComplete(false);
  };

  const submitVideo = async () => {
    if (!videoFile) return;

    setUploading(true);
    setAnalysisComplete(false);
    try {
      const formData = new FormData();
      formData.append("video", videoFile);
      formData.append("exercise_type", selected);

      const response = await api.post("/exercise/upload_video", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setStatus(response.data);
      if (response.data.session_id) {
        setSession(response.data);
        toast.success("Analysis started", `Analyzing ${workouts.find(w => w.type === selected)?.label} video…`);
      } else {
        // Synchronous result (shouldn't happen with new code, but handle gracefully)
        setAnalysisComplete(true);
        toast.success("Analysis complete", `${workouts.find(w => w.type === selected)?.label} — ${response.data.reps ?? 0} reps counted.`);
      }
    } catch (error) {
      console.error("Exercise video upload failed", error);
      toast.error("Upload failed", "Could not analyze the exercise video.");
    } finally {
      setUploading(false);
    }
  };

  const clearUploadedVideo = () => {
    clearInterval(pollingRef.current);
    clearInterval(frameTimerRef.current);
    if (session?.session_id) {
      api.post(`/exercise/stop/${session.session_id}`).catch(() => {});
    }
    setSession(null);
    setStatus(null);
    setVideoFile(null);
    setVideoPreview(null);
    setUploading(false);
    setAnalysisComplete(false);
    toast.info("Video removed", "The uploaded exercise video has been cleared.");
  };


  return (
    <div className="space-y-8">
      <FadeIn>
        <Card glow="rose">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="section-label">Exercise AI</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Metric Counter
              </h1>
              <p className="mt-4 text-base leading-7 text-slate-300">
                Launch rep tracking sessions, monitor movement quality, and keep
                the exercise engine ready for real-time feedback.
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <div className="flex rounded-lg bg-white/5 p-1">
                <button
                  onClick={() => {
                    setUploadMode(false);
                    setStatus(null);
                    setVideoFile(null);
                    setVideoPreview(null);
                    setAnalysisComplete(false);
                  }}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${!uploadMode ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"}`}
                >
                  <Camera size={14} className="inline mr-2" />
                  Live
                </button>
                <button
                  onClick={() => {
                    setUploadMode(true);
                    setStatus(null);
                  }}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${uploadMode ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"}`}
                >
                  <UploadCloud size={14} className="inline mr-2" />
                  Upload
                </button>
              </div>
              {!uploadMode ? (
                <>
                  <Button onClick={startSession} disabled={loading || !!session}>
                    <Play size={16} />
                    Start Session
                  </Button>
                  {session && (
                    <Button variant="secondary" onClick={stopSession}>
                      Stop Session
                    </Button>
                  )}
                </>
              ) : (
                <>
                  <Button onClick={submitVideo} disabled={uploading || !videoFile || !!session}>
                    <UploadCloud size={16} />
                    {uploading ? "Uploading…" : "Analyze Video"}
                  </Button>
                  {videoFile && (
                    <Button variant="secondary" onClick={clearUploadedVideo}>
                      Clear
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </Card>
      </FadeIn>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <FadeIn delay={0.08}>
          <Card glow="rose" className="h-full">
            <div className="flex flex-col h-full">
              <p className="section-label mb-4">
                {uploadMode
                  ? analysisComplete
                    ? "Analysis Complete"
                    : session
                    ? "Analyzing Video…"
                    : "Video Upload"
                  : "Live Camera"}
              </p>
              <div className="relative flex-1 min-h-[400px] overflow-hidden rounded-2xl bg-slate-900/50">
                {!uploadMode ? (
                  session ? (
                    <img
                      ref={imgRef}
                      className="h-full w-full object-cover"
                      alt="Exercise Camera Stream"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center text-slate-500">
                      <Video size={48} className="mb-4 opacity-20" />
                      <p>Start a session to enable camera</p>
                    </div>
                  )
                ) : (
                  <div className="flex h-full w-full flex-col gap-3 p-4">
                    {/* Always show video preview when file is loaded */}
                    {videoPreview && (
                      <video
                        src={videoPreview}
                        controls
                        className={`rounded-xl object-contain ${session || analysisComplete ? "h-44" : "h-full w-full"}`}
                        style={{ maxHeight: session || analysisComplete ? "180px" : undefined }}
                      />
                    )}

                    {/* Show annotated frame stream while analysing */}
                    {session && (
                      <div className="flex-1 min-h-0 relative">
                        <p className="text-xs text-slate-500 mb-1 uppercase tracking-widest">Pose Analysis</p>
                        <img
                          ref={imgRef}
                          className="h-full w-full object-contain rounded-xl bg-slate-800/60"
                          alt="Exercise Analysis Stream"
                          onError={(e) => { e.target.style.opacity = 0.3; }}
                          onLoad={(e) => { e.target.style.opacity = 1; }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          {!status?.reps && (
                            <div className="flex flex-col items-center gap-2 text-slate-400">
                              <div className="w-6 h-6 border-2 border-primary-400/60 border-t-transparent rounded-full animate-spin" />
                              <p className="text-xs">Detecting pose…</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Upload prompt when no file */}
                    {!videoPreview && (
                      <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/10 transition hover:border-primary-500/50 hover:bg-primary-500/5">
                        <UploadCloud size={48} className="mb-4 text-slate-400" />
                        <p className="text-white font-medium">Click to upload video</p>
                        <p className="mt-1 text-sm text-slate-500">MP4, MOV, AVI exercise recording</p>
                        <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
                      </label>
                    )}

                    {/* Change video button when file loaded but not yet analysing */}
                    {videoPreview && !session && (
                      <label className="mt-1 cursor-pointer text-center text-xs text-slate-500 hover:text-slate-300 transition">
                        Click to change video
                        <input type="file" accept="video/*" className="hidden" onChange={handleVideoUpload} />
                      </label>
                    )}
                  </div>
                )}

                {status?.feedback && (session || analysisComplete) && (
                  <div className="absolute bottom-6 left-6 right-6">
                    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/60 p-4 backdrop-blur-md">
                      <div>
                        <p className="text-xs uppercase tracking-widest text-slate-400">Current Phase</p>
                        <p className="text-xl font-bold text-white lowercase first-letter:uppercase">{status.feedback}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs uppercase tracking-widest text-slate-400">Status</p>
                        <p className={`text-sm font-medium ${status.form_message?.includes("Correct") || status.form_message?.includes("complete") ? "text-emerald-400" : "text-rose-400"}`}>
                          {status.form_message}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {status && (
                <div className="mt-4">
                  <FeedBackCard
                    type={status.form_message?.includes("Correct") || status.form_message?.includes("complete") ? "success" : "warning"}
                    title={status.form_message || "Waiting for pose..."}
                    message={`Phase: ${status.feedback || "Idle"} — ${status.reps ?? 0} reps completed`}
                    score={status.progress ?? 0}
                    label="FORM ANALYSIS"
                  />
                </div>
              )}
            </div>
          </Card>
        </FadeIn>

        <FadeIn delay={0.14}>
          <div className="flex flex-col gap-6">
            <Card glow="rose">
              <p className="section-label">Workout Selection</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {workouts.map((workout) => (
                  <div
                    key={workout.type}
                    className={`rounded-3xl border p-5 text-left transition ${
                      selected === workout.type
                        ? "border-primary-300 bg-primary-400/12"
                        : "border-white/10 bg-white/5 hover:bg-white/8"
                    }`}
                  >
                    <button type="button" onClick={() => setSelected(workout.type)} className="w-full text-left">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/8 text-primary-200">
                        <workout.icon size={18} />
                      </div>
                      <p className="mt-4 text-base font-semibold text-white">{workout.label}</p>
                      <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-400">
                        {uploadMode ? "Video upload analysis" : "Live camera stream"}
                      </p>
                    </button>
                    {uploadMode && videoFile && selected === workout.type && (
                      <button
                        type="button"
                        onClick={clearUploadedVideo}
                        className="mt-4 w-full rounded-2xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-sm font-medium text-rose-200 transition hover:bg-rose-500/20"
                      >
                        Remove Video
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            <Card glow="indigo">
              <div className="flex items-center gap-3">
                <Activity className="text-primary-200" size={20} />
                <h2 className="text-2xl font-semibold text-white">Metrics</h2>
              </div>
              <p className="mt-3 text-sm text-slate-400">
                Connected to the exercise backend via <code>POST /api/exercise/start</code>.
              </p>

              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <MetricBox label="Reps" value={status?.reps ?? 0} icon={Activity} tone="indigo" className="min-h-0" />
                <MetricBox label="Progress" value={`${status?.progress ?? 0}%`} icon={Waves} tone="emerald" className="min-h-0" />
                <MetricBox label="Form" value={status?.feedback || "Idle"} icon={Dumbbell} tone="rose" className="min-h-0" />
                <MetricBox label="Timer" value={status?.duration ? `${status.duration}s` : "0s"} icon={Timer} tone="amber" className="min-h-0" />
              </div>
            </Card>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
