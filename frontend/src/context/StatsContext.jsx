import { createContext, useContext, useEffect, useState, useCallback } from "react";

const StatsContext = createContext(null);

export function StatsProvider({ children }) {
  const getTodayHydration = () => {
    const today = new Date().toDateString();
    const stored = localStorage.getItem("yogai_hydration_date");
    if (stored === today) {
      return parseFloat(localStorage.getItem("yogai_hydration") || "0");
    }
    // New day — reset hydration
    localStorage.setItem("yogai_hydration_date", today);
    localStorage.setItem("yogai_hydration", "0");
    return 0;
  };

  const [stats, setStats] = useState({
    calories: 0,
    focus: 0,
    accuracy: 0,
    hydration: getTodayHydration(),
    streak: parseInt(localStorage.getItem("yogai_streak") || "0", 10),
    goalAccuracy: 0,
    recovery: 100,
    weeklyPerformance: 0,
    recipesGenerated: parseInt(localStorage.getItem("yogai_recipes_generated") || "0", 10),
    sessions: parseInt(localStorage.getItem("yogai_sessions") || "0", 10),
    activeMinutes: parseInt(localStorage.getItem("yogai_active_minutes") || "0", 10),
  });

  const incrementStreak = useCallback(() => {
    const today = new Date().toDateString();
    const lastSession = localStorage.getItem("yogai_last_session");
    
    // Only increment streak if the last session was not today
    if (lastSession !== today) {
      setStats((prev) => {
        const newStreak = prev.streak + 1;
        localStorage.setItem("yogai_streak", newStreak.toString());
        localStorage.setItem("yogai_last_session", today);
        return { ...prev, streak: newStreak };
      });
    }
  }, []);

  const addHydration = useCallback((amountInLiters) => {
    setStats((prev) => {
      const newHydration = Number((prev.hydration + amountInLiters).toFixed(2));
      localStorage.setItem("yogai_hydration", newHydration.toString());
      localStorage.setItem("yogai_hydration_date", new Date().toDateString());
      return { ...prev, hydration: newHydration };
    });
  }, []);

  const incrementRecipesGenerated = useCallback(() => {
    setStats((prev) => {
      const newCount = prev.recipesGenerated + 1;
      localStorage.setItem("yogai_recipes_generated", newCount.toString());
      return { ...prev, recipesGenerated: newCount };
    });
  }, []);

  const incrementSessions = useCallback(() => {
    setStats((prev) => {
      const newCount = prev.sessions + 1;
      localStorage.setItem("yogai_sessions", newCount.toString());
      return { ...prev, sessions: newCount };
    });
  }, []);

  const addActiveMinutes = useCallback((minutes) => {
    setStats((prev) => {
      const newMinutes = prev.activeMinutes + minutes;
      localStorage.setItem("yogai_active_minutes", newMinutes.toString());
      return { ...prev, activeMinutes: newMinutes };
    });
  }, []);

  // Global "Wearable" Simulation
  // Slowly ticks up calories and slightly varies focus/accuracy over time
  useEffect(() => {
    const idleSim = setInterval(() => {
      if (Math.random() > 0.6) {
        setStats((prev) => {
          const calNum = prev.calories + Math.floor(Math.random() * 3);
          const focusNum = Math.min(99, Math.max(60, prev.focus + (Math.random() > 0.5 ? 1 : -1)));
          const accNum = Math.min(100, Math.max(70, prev.accuracy + (Math.random() > 0.8 ? 1 : (Math.random() < 0.2 ? -1 : 0))));
          
          return {
            ...prev,
            calories: calNum,
            focus: focusNum,
            accuracy: accNum,
          };
        });
      }
    }, 2000);

    return () => clearInterval(idleSim);
  }, []);

  return (
    <StatsContext.Provider value={{ stats, setStats, incrementStreak, addHydration, incrementRecipesGenerated, incrementSessions, addActiveMinutes }}>
      {children}
    </StatsContext.Provider>
  );
}

export const useStats = () => useContext(StatsContext);
