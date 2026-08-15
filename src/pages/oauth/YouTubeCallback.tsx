import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Loader2, Youtube } from "lucide-react";
import { socialChannelsApi } from "../../api/socialChannels";

export default function YouTubeCallback() {
  const navigate = useNavigate();
  const startedRef = useRef(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const complete = async () => {
      const url = new URL(window.location.href);
      const oauthError = url.searchParams.get("error");
      const oauthErrorDescription = url.searchParams.get("error_description");
      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");

      if (oauthError) {
        setError(oauthErrorDescription || `Google yetkilendirmesi tamamlanmadi: ${oauthError}`);
        return;
      }
      if (!code || !state) {
        setError("Google OAuth donusunde code veya state bulunamadi.");
        return;
      }

      try {
        const result = await socialChannelsApi.completeYouTubeOAuth(code, state);
        sessionStorage.setItem("youtube_connected_channel_id", String(result.channelId));
        navigate("/social-channels?youtube=connected", { replace: true });
      } catch (err: any) {
        setError(err?.message || "YouTube yetkilendirmesi kaydedilemedi.");
      }
    };

    void complete();
  }, [navigate]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-lg border border-zinc-800 bg-zinc-900/70 p-6 text-center shadow-xl">
        {error ? (
          <>
            <AlertTriangle className="mx-auto mb-3 text-red-400" size={34} />
            <h1 className="text-lg font-bold text-white">YouTube yetkilendirmesi tamamlanamadi</h1>
            <p className="mt-2 text-sm leading-relaxed text-red-200/80">{error}</p>
            <button
              type="button"
              onClick={() => navigate("/social-channels", { replace: true })}
              className="mt-5 rounded-md border border-zinc-700 bg-zinc-800 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-700"
            >
              Sosyal Hesaplara don
            </button>
          </>
        ) : (
          <>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-400">
              <Youtube size={25} />
            </div>
            <div className="flex items-center justify-center gap-2 text-sm font-semibold text-zinc-200">
              <Loader2 className="animate-spin text-indigo-400" size={17} />
              YouTube upload yetkisi guvenli bicimde kaydediliyor...
            </div>
          </>
        )}
      </div>
    </div>
  );
}
