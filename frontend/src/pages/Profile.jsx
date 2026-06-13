import { useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  Camera,
  CheckCircle2,
  Edit3,
  LogOut,
  Mail,
  Save,
  Sparkles,
  Target,
  User,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useStats } from "../context/StatsContext";
import { useToast } from "../components/Toast";
import { Button, Card, FadeIn } from "../components/ui";

const GOALS = [
  "Yoga & Flexibility",
  "Weight Loss",
  "Muscle Gain",
  "Stress Relief",
  "Better Nutrition",
  "Cardio Fitness",
];

const STATS = [
  { label: "Sessions this week", value: "4" },
  { label: "Calories logged",    value: "3,821 kcal" },
  { label: "Yoga streak",        value: "7 days" },
  { label: "Recipes generated",  value: "12" },
];

export default function Profile() {
  const { user, updateProfile, logout } = useAuth();
  const { stats } = useStats();
  const toast   = useToast();
  const navigate = useNavigate();

  const dynamicStats = [
    { label: "Sessions logged",      value: stats?.sessions || 0 },
    { label: "Yoga streak",          value: `${stats?.streak || 0} days` },
    { label: "Recipes generated",    value: stats?.recipesGenerated || 0 },
  ];

  const [editing,  setEditing]  = useState(false);
  const [name,      setName]      = useState(user?.name || "");
  const [goals,     setGoals]     = useState(user?.goals || []);
  const [age,       setAge]       = useState(user?.age || "");
  const [gender,    setGender]    = useState(user?.gender || "");
  const [height,    setHeight]    = useState(user?.height || "");
  const [weight,    setWeight]    = useState(user?.weight || "");
  const [diet,      setDiet]      = useState(user?.diet || "");
  const [allergies, setAllergies] = useState(user?.allergies || "");
  const [saving,    setSaving]    = useState(false);
  const fileRef   = useRef(null);

  // Avatar: real image URL or generated initials
  const [avatar, setAvatar] = useState(user?.avatar || null);
  const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) || "?";

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAvatar(url);
    updateProfile({ avatar: url });
    toast.success("Avatar updated!", "Your new photo looks great.");
  };

  const toggleGoal = (g) =>
    setGoals((prev) => (prev.includes(g) ? prev.filter((x) => x !== g) : [...prev, g]));

  const saveProfile = async () => {
    if (!name.trim()) return toast.warning("Missing field", "Name cannot be empty.");
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600)); // simulate async
    updateProfile({ 
      name: name.trim(), 
      goals, 
      avatar,
      age, gender, height, weight, diet, allergies
    });
    setEditing(false);
    setSaving(false);
    toast.success("Profile saved!", "Your changes have been applied.");
  };

  const handleLogout = () => {
    logout();
    toast.info("Signed out", "See you next time!");
    navigate("/login");
  };

  const joinedDate = user?.joinedAt
    ? new Date(user.joinedAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : "Unknown";

  return (
    <div className="space-y-8">
      {/* ── Hero Card ── */}
      <FadeIn>
        <Card glow="indigo" className="overflow-hidden">
          {/* Banner */}
          <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-primary-600/30 via-cyan-500/20 to-purple-600/20" />

          <div className="relative pt-8">
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-end sm:gap-8">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="h-28 w-28 overflow-hidden rounded-3xl border-4 border-white/10 bg-gradient-to-br from-primary-500/60 to-cyan-400/60 shadow-[0_12px_40px_rgba(96,165,250,0.3)]">
                  {avatar ? (
                    <img src={avatar} alt={name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-4xl font-black text-white">
                      {initials}
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-slate-900 text-slate-300 shadow transition hover:bg-white/10 hover:text-white"
                >
                  <Camera size={14} />
                </button>
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleAvatarChange} />
              </div>

              {/* Info */}
              <div className="flex-1 text-center sm:text-left">
                {editing ? (
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-2 text-2xl font-semibold text-white outline-none focus:border-primary-400/50"
                  />
                ) : (
                  <h1 className="text-3xl font-semibold text-white">{user?.name}</h1>
                )}
                <div className="mt-2 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
                  <span className="flex items-center gap-1.5 text-sm text-slate-400">
                    <Mail size={13} /> {user?.email}
                  </span>
                  <span className="flex items-center gap-1.5 text-sm text-slate-400">
                    <Sparkles size={13} /> Joined {joinedDate}
                  </span>
                </div>
              </div>

              {/* Edit / Save button */}
              <div className="flex gap-3">
                {editing ? (
                  <>
                    <Button onClick={saveProfile} disabled={saving}>
                      <Save size={16} />
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                    <Button variant="secondary" onClick={() => { 
                      setEditing(false); 
                      setName(user?.name || ""); 
                      setGoals(user?.goals || []); 
                      setAge(user?.age || "");
                      setGender(user?.gender || "");
                      setHeight(user?.height || "");
                      setWeight(user?.weight || "");
                      setDiet(user?.diet || "");
                      setAllergies(user?.allergies || "");
                    }}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <Button variant="secondary" onClick={() => setEditing(true)}>
                    <Edit3 size={16} /> Edit Profile
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      </FadeIn>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.8fr]">
        <div className="space-y-6">
          {/* ── Biometrics & Nutrition ── */}
          <FadeIn delay={0.05}>
            <Card glow="cyan">
              <div className="flex items-center gap-3">
                <User className="text-primary-200" size={20} />
                <h2 className="text-2xl font-semibold text-white">Biometrics & Nutrition</h2>
              </div>
              <div className="mt-6 grid grid-cols-2 gap-4">
                {/* Age & Gender */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Age</label>
                  {editing ? (
                    <input type="number" value={age} onChange={e => setAge(e.target.value)} className="w-full rounded-xl bg-white/5 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-primary-500/50" placeholder="e.g. 28" />
                  ) : (
                    <div className="text-lg text-white font-medium">{user?.age || "—"}</div>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Gender</label>
                  {editing ? (
                    <input value={gender} onChange={e => setGender(e.target.value)} className="w-full rounded-xl bg-white/5 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-primary-500/50" placeholder="e.g. Female" />
                  ) : (
                    <div className="text-lg text-white font-medium">{user?.gender || "—"}</div>
                  )}
                </div>
                {/* Height & Weight */}
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Height (cm)</label>
                  {editing ? (
                    <input type="number" value={height} onChange={e => setHeight(e.target.value)} className="w-full rounded-xl bg-white/5 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-primary-500/50" placeholder="e.g. 170" />
                  ) : (
                    <div className="text-lg text-white font-medium">{user?.height ? `${user.height} cm` : "—"}</div>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Weight (kg)</label>
                  {editing ? (
                    <input type="number" value={weight} onChange={e => setWeight(e.target.value)} className="w-full rounded-xl bg-white/5 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-primary-500/50" placeholder="e.g. 65" />
                  ) : (
                    <div className="text-lg text-white font-medium">{user?.weight ? `${user.weight} kg` : "—"}</div>
                  )}
                </div>
              </div>

              {/* BMI Display */}
              {(!editing && user?.height && user?.weight) && (() => {
                const hMeters = Number(user.height) / 100;
                const bmi = (Number(user.weight) / (hMeters * hMeters)).toFixed(1);
                let classification = "Normal weight";
                let color = "text-emerald-400";
                if (bmi < 18.5) { classification = "Underweight"; color = "text-yellow-400"; }
                else if (bmi >= 25) { classification = "Overweight"; color = "text-orange-400"; }

                return (
                  <div className="mt-5 rounded-2xl bg-white/5 p-4 border border-white/10 flex items-center justify-between">
                    <div>
                      <div className="text-sm text-slate-400">Current BMI</div>
                      <div className={`text-xl font-bold ${color}`}>{classification}</div>
                    </div>
                    <div className="text-3xl font-black text-white">{bmi}</div>
                  </div>
                );
              })()}

              <div className="mt-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Dietary Preferences</label>
                  {editing ? (
                    <input value={diet} onChange={e => setDiet(e.target.value)} className="w-full rounded-xl bg-white/5 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-primary-500/50" placeholder="e.g. Vegan, Keto, None" />
                  ) : (
                    <div className="text-base text-white">{user?.diet || "No specific diet"}</div>
                  )}
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Allergies / Restrictions</label>
                  {editing ? (
                    <input value={allergies} onChange={e => setAllergies(e.target.value)} className="w-full rounded-xl bg-white/5 px-3 py-2 text-white outline-none focus:ring-2 focus:ring-primary-500/50" placeholder="e.g. Peanuts, Gluten" />
                  ) : (
                    <div className="text-base text-white">{user?.allergies || "None"}</div>
                  )}
                </div>
              </div>
            </Card>
          </FadeIn>

        {/* ── Stats ── */}
        <FadeIn delay={0.08}>
          <Card glow="emerald">
            <div className="flex items-center gap-3">
              <Target className="text-primary-200" size={20} />
              <h2 className="text-2xl font-semibold text-white">Activity Overview</h2>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4">
              {dynamicStats.map((s) => (
                <div key={s.label} className="rounded-2xl border border-white/8 bg-white/5 p-5">
                  <p className="text-2xl font-semibold text-white">{s.value}</p>
                  <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">{s.label}</p>
                </div>
              ))}
            </div>
          </Card>
        </FadeIn>
        </div>

        {/* ── Wellness Goals ── */}
        <FadeIn delay={0.12}>
          <Card glow="indigo">
            <div className="flex items-center gap-3">
              <User className="text-primary-200" size={20} />
              <h2 className="text-2xl font-semibold text-white">Wellness Goals</h2>
            </div>
            <div className="mt-5 grid gap-2">
              {GOALS.map((g) => {
                const active = goals.includes(g);
                return (
                  <motion.button
                    key={g}
                    type="button"
                    onClick={() => editing && toggleGoal(g)}
                    whileTap={editing ? { scale: 0.97 } : {}}
                    className={`flex items-center gap-3 rounded-2xl border px-4 py-3 text-left text-sm font-medium transition ${
                      active
                        ? "border-primary-400/40 bg-primary-400/12 text-primary-200"
                        : "border-white/8 bg-white/4 text-slate-400"
                    } ${editing ? "cursor-pointer hover:bg-white/8" : "cursor-default"}`}
                  >
                    <CheckCircle2 size={15} className={active ? "text-primary-400" : "text-slate-600"} />
                    {g}
                  </motion.button>
                );
              })}
            </div>
            {!editing && (
              <p className="mt-4 text-xs text-slate-500">Click "Edit Profile" to update goals.</p>
            )}
          </Card>
        </FadeIn>
      </div>

      {/* ── Danger Zone ── */}
      <FadeIn delay={0.2}>
        <Card className="border-rose-500/20 bg-rose-500/5">
          <h2 className="text-lg font-semibold text-white">Account</h2>
          <p className="mt-2 text-sm text-slate-400">
            Sign out of your YogAI session on this device.
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="mt-5 flex items-center gap-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-5 py-3 text-sm font-semibold text-rose-400 transition hover:bg-rose-500/20"
          >
            <LogOut size={16} /> Sign Out
          </button>
        </Card>
      </FadeIn>
    </div>
  );
}
