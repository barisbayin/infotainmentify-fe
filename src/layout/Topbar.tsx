import { Menu, X } from "lucide-react";
import { cn } from "../components/ui-kit";

type WorkspaceTab = {
  path: string;
  label: string;
};

export default function Topbar({
  onOpenMobile,
  tabs,
  activePath,
  onSelectTab,
  onCloseTab,
}: {
  onOpenMobile: () => void;
  tabs: WorkspaceTab[];
  activePath: string;
  onSelectTab: (path: string) => void;
  onCloseTab: (path: string) => void;
}) {
  return (
    <div className="flex w-full min-w-0 items-center gap-3 px-3">
      <button
        onClick={onOpenMobile}
        className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white lg:hidden"
        title="Menu"
      >
        <Menu size={22} />
      </button>

      <div className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto scrollbar-thin scrollbar-thumb-zinc-800">
        {tabs.map((tab) => {
          const active = tab.path === activePath;
          return (
            <button
              key={tab.path}
              type="button"
              onClick={() => onSelectTab(tab.path)}
              className={cn(
                "group inline-flex h-9 max-w-[240px] shrink-0 items-center gap-2 rounded-lg border px-3 text-xs font-semibold transition",
                active
                  ? "border-indigo-500/40 bg-indigo-500/15 text-white shadow-lg shadow-indigo-950/30"
                  : "border-transparent bg-transparent text-zinc-400 hover:bg-zinc-800/70 hover:text-zinc-100"
              )}
              title={tab.label}
            >
              <span
                className={cn(
                  "h-1.5 w-1.5 shrink-0 rounded-full",
                  active ? "bg-indigo-300" : "bg-zinc-700 group-hover:bg-zinc-500"
                )}
              />
              <span className="truncate">{tab.label}</span>
              <span
                role="button"
                tabIndex={-1}
                onClick={(event) => {
                  event.stopPropagation();
                  onCloseTab(tab.path);
                }}
                className={cn(
                  "ml-1 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-zinc-500 transition hover:bg-zinc-700 hover:text-white",
                  tabs.length <= 1 && "pointer-events-none opacity-30"
                )}
                title="Sekmeyi kapat"
              >
                <X size={12} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
