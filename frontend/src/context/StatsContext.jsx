import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { useAuth } from "./AuthContext";

const StatsContext = createContext(null);

export function StatsProvider({ children }) {
  const { user } = useAuth();

  // Returns a user-scoped localStorage key so each account has isolated data
  const key = useCallback(
    (k) => (user?.id ? `${user.id}_${k}` : `guest_${k}`),
    [user?.id]
  );

  const readHydration = useCallback(() => {
    const today = new Date().toDateString();
    if (localStorage.getItem(key("yogai_hydration_date")) === today) {
      return parseFloat(localStorage.getItem(key("yogai_hydration")) || "0");
    }
    localStorage.setItem(key("yogai_hydration_date"), today);
    localStorage.setItem(key("yogai_hydration"), "0");
    return 0;
  }, [key]);

  const [stats, setStats] = useState({
    calories: 0,
    focus: 0,
    accuracy: 0,
    hydration: 0,
    streak: 0,
    goalAccuracy: 0,
    recovery: 100,
    weeklyPerformance: 0,
    recipesGenerated: 0,
    sessions: 0,
    activeMinutes: 0,
  });

  // Re-initialise whenever the logged-in user changes
  useEffect(() => {
    setStats({
      calories: 0,
      focus: 0,
      accuracy: 0,
      hydration: readHydration(),
      streak: parseInt(localStorage.getItem(key("yogai_streak")) || "0", 10),
      goalAccuracy: 0,
      recovery: 100,
      weeklyPerformance: 0,
      recipesGenerated: parseInt(localStorage.getItem(key("yogai_recipes_generated")) || "0", 10),
      sessions: parseInt(localStorage.getItem(key("yogai_sessions")) || "0", 10),
      activeMinutes: parseInt(localStorage.getItem(key("yogai_active_minutes")) || "0", 10),
    });
  }, [user?.id, key, readHydration]);

  const incrementStreak = useCallback(() => {
    const today = new Date().toDateString();
    if (localStorage.getItem(key("yogai_last_session")) !== today) {
      setStats((prev) => {
        const newStreak = prev.streak + 1;
        localStorage.setItem(key("yogai_streak"), newStreak.toString());
        localStorage.setItem(key("yogai_last_session"), today);
        return { ...prev, streak: newStreak };
      });
    }
  }, [key]);

  const addHydration = useCallback((amountInLiters) => {
    setStats((prev) => {
      const newHydration = Number((prev.hydration + amountInLiters).toFixed(2));
      localStorage.setItem(key("yogai_hydration"), newHydration.toString());
      localStorage.setItem(key("yogai_hydration_date"), new Date().toDateString());
      return { ...prev, hydration: newHydration };
    });
  }, [key]);

  const incrementRecipesGenerated = useCallback(() => {
    setStats((prev) => {
      const newCount = prev.recipesGenerated + 1;
      localStorage.setItem(key("yogai_recipes_generated"), newCount.toString());
      return { ...prev, recipesGenerated: newCount };
    });
  }, [key]);

  const incrementSessions = useCallback(() => {
    setStats((prev) => {
      const newCount = prev.sessions + 1;
      localStorage.setItem(key("yogai_sessions"), newCount.toString());
      return { ...prev, sessions: newCount };
    });
  }, [key]);

  const addActiveMinutes = useCallback((minutes) => {
    setStats((prev) => {
      const newMinutes = prev.activeMinutes + minutes;
      localStorage.setItem(key("yogai_active_minutes"), newMinutes.toString());
      return { ...prev, activeMinutes: newMinutes };
    });
  }, [key]);

  // Wearable simulation — slowly ticks up calories and varies focus/accuracy
  useEffect(() => {
    const idleSim = setInterval(() => {
      if (Math.random() > 0.6) {
        setStats((prev) => ({
          ...prev,
          calories: prev.calories + Math.floor(Math.random() * 3),
          focus: Math.min(99, Math.max(60, prev.focus + (Math.random() > 0.5 ? 1 : -1))),
          accuracy: Math.min(100, Math.max(70, prev.accuracy + (Math.random() > 0.8 ? 1 : Math.random() < 0.2 ? -1 : 0))),
        }));
      }
    }, 2000);
    return () => clearInterval(idleSim);
  }, []);

  return (
    <StatsContext.Provider
      value={{ stats, setStats, incrementStreak, addHydration, incrementRecipesGenerated, incrementSessions, addActiveMinutes }}
    >
      {children}
    </StatsContext.Provider>
  );
}

export const useStats = () => useContext(StatsContext);
