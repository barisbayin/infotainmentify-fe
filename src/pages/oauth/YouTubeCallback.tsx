import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function YouTubeCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    async function run() {
      const url = new URL(window.location.href);
      const code = url.searchParams.get("code");
      const verifier = localStorage.getItem("yt_pkce_verifier");

      if (!code || !verifier) {
        alert("Kod alınamadı.");
        return;
      }

      // Token endpoint
      const body = new URLSearchParams({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        code: code,
        code_verifier: verifier,
        redirect_uri: "http://localhost:5173/oauth/youtube/callback",
        grant_type: "authorization_code",
      });

      const res = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body,
      });

      const json = await res.json();
      console.log("TOKEN RESPONSE:", json);

      if (json.error) {
        alert("Auth error: " + json.error_description);
        return;
      }

      // Refresh token FE’de hazır!
      localStorage.setItem("yt_refresh_token", json.refresh_token);
      localStorage.setItem("yt_access_token", json.access_token);

      // Kullanıcıyı sosyal kanal ekranına geri gönder
      navigate("/social-channels");
    }

    run();
  }, []);

  return <div>Yönlendiriliyor…</div>;
}
