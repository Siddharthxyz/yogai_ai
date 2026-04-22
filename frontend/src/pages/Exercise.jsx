import { useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowUp,
  Dumbbell,
  MoveDown,
  Play,
  PersonStanding,
  Timer,
  Video,
  Waves,
} from "lucide-react";
import api from "../services/api";
import Webcam from "react-webcam";
import { Button, Card, FadeIn, MetricBox } from "../components/ui";

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
  const pollingRef = useRef(null);

  useEffect(() => {
    if (!session?.session_id) return undefined;

    pollingRef.current = setInterval(async () => {
      try {
        const response = await api.get(`/exercise/status/${session.session_id}`);
        setStatus(response.data);
      } catch (error) {
        console.error("Exercise polling failed", error);
      }
    }, 1000);

    return () => {
      clearInterval(pollingRef.current);
      // Clean up the running session on backend when unmounting
      if (session?.session_id) {
        api.post(`/exercise/stop/${session.session_id}`).catch(() => {});
      }
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
    } catch (error) {
      console.error("Exercise session failed", error);
    } finally {
      setLoading(false);
    }
  };

  const stopSession = async () => {
    if (!session?.session_id) return;
    try {
      await api.post(`/exercise/stop/${session.session_id}`);
    } catch (error) {
      console.error("Stop session failed", error);
    } finally {
      clearInterval(pollingRef.current);
      setSession(null);
      setStatus(null);
    }
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
            <div className="flex gap-3">
              <Button onClick={startSession} disabled={loading}>
                <Play size={16} />
                Start Session
              </Button>
              <Button variant="secondary" onClick={stopSession}>
                Stop Session
              </Button>
            </div>
          </div>
        </Card>
      </FadeIn>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <FadeIn delay={0.08}>
          <Card glow="rose" className="h-full">
            <div className="flex flex-col h-full">
              <p className="section-label mb-4">Live Camera</p>
              <div className="relative flex-1 min-h-[400px] overflow-hidden rounded-2xl bg-slate-900/50">
                {session ? (
                  <Webcam
                    audio={false}
                    className="h-full w-full object-cover"
                    screenshotFormat="image/jpeg"
                  />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center text-slate-500">
                    <Video size={48} className="mb-4 opacity-20" />
                    <p>Start a session to enable camera</p>
                  </div>
                )}
                
                {status?.feedback && session && (
                   <div className="absolute bottom-6 left-6 right-6">
                     <div className="flex items-center justify-between rounded-2xl bg-black/60 p-4 backdrop-blur-md border border-white/10">
                        <div>
                          <p className="text-xs uppercase tracking-widest text-slate-400">Current Phase</p>
                          <p className="text-xl font-bold text-white lowercase first-letter:uppercase">{status.feedback}</p>
                        </div>
                        <div className="text-right">
                           <p className="text-xs uppercase tracking-widest text-slate-400">Status</p>
                           <p className={`text-sm font-medium ${status.form_message?.includes('Correct') ? 'text-emerald-400' : 'text-rose-400'}`}>
                             {status.form_message}
                           </p>
                        </div>
                     </div>
                   </div>
                )}
              </div>
            </div>
          </Card>
        </FadeIn>

        <FadeIn delay={0.14}>
          <div className="flex flex-col gap-6">
            <Card glow="rose">
              <p className="section-label">Workout Selection</p>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                {workouts.map((workout) => (
                  <button
                    key={workout.type}
                    type="button"
                    onClick={() => setSelected(workout.type)}
                    className={`rounded-3xl border p-5 text-left transition ${
                      selected === workout.type
                        ? "border-primary-300 bg-primary-400/12"
                        : "border-white/10 bg-white/5 hover:bg-white/8"
                    }`}
                  >
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/8 text-primary-200">
                      <workout.icon size={18} />
                    </div>
                    <p className="mt-4 text-base font-semibold text-white">
                      {workout.label}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-400">
                      Live camera stream
                    </p>
                  </button>
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
                <MetricBox
                  label="Reps"
                  value={status?.reps ?? 0}
                  icon={Activity}
                  tone="indigo"
                  className="min-h-0"
                />
                <MetricBox
                  label="Progress"
                  value={`${status?.progress ?? 0}%`}
                  icon={Waves}
                  tone="emerald"
                  className="min-h-0"
                />
                <MetricBox
                  label="Form"
                  value={status?.feedback || "Idle"}
                  icon={Dumbbell}
                  tone="rose"
                  className="min-h-0"
                />
                <MetricBox
                  label="Timer"
                  value={status?.duration ? `${status.duration}s` : "0s"}
                  icon={Timer}
                  tone="amber"
                  className="min-h-0"
                />
              </div>
            </Card>
          </div>
        </FadeIn>
      </div>
    </div>
  );
}
