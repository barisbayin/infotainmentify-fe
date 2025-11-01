import { Suspense, useEffect, useMemo, useState } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { routes } from "../routes";
import { Toaster } from "react-hot-toast";
import { ConfirmProvider } from "../components/confirm";

export default function Layout() {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("ui.collapse") === "1"
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    localStorage.setItem("ui.collapse", collapsed ? "1" : "0");
  }, [collapsed]);

  const defaultPath = useMemo(() => routes?.[0]?.path ?? "/", []);

  return (
    <ConfirmProvider>
      <div className="h-screen overflow-hidden">
        <div className="flex h-full">
          <Sidebar
            collapsed={collapsed}
            setCollapsed={setCollapsed}
            mobileOpen={mobileOpen}
            setMobileOpen={setMobileOpen}
          />

          <div className="flex h-full">
            {/* Sidebar, Topbar, Toaster, Routes vs. */}
          </div>

          <div className="flex-1 min-w-0 flex flex-col">
            <div className="shrink-0 sticky top-0 z-40 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 border-b border-neutral-200">
              <div className="h-14 flex items-center">
                <Topbar onOpenMobile={() => setMobileOpen(true)} />
              </div>
            </div>

            <Toaster
              position="top-right"
              toastOptions={{
                style: { fontSize: "14px" },
                success: {
                  // yeşil çerçeve/arka plan
                  style: {
                    border: "1px solid #16a34a",
                    background: "#ecfdf5",
                    color: "#065f46",
                  },
                  iconTheme: { primary: "#16a34a", secondary: "#ECFDF5" },
                },
                error: {
                  style: {
                    border: "1px solid #f43f5e",
                    background: "#fff1f2",
                    color: "#9f1239",
                  },
                  iconTheme: { primary: "#f43f5e", secondary: "#FFF1F2" },
                },
              }}
            />

            <main className="flex-1 min-h-0 overflow-auto bg-neutral-50 p-4">
              <Suspense fallback={<PageSkeleton />}>
                <Routes>
                  <Route
                    path="/"
                    element={<Navigate to={defaultPath} replace />}
                  />
                  {routes.map((r) => {
                    const El = r.element;
                    return (
                      <Route key={r.path} path={r.path} element={<El />} />
                    );
                  })}
                </Routes>
              </Suspense>
            </main>
          </div>
        </div>
      </div>
    </ConfirmProvider>
  );
}
function PageSkeleton() {
  return (
    <div className="grid gap-3">
      <div className="h-10 rounded-xl bg-white border border-neutral-200 animate-pulse" />
      <div className="h-64 rounded-2xl bg-white border border-neutral-200 animate-pulse" />
    </div>
  );
}
