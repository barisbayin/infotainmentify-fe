import { http } from "./http";
import type { AuthResponse } from "./types";

const TOKEN_KEY = "auth.token";

export function setAuthToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
}
export function clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
}

export async function login(login: string, password: string) {
    const res = await http<AuthResponse>("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ login, password }),
    });
    setAuthToken(res.token);
    return res;
}

export async function register(email: string, username: string, password: string, role = "Normal") {
    const res = await http<AuthResponse>("/api/auth/register", {
        method: "POST",
        body: JSON.stringify({ email, username, password, role }),
    });
    setAuthToken(res.token);
    return res;
}

// server-side revoke varsa çağır; yoksa sadece temizle
export async function logout() {
    try { await http<void>("/api/auth/logout", { method: "POST" }); } catch { }
    clearAuth();
}
