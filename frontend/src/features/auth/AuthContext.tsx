import { createContext, useContext, useState, type ReactNode } from "react";

type AuthState = { token: string; username: string };

const AUTH_STORAGE_KEY = "tds-auth-state";

type AuthContextValue = {
  auth: AuthState | null;
  isAuthenticated: boolean;
  login: (token: string, username: string) => void;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function loadAuth(): AuthState | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<AuthState>;
    if (!parsed.token?.trim()) return null;
    return {
      token: parsed.token.trim(),
      username: parsed.username?.trim() || "user",
    };
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState | null>(loadAuth);

  function login(token: string, username: string) {
    const next = { token, username };
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(next));
    setAuth(next);
  }

  function logout() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    setAuth(null);
  }

  return (
    <AuthContext.Provider
      value={{ auth, isAuthenticated: auth !== null, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
