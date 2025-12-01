import { Suspense, useState, useEffect } from "react";
import { Outlet } from "react-router-dom"; // 🔥 BU EKLENDİ
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { Toaster } from "react-hot-toast";
// import { cn } from "../components/ui-kit";

export default function Layout() {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("ui.collapse") === "1"
  );
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem("ui.collapse", collapsed ? "1" : "0");
  }, [collapsed]);

  return (
    <div className="flex h-screen overflow-hidden bg-zinc-950 text-zinc-200 font-sans">
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex h-16 shrink-0 items-center border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl z-30">
          <Topbar onOpenMobile={() => setMobileOpen(true)} />
        </header>

        <main className="flex-1 overflow-y-auto p-0 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-800">
          {/* 🔥 DÜZELTME BURADA: Router mantığı buradan kalktı, Outlet geldi */}
          <Suspense
            fallback={<div className="p-8 text-zinc-500">Yükleniyor...</div>}
          >
            <Outlet />
          </Suspense>
        </main>
      </div>

      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#18181b",
            color: "#e4e4e7",
            border: "1px solid #27272a",
          },
          success: { iconTheme: { primary: "#4ade80", secondary: "#18181b" } },
          error: { iconTheme: { primary: "#f87171", secondary: "#18181b" } },
        }}
      />
    </div>
  );
}
