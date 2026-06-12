/**
 * AuthContext
 * -----------
 * Provides user auth state across the whole app.
 * Uses localStorage for persistence (no external service needed).
 *
 * The "user" object shape:
 *   { name, email, avatar, goals, joinedAt }
 */

import { createContext, useCallback, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

const STORAGE_KEY = "yogai_user";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  /** Register a new user (stored in localStorage) */
  const register = useCallback(({ name, email, password, goals = [] }) => {
    // Check if email already exists
    const existingRaw = localStorage.getItem("yogai_accounts");
    const accounts = existingRaw ? JSON.parse(existingRaw) : {};

    if (accounts[email]) {
      throw new Error("An account with this email already exists.");
    }

    const newUser = {
      name,
      email,
      passwordHash: btoa(password), // base64 – NOT production-safe, just for demo
      avatar: null,
      goals,
      age: "",
      gender: "",
      height: "",
      weight: "",
      diet: "",
      allergies: "",
      joinedAt: new Date().toISOString(),
    };

    accounts[email] = newUser;
    localStorage.setItem("yogai_accounts", JSON.stringify(accounts));

    // Auto-login
    const sessionUser = { 
      name, email, avatar: null, goals, 
      age: "", gender: "", height: "", weight: "", diet: "", allergies: "",
      joinedAt: newUser.joinedAt 
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
    setUser(sessionUser);
    return sessionUser;
  }, []);

  /** Login with email + password */
  const login = useCallback(({ email, password }) => {
    const existingRaw = localStorage.getItem("yogai_accounts");
    const accounts = existingRaw ? JSON.parse(existingRaw) : {};
    const account = accounts[email];

    if (!account) throw new Error("No account found with this email.");
    if (account.passwordHash !== btoa(password)) throw new Error("Incorrect password.");

    const sessionUser = {
      name: account.name,
      email: account.email,
      avatar: account.avatar,
      goals: account.goals,
      age: account.age || "",
      gender: account.gender || "",
      height: account.height || "",
      weight: account.weight || "",
      diet: account.diet || "",
      allergies: account.allergies || "",
      joinedAt: account.joinedAt,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
    setUser(sessionUser);
    return sessionUser;
  }, []);

  /** Update profile fields */
  const updateProfile = useCallback((updates) => {
    setUser((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      // Also patch accounts store
      try {
        const existingRaw = localStorage.getItem("yogai_accounts");
        const accounts = existingRaw ? JSON.parse(existingRaw) : {};
        if (accounts[next.email]) {
          accounts[next.email] = { ...accounts[next.email], ...updates };
          localStorage.setItem("yogai_accounts", JSON.stringify(accounts));
        }
      } catch {}
      return next;
    });
  }, []);

  /** Logout */
  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
