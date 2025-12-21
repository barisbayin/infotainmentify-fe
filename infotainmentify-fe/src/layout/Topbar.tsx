import { Search, Menu } from "lucide-react";
import { NotificationCenter } from "../components/NotificationComponents";
import { UserMenu } from "../components/UserMenu";
// import { cn } from "../components/ui-kit";

export default function Topbar({ onOpenMobile }: { onOpenMobile: () => void }) {
  return (
    <div className="flex w-full items-center justify-between px-6">
      {/* Sol: Mobile Trigger */}
      <div className="flex items-center gap-4">
        <button
          onClick={onOpenMobile}
          className="rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white lg:hidden transition-colors"
        >
          <Menu size={24} />
        </button>

        {/* Search Bar */}
        <div className="relative hidden md:block group">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" />
          <input
            className="h-10 w-72 rounded-xl border border-zinc-800 bg-zinc-900/50 pl-10 pr-4 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-indigo-500/50 focus:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
            placeholder="Ara (Topic, Script...)"
          />
        </div>
      </div>

      {/* Sağ: Actions */}
      <div className="flex items-center gap-4">
        {/* SignalR Status (Yeşil nokta) */}
        <div className="flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/50 px-3 py-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-medium text-zinc-400">Connected</span>
        </div>

        {/* Notifications */}
        {/* Notifications */}
        <NotificationCenter />
        
        {/* User Menu */}
        <UserMenu />
      </div>
    </div>
  );
}
