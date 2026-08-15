import { cn } from "../ui-kit";

const statusColor = (status: string) => {
  switch (status) {
    case "Running":
      return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    case "Completed":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "Failed":
    case "PermanentlyFailed":
      return "bg-red-500/10 text-red-400 border-red-500/20";
    case "Pending":
      return "bg-zinc-800 text-zinc-400 border-zinc-700";
    case "Cancelled":
      return "bg-zinc-700 text-zinc-300 border-zinc-600";
    case "WaitingForApproval":
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    default:
      return "bg-zinc-800 text-zinc-400 border-zinc-700";
  }
};

const statusLabel = (status: string) => {
  switch (status) {
    case "Running":
      return "İşleniyor";
    case "Completed":
      return "Tamamlandı";
    case "Failed":
      return "Hata Oluştu";
    case "PermanentlyFailed":
      return "Kalıcı Hata";
    case "Pending":
      return "Bekliyor";
    case "Cancelled":
      return "İptal Edildi";
    case "WaitingForApproval":
      return "Onayda";
    default:
      return status;
  }
};

export function RunStatusBadge({
  status,
  rounded = "md",
}: {
  status: string;
  rounded?: "md" | "full";
}) {
  return (
    <span
      className={cn(
        "inline-flex border px-2 py-0.5 text-[10px] font-medium",
        rounded === "full" ? "rounded-full uppercase tracking-wider font-bold shadow-sm px-2.5" : "rounded",
        statusColor(status)
      )}
    >
      {statusLabel(status)}
    </span>
  );
}
