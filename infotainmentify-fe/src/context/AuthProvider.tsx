import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
  useContext,
} from "react";
import { AuthApi } from "../api"; // veya "../api"
import type { AuthUser } from "../api/types";

type AuthCtx = {
  user: AuthUser | null;
  token: string | null;
  login: (
    identity: string,
    password: string,
    remember?: boolean
  ) => Promise<void>;
  logout: () => void;
};

const TOKEN_KEY = "auth.token";
const USER_KEY = "auth.user";

export const AuthContext = createContext<AuthCtx | undefined>(undefined);

function isJwtExpired(token: string) {
  try {
    const [, payload] = token.split(".");
    const { exp } = JSON.parse(atob(payload));
    return typeof exp === "number" ? Date.now() >= exp * 1000 : true;
  } catch {
    return true;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Tek seferlik init: storage + expiry kontrolü
  useEffect(() => {
    const t = localStorage.getItem(TOKEN_KEY);
    const u = localStorage.getItem(USER_KEY);
    if (t && u && !isJwtExpired(t)) {
      setToken(t);
      setUser(JSON.parse(u));
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  }, []);

  const login = useCallback(
    async (identity: string, password: string, remember = true) => {
      const { token, user } = await AuthApi.login(identity, password);
      setToken(token);
      setUser(user);
      if (remember) {
        localStorage.setItem(TOKEN_KEY, token);
        localStorage.setItem(USER_KEY, JSON.stringify(user));
      }
    },
    []
  );

  const logout = useCallback(() => {
    try {
      AuthApi.logout();
    } catch {
      /* client-side clear anyway */
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  // Global 401 event -> logout
  useEffect(() => {
    const handler = () => logout();
    window.addEventListener("auth:unauthorized", handler as EventListener);
    return () =>
      window.removeEventListener("auth:unauthorized", handler as EventListener);
  }, [logout]);

  // (opsiyonel) token kendi kendine süre dolunca otomatik çıkış
  useEffect(() => {
    if (!token) return;
    let timer: number | undefined;
    try {
      const [, payload] = token.split(".");
      const { exp } = JSON.parse(atob(payload));
      if (typeof exp === "number") {
        const ms = exp * 1000 - Date.now();
        if (ms > 0) timer = window.setTimeout(() => logout(), ms + 1000);
      }
    } catch {}
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [token, logout]);

  const value = useMemo(
    () => ({ user, token, login, logout }),
    [user, token, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Kolay tüketim için helper hook
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
