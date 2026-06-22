import { useState, useRef, useEffect } from "react";
import { useNotifications, type AppNotification } from "../context/NotificationContext";
import { Bell, Check, ChevronDown, Activity, Loader2 } from "lucide-react";
import { cn, Card } from "./ui-kit";

// --- NOTIFICATION CENTER (HEADER BUTTON & POPOVER) ---
export function NotificationCenter() {
  const { notifications, unreadCount, markAllAsRead, markAsRead } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-zinc-400 hover:text-white transition-colors rounded-lg hover:bg-zinc-800 focus:outline-none"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full border border-zinc-950 animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between p-3 border-b border-zinc-800 bg-zinc-950/50">
            <span className="text-sm font-semibold text-zinc-200">Bildirimler</span>
            {notifications.length > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[10px] text-zinc-500 hover:text-indigo-400 flex items-center gap-1 transition-colors"
              >
                <Check size={12} /> Tümünü Okundu İşaretle
              </button>
            )}
          </div>

          <div className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-700">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs">
                <Bell className="mx-auto mb-2 opacity-20" size={32} />
                Henüz bildiriminiz yok.
              </div>
            ) : (
              <div className="flex flex-col">
                {notifications.map((notif) => (
                  <NotificationItem key={notif.id} item={notif} onRead={() => markAsRead(notif.id)} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotificationItem({ item, onRead }: { item: AppNotification; onRead: () => void }) {
  const bg = item.read ? "bg-transparent" : "bg-indigo-500/5";


  return (
    <div
      onClick={onRead}
      className={cn(
        "p-3 border-b border-zinc-800/50 hover:bg-zinc-800/50 transition-colors cursor-pointer group flex gap-3 items-start",
        bg
      )}
    >
      <div className={cn("mt-1 w-2 h-2 rounded-full shrink-0", !item.read ? "bg-indigo-500" : "bg-transparent")} />
      <div className="flex-1 overflow-hidden">
        <h4 className={cn("text-xs font-medium mb-0.5", item.read ? "text-zinc-400" : "text-zinc-200")}>
          {item.title}
        </h4>
        <p className="text-[11px] text-zinc-500 leading-relaxed truncate group-hover:whitespace-normal group-hover:text-clip">
          {item.message}
        </p>
        <span className="text-[10px] text-zinc-600 mt-1 block font-mono">
          {item.timestamp.toLocaleTimeString()}
        </span>
      </div>
    </div>
  );
}

// --- FLOATING JOB WIDGET (BOTTOM RIGHT) ---
export function FloatingJobWidget() {
  const { activeJobs } = useNotifications();
  const [isExpanded, setIsExpanded] = useState(true);

  if (activeJobs.length === 0) return null;

  // Sadece en son eklenen veya en önemli işi göster (veya liste yapabiliriz, şimdilik tekli)
  const job = activeJobs[0];
  const count = activeJobs.length;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 animate-in slide-in-from-bottom-4 duration-500">
      {isExpanded ? (
        <Card className="w-80 bg-zinc-900/90 backdrop-blur-xl border border-zinc-700 shadow-2xl p-0 overflow-hidden">
          <div className="flex items-center justify-between p-3 bg-zinc-800/50 border-b border-zinc-700/50">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-200">
              <Activity size={14} className="text-amber-500 animate-pulse" />
               Aktif İşlemler ({count})
            </div>
            <button
               onClick={() => setIsExpanded(false)}
               className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-700"
            >
              <ChevronDown size={16} />
            </button>
          </div>
          
          <div className="p-4 flex flex-col gap-3">
             <div className="flex justify-between items-start">
                <span className="text-sm font-medium text-white truncate max-w-[200px]" title={job.title}>{job.title}</span>
                <span className="text-xs text-amber-500 font-mono">{job.progress}%</span>
             </div>
             
             {/* Progress Bar */}
             <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div 
                   className="h-full bg-amber-500 transition-all duration-300 ease-out"
                   style={{ width: `${job.progress}%` }}
                />
             </div>
             
             <div className="flex justify-between items-center text-[10px] text-zinc-500">
                <span className="flex items-center gap-1.5">
                   <Loader2 size={10} className="animate-spin" /> {job.status}
                </span>
                <span className="font-mono">Runs #{job.id}</span>
             </div>
          </div>
          
          {count > 1 && (
             <div className="p-2 bg-zinc-950/30 text-center text-[10px] text-zinc-500 border-t border-zinc-800/30">
                +{count - 1} diğer işlem sırada
             </div>
          )}
        </Card>
      ) : (
        <button
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-3 px-4 py-3 rounded-full bg-zinc-900 border border-zinc-700 text-zinc-200 shadow-xl hover:bg-zinc-800 hover:border-zinc-500 transition-all group"
        >
           <Activity size={18} className="text-amber-500 animate-pulse" />
           <span className="text-sm font-medium">İşleniyor...</span>
           <div className="w-8 h-8 rounded-full border-2 border-zinc-800 border-t-amber-500 animate-spin absolute right-2 opacity-20 group-hover:opacity-40" />
        </button>
      )}
    </div>
  );
}
