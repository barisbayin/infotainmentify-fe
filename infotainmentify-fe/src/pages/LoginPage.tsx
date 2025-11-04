import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";

const field =
  "block w-full rounded-xl border border-gray-300 bg-white px-4 py-3 outline-none focus:border-gray-900";

export default function LoginPage() {
  const { login } = useAuth();
  const [identity, setIdentity] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      await login(identity.trim(), password, remember);
      // login sonrası ana layout'a
      window.location.href = "/dashboard";
    } catch (ex: any) {
      setErr(ex?.message ?? "Giriş başarısız.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center bg-gradient-to-b from-gray-50 to-gray-100">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-gray-100"
      >
        <h1 className="text-2xl font-bold tracking-tight mb-6 text-gray-900">
          Infotainmentify • Giriş
        </h1>
        <label className="block text-sm font-medium text-gray-700">
          E-posta veya kullanıcı adı
        </label>
        <input
          className={`${field} mt-1 mb-4`}
          autoFocus
          value={identity}
          onChange={(e) => setIdentity(e.target.value)}
          placeholder="email veya kullanıcı adı"
        />
        <label className="block text-sm font-medium text-gray-700">Şifre</label>
        <input
          className={`${field} mt-1 mb-4`}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
        <div className="flex items-center justify-between mb-6">
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
            />{" "}
            Beni hatırla
          </label>
          <span className="text-sm text-gray-400">v0.1</span>
        </div>
        {err && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {err}
          </div>
        )}
        <button
          disabled={loading}
          className="w-full rounded-xl bg-gray-900 py-3 text-white font-semibold hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
        </button>
      </form>
    </div>
  );
}
