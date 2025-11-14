import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  FileText,
  Sparkles,
  Settings,
  ListChecks,
  Cpu,
  ChevronDown,
  ChevronRight,
  Shield,
  BookIcon,
  AwardIcon,
  VideoIcon,
  FireExtinguisherIcon,
  CastIcon,
} from "lucide-react";

type Props = {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
};

type LinkProps = {
  to: string;
  label: string;
  collapsed: boolean;
  icon: React.ElementType;
};

export default function Sidebar({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}: Props) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    genel: true,
    icerik: true,
    ayarlar: true,
  });
  const toggle = (key: string) =>
    setOpenGroups((s) => ({ ...s, [key]: !s[key] }));

  return (
    <>
      {/* Mobil görünüm için arkaplan */}
      <div
        className={`fixed inset-0 bg-black/30 z-40 lg:hidden transition-opacity ${
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setMobileOpen(false)}
      />

      <aside
        className={`z-50 bg-white border-r border-neutral-200 h-full flex flex-col transition-all duration-200
        overflow-x-hidden box-border
        ${
          collapsed ? "w-[72px]" : "w-[240px]"
        }  fixed lg:static left-0 top-0 lg:translate-x-0
        ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Başlık */}
        <div className="h-14 flex items-center px-3 border-b border-neutral-200 overflow-x-hidden">
          <img
            src="/logo.png"
            alt="Infotainmentify"
            className="h-7 w-7 mr-2 rounded-lg object-contain"
          />
          {!collapsed && (
            <div className="font-medium text-neutral-800 truncate">
              Infotainmentify
            </div>
          )}
          <button
            type="button"
            className="ml-auto px-2 py-1 rounded-lg border border-neutral-300 text-xs hover:bg-neutral-100"
            onClick={() => setCollapsed(!collapsed)}
            title={collapsed ? "Genişlet" : "Daralt"}
          >
            {collapsed ? ">" : "<"}
          </button>
        </div>

        {/* Menü */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-2">
          {/* Genel */}
          <SidebarGroupHeader
            onClick={() => toggle("genel")}
            collapsed={collapsed}
            open={openGroups.genel}
            title="Genel"
            icon={Home}
          />
          {openGroups.genel && (
            <SidebarSubList collapsed={collapsed}>
              <SidebarLink
                to="/dashboard"
                icon={Home}
                collapsed={collapsed}
                label="Kontrol Paneli"
              />
            </SidebarSubList>
          )}

          {/* İçerik */}
          <SidebarGroupHeader
            onClick={() => toggle("icerik")}
            collapsed={collapsed}
            open={openGroups.icerik}
            title="İÇERİK YÖNETİMİ"
            icon={FileText}
          />
          {openGroups.icerik && (
            <SidebarSubList collapsed={collapsed}>
              <SidebarLink
                to="/topics"
                icon={ListChecks}
                collapsed={collapsed}
                label="Konular"
              />
              <SidebarLink
                to="/scripts"
                icon={BookIcon}
                collapsed={collapsed}
                label="Senaryolar"
              />
              <SidebarLink
                to="/auto-video-assets"
                icon={VideoIcon}
                collapsed={collapsed}
                label="Video Materyaller"
              />
              <SidebarLink
                to="/prompts"
                icon={FileText}
                collapsed={collapsed}
                label="Promptlar"
              />
              <SidebarLink
                to="/topic-generation-profiles"
                icon={Sparkles}
                collapsed={collapsed}
                label="Konu Üretim Profilleri"
              />
              <SidebarLink
                to="/script-generation-profiles"
                icon={AwardIcon}
                collapsed={collapsed}
                label="Senaryo Üretim Profilleri"
              />
              <SidebarLink
                to="/auto-video-asset-profiles"
                icon={CastIcon}
                collapsed={collapsed}
                label="Otomatik Video Üretim Profilleri"
              />
            </SidebarSubList>
          )}

          {/* İçerik */}
          <SidebarGroupHeader
            onClick={() => toggle("gorevler")}
            collapsed={collapsed}
            open={openGroups.icerik}
            title="GÖREV YÖNETİMİ"
            icon={FileText}
          />
          {openGroups.icerik && (
            <SidebarSubList collapsed={collapsed}>
              <SidebarLink
                to="/job-settings"
                icon={FileText}
                collapsed={collapsed}
                label="Görevler"
              />
              <SidebarLink
                to="/job-executions"
                icon={ListChecks}
                collapsed={collapsed}
                label="Görev Günlükleri"
              />
            </SidebarSubList>
          )}

          {/* Ayarlar */}
          <SidebarGroupHeader
            onClick={() => toggle("ayarlar")}
            collapsed={collapsed}
            open={openGroups.ayarlar}
            title="Ayarlar"
            icon={Settings}
          />
          {openGroups.ayarlar && (
            <SidebarSubList collapsed={collapsed}>
              <SidebarLink
                to="/social-channels"
                icon={Settings}
                collapsed={collapsed}
                label="Sosyal Medya Tanımları"
              />
              <SidebarLink
                to="/ai-integrations"
                icon={Cpu}
                collapsed={collapsed}
                label="Yapay Zeka Ayarları"
              />
              <SidebarLink
                to="/security"
                icon={Shield}
                collapsed={collapsed}
                label="Güvenlik"
              />
            </SidebarSubList>
          )}
        </nav>

        {/* Alt bilgi */}
        <div className="shrink-0 p-2 border-t border-neutral-200 text-xs text-neutral-500">
          v0.1 • Yerel
        </div>
      </aside>
    </>
  );
}

function SidebarGroupHeader({
  title,
  open,
  collapsed,
  onClick,
  icon: Icon,
}: {
  title: string;
  open: boolean;
  collapsed: boolean;
  onClick: () => void;
  icon: React.ElementType;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full flex items-center gap-2",
        "px-2 py-2 rounded-lg",
        "bg-neutral-50 hover:bg-neutral-100",
        "text-neutral-700 select-none",
        "border border-neutral-200",
      ].join(" ")}
    >
      <span className="inline-flex items-center justify-center h-4 w-4">
        {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </span>
      {!collapsed && (
        <>
          <Icon size={15} className="text-neutral-500" />
          <span className="text-[11px] tracking-wider uppercase text-neutral-600 font-medium">
            {title}
          </span>
        </>
      )}
    </button>
  );
}

function SidebarSubList({
  children,
  collapsed,
}: {
  children: React.ReactNode;
  collapsed: boolean;
}) {
  return (
    <div
      className={[
        "mt-1 mb-2",
        collapsed ? "" : "pl-3 border-l border-neutral-200/70",
      ].join(" ")}
    >
      <div className="flex flex-col gap-1">{children}</div>
    </div>
  );
}

function SidebarLink({ to, label, collapsed, icon: Icon }: LinkProps) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "group flex items-center gap-2 w-full",
          "px-3 py-2 rounded-xl",
          "hover:bg-neutral-100 text-neutral-700",
          isActive
            ? "bg-neutral-100 font-medium relative before:content-[''] before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[3px] before:rounded-full before:bg-neutral-900"
            : "",
        ].join(" ")
      }
    >
      <Icon
        size={18}
        className="text-neutral-500 group-hover:text-neutral-700 transition-colors shrink-0"
      />
      {!collapsed && (
        <span className="text-sm truncate whitespace-nowrap">{label}</span>
      )}
    </NavLink>
  );
}
