import { createContext, useContext, useMemo, useState } from "react";
import api from "../lib/api.js";

const STORAGE_KEY = "fieldwork-auth";
const AuthContext = createContext(null);

function readStoredAuth() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (!value) return null;
    const parsed = JSON.parse(value);
    return parsed?.token && parsed?.user ? parsed : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStoredAuth);

  function saveAuth(data) {
    const nextAuth = { user: data.user, token: data.token };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAuth));
    setAuth(nextAuth);
    return nextAuth;
  }

  async function login(credentials) {
    const { data } = await api.post("/auth/login", credentials);
    return saveAuth(data.data);
  }

  async function register(details) {
    const { data } = await api.post("/auth/register", details);
    return saveAuth(data.data);
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY);
    setAuth(null);
  }

  const value = useMemo(
    () => ({
      user: auth?.user ?? null,
      token: auth?.token ?? null,
      isAuthenticated: Boolean(auth?.token),
      login,
      register,
      logout,
    }),
    [auth],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
