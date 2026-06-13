import { createContext, useContext, useEffect, useState, useCallback } from "react";

const StatsContext = createContext(null);

export function StatsProvider({ children }) {
  const [stats, setStats] = useState({
    calories: 0,
    focus: 0,
    accuracy: 0,
    hydration: 0,
    streak: parseInt(localStorage.getItem("yogai_streak") || "0", 10),
    activeMinutes: 0,
    goalAccuracy: 0,
    recovery: 100,
    weeklyPerformance: 0,
    recipesGenerated: parseInt(localStorage.getItem("yogai_recipes_generated") || "0", 10),
    sessions: parseInt(localStorage.getItem("yogai_sessions") || "0", 10),
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
    setStats((prev) => ({
      ...prev,
      hydration: Number((prev.hydration + amountInLiters).toFixed(2))
    }));
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
    <StatsContext.Provider value={{ stats, setStats, incrementStreak, addHydration, incrementRecipesGenerated, incrementSessions }}>
      {children}
    </StatsContext.Provider>
  );
}

export const useStats = () => useContext(StatsContext);
