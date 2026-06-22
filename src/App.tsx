import { Routes, Route, Navigate } from "react-router-dom";
import Protected from "./components/Protected";
import GuestOnly from "./components/GuestOnly";
import LoginPage from "./pages/LoginPage";
import Layout from "./layout/Layout";
import { routes } from "./routes"; // 🔥 Senin oluşturduğun route listesi

export default function App() {
  return (
    <Routes>
      {/* 1. MİSAFİR GİRİŞİ (Login) */}
      <Route
        path="/login"
        element={
          <GuestOnly>
            <LoginPage />
          </GuestOnly>
        }
      />

      {/* 2. KORUMALI ALAN (Auth Check) */}
      <Route element={<Protected />}>
        {/* 3. LAYOUT KABUĞU (Outlet burada devreye giriyor) */}
        {/* 'path="/*"' yerine direkt element olarak veriyoruz ve altına child ekliyoruz */}
        <Route element={<Layout />}>
          {/* Varsayılan yönlendirme: Ana sayfaya geleni Dashboard'a at */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* 4. DİNAMİK ROTALAR (routes.tsx dosyasından geliyor) */}
          {routes.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={<route.element />}
            />
          ))}

          {/* 404 - Bilinmeyen bir sayfa gelirse Dashboard'a yönlendir */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
    </Routes>
  );
}
