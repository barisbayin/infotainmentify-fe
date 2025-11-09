import { HttpError } from "./types";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export function qs(params: Record<string, any>) {
    const p = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
        if (v === undefined || v === null || v === "") return;
        p.set(k, String(v));
    });
    const s = p.toString();
    return s ? `?${s}` : "";
}

function isAbsoluteUrl(url: string) {
    return /^https?:\/\//i.test(url);
}

export function getAuthToken() {
    return localStorage.getItem("auth.token");
}

export type HttpOptions = RequestInit & { timeoutMs?: number };

export async function http<T = unknown>(input: RequestInfo, init?: HttpOptions): Promise<T> {
    const url = typeof input === "string" ? (isAbsoluteUrl(input) ? input : `${API_BASE}${input}`) : input;

    const controller = new AbortController();
    const timeoutMs = init?.timeoutMs ?? 20000;
    const tt = window.setTimeout(() => controller.abort(), timeoutMs);

    try {
        const headers: Record<string, string> = { ...(init?.headers as Record<string, string>) };
        const isFormData = (init?.body as any) instanceof FormData;
        if (!isFormData && !headers["Content-Type"]) headers["Content-Type"] = "application/json";

        const token = getAuthToken();
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(url, { cache: "no-store", ...init, headers, signal: controller.signal });

        if (res.status === 401) {
            window.dispatchEvent(new CustomEvent("auth:unauthorized"));
        }

        const ct = res.headers.get("content-type") || "";
        const isJson = ct.includes("application/json");

        if (!res.ok) {
            let detail: any = null;
            try {
                detail = isJson ? await res.json() : (await res.text()) || null;
                if (detail && typeof detail === "string") detail = { message: detail };
            } catch { /* noop */ }
            const msg = (detail && (detail.title || detail.message)) || res.statusText || `HTTP ${res.status}`;
            throw new HttpError(msg, res.status, detail);
        }

        if (res.status === 204) return undefined as T;
        const contentLength = res.headers.get("content-length");
        if (contentLength === "0") return undefined as T;

        if (isJson) {
            try { return (await res.json()) as T; } catch { return undefined as T; }
        }
        const txt = await res.text();
        return (txt ? (txt as unknown as T) : (undefined as T));
    } finally {
        window.clearTimeout(tt);
    }
}

// multipart helper
export async function upload(path: string, form: FormData) {
    return http<{ path: string; file: string }>(path, { method: "POST", body: form });
}
