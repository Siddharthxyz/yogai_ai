import { useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  CheckCircle2,
  Grip,
  History,
  Play,
  Radar,
  Shield,
  Waves,
} from "lucide-react";
import yogaAPI from "../services/yogaService";
import { Button, Card, FadeIn, MetricBox, cn } from "../components/ui";

export default function Yoga() {
  const [sessions, setSessions] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    yogaAPI
      .get("/yoga")
      .then((response) => setSessions(response.data))
      .catch(() => setSessions([]));
  }, []);

  const insights = useMemo(() => {
    const normalized = result ? Math.max(0, Math.min(100, result.accuracy || 0)) : 82;
    return {
      stability: normalized,
      activation: Math.min(96, normalized - 8 + 12),
      balance: Math.min(98, normalized - 5 + 10),
    };
  }, [result]);

  const handleFile = async (file) => {
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setUploading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await yogaAPI.post("/detect", formData);
      setResult(response.data);
    } catch (error) {
      console.error("Pose detection failed", error);
      setResult(null);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-8">
      <FadeIn>
        <Card glow="indigo">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="section-label">Yoga Flow</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Yoga Monitor
              </h1>
              <p className="mt-4 text-base leading-7 text-slate-300">
                Capture alignment, run AI pose detection, and review flow quality
                across every session.
              </p>
            </div>
            <Button className="self-start lg:self-auto">
              <Play size={16} />
              Initialize Flow
            </Button>
          </div>
        </Card>
      </FadeIn>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.85fr]">
        <FadeIn delay={0.08}>
          <Card glow="indigo">
            <div className="flex items-center justify-between">
              <div>
                <p className="section-label">Pose Capture</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">
                  Capture Alignment
                </h2>
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-2xl border border-white/10 bg-white/6 p-3 text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                <Camera size={20} />
              </button>
            </div>

            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  fileInputRef.current?.click();
                }
              }}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                handleFile(event.dataTransfer.files?.[0]);
              }}
              className={cn(
                "mt-8 flex aspect-[16/10] cursor-pointer items-center justify-center rounded-[28px] border border-dashed transition",
                dragging
                  ? "border-primary-300 bg-primary-400/10"
                  : "border-white/12 bg-white/4 hover:bg-white/8"
              )}
            >
              {preview ? (
                <div className="relative h-full w-full overflow-hidden rounded-[28px]">
                  <img
                    src={preview}
                    alt="Pose preview"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-950 to-transparent p-5">
                    <p className="text-sm font-semibold text-white">
                      {uploading ? "Analyzing your posture..." : "Pose frame loaded"}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-300">
                      POST /api/detect
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-white/8 text-primary-200">
                    <Radar size={28} />
                  </div>
                  <h3 className="mt-5 text-2xl font-semibold text-white">
                    Capture Alignment
                  </h3>
                  <p className="mt-2 text-sm text-slate-400">
                    Drag and drop a pose frame or connect a live camera feed later.
                  </p>
                </div>
              )}
            </div>

            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept="image/*"
              onChange={(event) => handleFile(event.target.files?.[0])}
            />
          </Card>
        </FadeIn>

        <div className="space-y-6">
          <FadeIn delay={0.14}>
            <Card glow="emerald">
              <div className="flex items-center gap-3">
                <Waves className="text-primary-200" size={20} />
                <h2 className="text-2xl font-semibold text-white">Neural Insights</h2>
              </div>
              <div className="mt-6 grid gap-4">
                <MetricBox
                  label="Stability"
                  value={`${insights.stability}%`}
                  icon={Shield}
                  tone="indigo"
                  className="min-h-0"
                />
                <MetricBox
                  label="Muscle Activation"
                  value={`${insights.activation}%`}
                  icon={Grip}
                  tone="emerald"
                  className="min-h-0"
                />
                <MetricBox
                  label="Balance"
                  value={`${insights.balance}%`}
                  icon={CheckCircle2}
                  tone="amber"
                  className="min-h-0"
                />
              </div>
            </Card>
          </FadeIn>

          <FadeIn delay={0.18}>
            <Card glow="indigo">
              <div className="flex items-center gap-3">
                <History size={20} className="text-primary-200" />
                <h2 className="text-2xl font-semibold text-white">Session History</h2>
              </div>

              <div className="mt-6 space-y-3">
                {(sessions.length ? sessions : fallbackSessions).map((session, index) => (
                  <div
                    key={`${session.poseName}-${index}`}
                    className="rounded-2xl border border-white/8 bg-white/5 px-4 py-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm font-semibold text-white">
                          {session.poseName}
                        </p>
                        <p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-400">
                          {session.date}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-primary-200">
                          {session.score}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {session.duration}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </FadeIn>
        </div>
      </div>
    </div>
  );
}

const fallbackSessions = [
  {
    poseName: "Warrior II",
    date: "Today • 07:20 PM",
    score: "94% alignment",
    duration: "18 min",
  },
  {
    poseName: "Tree Pose",
    date: "Yesterday • 06:10 AM",
    score: "88% stability",
    duration: "11 min",
  },
  {
    poseName: "Sun Salutation",
    date: "Apr 10 • 09:05 PM",
    score: "91% balance",
    duration: "22 min",
  },
];
