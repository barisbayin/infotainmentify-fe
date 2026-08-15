import { memo } from "react";
import { Clock, Loader2 } from "lucide-react";
import type { PipelineRunListDto } from "../../api/pipelineRuns";
import { Card, Table, THead, TR, TH, TD, cn } from "../ui-kit";
import { RunStatusBadge } from "./RunStatusBadge";

type RunHistoryListProps = {
  items: PipelineRunListDto[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  loading: boolean;
};

export const RunHistoryList = memo(({ items, selectedId, onSelect, loading }: RunHistoryListProps) => {
  return (
    <Card className="flex-1 min-h-0 p-0 overflow-hidden flex flex-col border-zinc-800 bg-zinc-900/40">
      <div className="overflow-auto flex-1 scrollbar-thin scrollbar-thumb-zinc-700">
        <Table className="border-none w-full">
          <THead>
            <TR className="bg-zinc-900/80 sticky top-0 z-10 backdrop-blur-md">
              <TH className="text-zinc-400 font-medium w-16">ID</TH>
              <TH className="text-zinc-400 font-medium">Şablon</TH>
              <TH className="text-zinc-400 font-medium">İçerik Başlığı</TH>
              <TH className="text-zinc-400 font-medium text-center w-24">Durum</TH>
              <TH className="text-zinc-400 font-medium text-right w-24">Saat</TH>
            </TR>
          </THead>
          <tbody>
            {items.map((item) => (
              <TR
                key={item.id}
                onClick={() => onSelect(item.id)}
                className={cn(
                  "cursor-pointer transition-all border-b border-zinc-800/50 hover:bg-zinc-800/40 group",
                  selectedId === item.id ? "bg-indigo-500/5" : ""
                )}
              >
                <TD className="font-mono text-zinc-500 text-xs py-3 group-hover:text-zinc-300 transition-colors pl-4">
                  #{item.id}
                </TD>
                <TD className="font-medium text-zinc-200 py-3">
                  <div
                    className={cn(
                      "flex items-center gap-3 transition-all duration-300",
                      selectedId === item.id ? "translate-x-1" : ""
                    )}
                  >
                    <div
                      className={cn(
                        "w-1 rounded-full bg-indigo-500 transition-all duration-300",
                        selectedId === item.id ? "h-4 opacity-100" : "h-0 opacity-0 w-0"
                      )}
                    />
                    <span className="truncate max-w-[150px] lg:max-w-[200px]" title={item.templateName}>
                      {item.templateName}
                    </span>
                  </div>
                </TD>
                <TD className="font-medium text-zinc-200 py-3">
                  <div className="truncate max-w-[150px] lg:max-w-[200px]" title={item.runContextTitle}>
                    {item.runContextTitle}
                  </div>
                </TD>
                <TD className="text-center py-3">
                  <RunStatusBadge status={item.status} />
                </TD>
                <TD className="text-right text-zinc-500 text-xs py-3 font-mono whitespace-nowrap">
                  {item.startedAt
                    ? new Date(item.startedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : "-"}
                </TD>
              </TR>
            ))}
            {items.length === 0 && !loading && (
              <TR>
                <TD colSpan={5}>
                  <div className="flex flex-col items-center justify-center py-10 text-zinc-500 w-full select-none">
                    <div className="p-3 bg-zinc-800/50 rounded-full border border-zinc-800/50 mb-3">
                      <Clock className="w-6 h-6 opacity-30" />
                    </div>
                    <span className="text-sm font-medium">Henüz bir üretim geçmişi yok.</span>
                  </div>
                </TD>
              </TR>
            )}
            {loading && items.length === 0 && (
              <TR>
                <TD colSpan={5} className="text-center py-12 text-zinc-500">
                  <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 opacity-50" />
                  Yükleniyor...
                </TD>
              </TR>
            )}
          </tbody>
        </Table>
      </div>
    </Card>
  );
});

RunHistoryList.displayName = "RunHistoryList";
