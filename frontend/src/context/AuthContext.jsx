/**
 * AuthContext
 * -----------
 * Provides real database-backed authentication using the FastAPI backend.
 * Uses JWT tokens stored in localStorage for session persistence.
 *
 * The "user" object shape:
 *   { id, name, email, age, weight, height, goals }
 */

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import axios from "axios";

const AuthContext = createContext(null);

const TOKEN_KEY = "yogai_token";
const USER_KEY  = "yogai_user";
const BASE_URL  = "http://localhost:5000/api/auth";

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    try {
      const token = localStorage.getItem(TOKEN_KEY);
      const raw   = localStorage.getItem(USER_KEY);
      if (token && raw) {
        setUser(JSON.parse(raw));
      }
    } catch {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } finally {
      setLoading(false);
    }
  }, []);

  /** Register a new user via the backend */
  const register = useCallback(async ({ name, email, password, goals = [] }) => {
    try {
      const res = await axios.post(`${BASE_URL}/register`, { name, email, password });
      const { access_token, user: userData } = res.data;
      userData.goals = Array.isArray(goals) ? goals : [];
      localStorage.setItem(TOKEN_KEY, access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (err) {
      console.error("Register error:", err.response?.data || err.message);
      const detail = err.response?.data?.detail;
      if (err.code === "ERR_NETWORK") throw new Error("Cannot connect to server. Is the backend running on port 5000?");
      throw new Error(detail || "Registration failed. Please try again.");
    }
  }, []);

  /** Login with email + password via the backend */
  const login = useCallback(async ({ email, password }) => {
    try {
      const res = await axios.post(`${BASE_URL}/login`, { email, password });
      const { access_token, user: userData } = res.data;
      localStorage.setItem(TOKEN_KEY, access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (err) {
      const detail = err.response?.data?.detail;
      throw new Error(detail || "Login failed. Check your email and password.");
    }
  }, []);

  /** Update local profile fields (persisted to localStorage) */
  const updateProfile = useCallback((updates) => {
    setUser((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem(USER_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  /** Logout — clears token and user from memory */
  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
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
