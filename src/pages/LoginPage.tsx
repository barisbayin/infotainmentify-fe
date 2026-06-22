import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { Loader2, KeyRound, Mail, Lock, ShieldCheck } from "lucide-react";

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
    <div className="min-h-screen w-full flex items-center justify-center bg-[#09090b] relative overflow-hidden font-sans">
      {/* Background Ambience */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-violet-600/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Card */}
      <div className="w-full max-w-sm mx-4 relative z-10">
        {/* Logo / Header Area */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-violet-500 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-2xl shadow-indigo-500/20">
             <KeyRound className="text-white" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Tekrar Hoşgeldin
          </h1>
          <p className="text-zinc-500 text-sm mt-2">
            Infotainmentify paneline erişmek için oturum aç.
          </p>
        </div>

        <form
          onSubmit={onSubmit}
          className="bg-zinc-900/80 backdrop-blur-2xl border border-zinc-700/50 rounded-2xl p-6 shadow-2xl shadow-indigo-500/10"
        >
          {err && (
            <div className="mb-6 p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-400 text-xs font-medium flex items-center gap-2">
              <ShieldCheck size={16} />
              {err}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400 ml-1">
                E-posta veya Kullanıcı Adı
              </label>
              <div className="relative group">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                  autoFocus
                  value={identity}
                  onChange={(e) => setIdentity(e.target.value)}
                  placeholder="admin@example.com"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-zinc-400 ml-1">
                Şifre
              </label>
              <div className="relative group">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
                <input
                  className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder:text-zinc-600 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer hover:text-zinc-300 transition-colors">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500/20"
                />
                Beni hatırla
              </label>
              <a href="#" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                Şifremi unuttum?
              </a>
            </div>

            <button
              disabled={loading}
              className="w-full relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] mt-2"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                   <Loader2 size={16} className="animate-spin" />
                   Giriş Yapılıyor...
                </div>
              ) : (
                "Giriş Yap"
              )}
            </button>
          </div>
        </form>
        
        <p className="text-center text-[10px] text-zinc-600 mt-8">
          &copy; 2024 Infotainmentify &bull; v1.0.0
        </p>
      </div>
    </div>
  );
}
