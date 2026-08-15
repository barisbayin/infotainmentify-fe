import { Suspense, useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { Toaster } from "react-hot-toast";
import { FloatingJobWidget } from "../components/NotificationComponents";
import { MouseSpotlight } from "../components/MouseSpotlight";
import { MENU_CONFIG } from "../config/menu";

type WorkspaceTab = {
  path: string;
  label: string;
};

const TABS_STORAGE_KEY = "ui.workspaceTabs";
const MAX_WORKSPACE_TABS = 12;

const normalizePath = (path: string) => {
  if (!path || path === "/") return "/dashboard";
  return path.split("?")[0].split("#")[0];
};

const getRouteLabel = (path: string) => {
  const cleanPath = normalizePath(path);
  const menuItem = MENU_CONFIG
    .flatMap((group) => group.items)
    .find((item) => item.to === cleanPath);

  if (menuItem) return menuItem.label;

  const contentMatch = cleanPath.match(/^\/content\/(\d+)/i);
  if (contentMatch) return `Icerik #${contentMatch[1]}`;

  return cleanPath
    .replace(/^\//, "")
    .split("/")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" / ") || "Dashboard";
};

const loadStoredTabs = (): WorkspaceTab[] => {
  try {
    const raw = localStorage.getItem(TABS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((tab) => tab && typeof tab.path === "string")
      .map((tab) => ({
        path: normalizePath(tab.path),
        label: typeof tab.label === "string" && tab.label.trim()
          ? tab.label
          : getRouteLabel(tab.path),
      }))
      .slice(0, MAX_WORKSPACE_TABS);
  } catch {
    return [];
  }
};

export default function Layout() {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("ui.collapse") === "1"
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const activePath = normalizePath(location.pathname);
  const [tabs, setTabs] = useState<WorkspaceTab[]>(() => {
    const stored = loadStoredTabs();
    return stored.length > 0
      ? stored
      : [{ path: "/dashboard", label: getRouteLabel("/dashboard") }];
  });

  useEffect(() => {
    document.body.classList.add("app-compact");
    return () => document.body.classList.remove("app-compact");
  }, []);

  useEffect(() => {
    localStorage.setItem("ui.collapse", collapsed ? "1" : "0");
  }, [collapsed]);

  useEffect(() => {
    setTabs((prev) => {
      const exists = prev.some((tab) => tab.path === activePath);
      if (exists) {
        return prev.map((tab) =>
          tab.path === activePath ? { ...tab, label: getRouteLabel(activePath) } : tab
        );
      }

      const next = [...prev, { path: activePath, label: getRouteLabel(activePath) }];
      return next.slice(Math.max(0, next.length - MAX_WORKSPACE_TABS));
    });
  }, [activePath]);

  useEffect(() => {
    localStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(tabs));
  }, [tabs]);

  const workspaceTabs = useMemo(() => tabs, [tabs]);

  const closeTab = (path: string) => {
    setTabs((prev) => {
      if (prev.length <= 1) return prev;

      const index = prev.findIndex((tab) => tab.path === path);
      const next = prev.filter((tab) => tab.path !== path);

      if (path === activePath) {
        const fallback = next[Math.max(0, index - 1)] || next[0];
        if (fallback) navigate(fallback.path);
      }

      return next;
    });
  };

  return (
    <div className="relative flex h-screen overflow-hidden bg-zinc-950 text-zinc-200 font-sans isolate">
      <MouseSpotlight />
      <div className="bg-noise" />
      <Sidebar
        collapsed={collapsed}
        setCollapsed={setCollapsed}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex h-14 shrink-0 items-center border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl z-30">
          <Topbar
            onOpenMobile={() => setMobileOpen(true)}
            tabs={workspaceTabs}
            activePath={activePath}
            onSelectTab={(path) => navigate(path)}
            onCloseTab={closeTab}
          />
        </header>

        <main className="flex-1 overflow-y-auto p-0 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-zinc-800">
          <Suspense fallback={<div className="p-8 text-zinc-500">Yukleniyor...</div>}>
            <Outlet />
          </Suspense>
        </main>
      </div>

      <FloatingJobWidget />
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
