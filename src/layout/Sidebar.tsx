import { useState } from "react";
import { NavLink } from "react-router-dom";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import { cn } from "../components/ui-kit"; // veya senin path: "../components/ui-kit"
import { MENU_CONFIG } from "../config/menu";

type Props = {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
};

export default function Sidebar({
  collapsed,
  setCollapsed,
  mobileOpen,
  setMobileOpen,
}: Props) {
  // Başlangıçta tüm gruplar açık olsun
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    MENU_CONFIG.reduce((acc, curr) => ({ ...acc, [curr.key]: true }), {})
  );

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <>
      {/* Mobile Overlay */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setMobileOpen(false)}
      />

      {/* Sidebar Container */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 flex h-full flex-col border-r border-zinc-800 bg-zinc-950 transition-all duration-300 lg:static",
          collapsed ? "w-[72px]" : "w-[260px]",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Header (Logo) */}
        <div
          className={cn(
            "flex h-16 shrink-0 items-center border-b border-zinc-800 transition-all duration-300",
            // 🔥 DÜZELTME 1: Kapalıyken padding'i px-2'ye düşür (px-4 çok fazla geliyor)
            collapsed ? "justify-center px-2 gap-2" : "justify-between px-4"
          )}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            {/* 🔥 DÜZELTME 2: min-w-[2rem] ekledik. Tarayıcıya "Ne olursa olsun bunu 32px'den küçük yapma" diyoruz. */}
            <img
              src="/favicon.png"
              alt="Logo"
              className="h-8 w-8 min-w-[2rem] min-h-[2rem] shrink-0 rounded-full object-cover bg-zinc-900 border border-zinc-700/50"
            />

            {/* Yazı: Animasyonlu gizleme */}
            <div
              className={cn(
                "transition-all duration-300 ease-in-out origin-left overflow-hidden",
                collapsed
                  ? "w-0 opacity-0 scale-0"
                  : "w-auto opacity-100 scale-100"
              )}
            >
              <span className="font-bold tracking-tight text-zinc-100 text-base whitespace-nowrap">
                Infotainmentify
              </span>
            </div>
          </div>

          {/* Toggle Butonu (Sadece Desktop) */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            // 🔥 DÜZELTME 3: Kapalıyken butonu gizlemiyoruz ama biraz daha sıkıştırıyoruz
            className={cn(
              "hidden lg:flex h-6 w-6 items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors",
              collapsed &&
                "absolute right-[-12px] bg-zinc-900 border border-zinc-700 shadow-sm z-50 h-6 w-6 rounded-full"
              // Opsiyonel: Kapalıyken butonu sidebar'ın dışına (çizgi üzerine) taşıdım.
              // Bu çok şık bir "Dashboard" hareketidir. Beğenmezsen 'absolute...' kısmını sil.
            )}
          >
            {collapsed ? (
              <ChevronRight size={12} />
            ) : (
              <ChevronDown size={14} className="rotate-90" />
            )}
          </button>

          {/* Mobile Close */}
          <button
            onClick={() => setMobileOpen(false)}
            className="lg:hidden text-zinc-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Menu Area */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-4 scrollbar-thin scrollbar-thumb-zinc-800">
          {MENU_CONFIG.map((group) => {
            const isOpen = openGroups[group.key];

            return (
              <div key={group.key} className="flex flex-col">
                {/* GRUP BAŞLIĞI (Accordion Tetikleyici) */}
                {!collapsed ? (
                  <button
                    onClick={() => toggleGroup(group.key)}
                    className="group flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-500 hover:bg-zinc-900/50 hover:text-zinc-300 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <group.icon
                        size={14}
                        className="text-zinc-600 group-hover:text-indigo-400 transition-colors"
                      />
                      <span>{group.title}</span>
                    </div>
                    <ChevronDown
                      size={14}
                      className={cn(
                        "transition-transform duration-200",
                        isOpen ? "rotate-180" : ""
                      )}
                    />
                  </button>
                ) : (
                  // Collapsed modunda sadece grup ikonu (Seperator gibi durur)
                  <div
                    className="flex justify-center py-2 mb-1 border-b border-zinc-800/50 last:border-0"
                    title={group.title}
                  >
                    <group.icon size={16} className="text-zinc-600" />
                  </div>
                )}

                {/* ALT MENÜLER (Accordion Body) */}
                <div
                  className={cn(
                    "space-y-0.5 overflow-hidden transition-all duration-300 ease-in-out",
                    // Kapalıysa height 0, Açıksa auto (Collapsed modda her zaman gösteriyoruz ki ikonlara erişilsin)
                    !isOpen && !collapsed
                      ? "max-h-0 opacity-0"
                      : "max-h-[500px] opacity-100",
                    !collapsed && "mt-1 pl-2" // Açıkken hafif girinti
                  )}
                >
                  {group.items.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition-all duration-200",
                          // Collapsed modunda ortala, değilse sola yasla
                          collapsed ? "justify-center" : "",
                          isActive
                            ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/20"
                            : "text-zinc-400 hover:bg-zinc-800/80 hover:text-zinc-100"
                        )
                      }
                      title={collapsed ? item.label : undefined}
                    >
                      <item.icon
                        size={18}
                        className={cn(
                          "shrink-0 transition-colors"
                          // Active değilken ikon rengi
                          // Active ise zaten text-white ile beyaz oluyor
                        )}
                      />
                      {!collapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            );
          })}
        </nav>


      </aside>
    </>
  );
}
