import { createContext, useContext, useEffect, useState } from "react";

const StatsContext = createContext(null);

export function StatsProvider({ children }) {
  const [stats, setStats] = useState({
    calories: 1284,
    focus: 85,
    accuracy: 96,
    hydration: 2.1,
    streak: 14,
    activeMinutes: 128,
    goalAccuracy: 94,
    recovery: 88,
    weeklyPerformance: 92,
  });

  // Global "Wearable" Simulation
  // Slowly ticks up calories and slightly varies focus/accuracy over time
  useEffect(() => {
    const idleSim = setInterval(() => {
      if (Math.random() > 0.6) {
        setStats((prev) => {
          const calNum = prev.calories + Math.floor(Math.random() * 3);
          const focusNum = Math.min(99, Math.max(60, prev.focus + (Math.random() > 0.5 ? 1 : -1)));
          const accNum = Math.min(100, Math.max(70, prev.accuracy + (Math.random() > 0.8 ? 1 : (Math.random() < 0.2 ? -1 : 0))));
          // Hydration occasionally ticks up by 0.1L
          const hydNum = prev.hydration + (Math.random() > 0.95 ? 0.1 : 0);
          
          return {
            ...prev,
            calories: calNum,
            focus: focusNum,
            accuracy: accNum,
            hydration: Number(hydNum.toFixed(1))
          };
        });
      }
    }, 2000);

    return () => clearInterval(idleSim);
  }, []);

  return (
    <StatsContext.Provider value={{ stats, setStats }}>
      {children}
    </StatsContext.Provider>
  );
}

export const useStats = () => useContext(StatsContext);
