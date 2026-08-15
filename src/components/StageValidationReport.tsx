import { AlertTriangle, CheckCircle2, Info, ShieldCheck, XCircle } from "lucide-react";
import { Badge, cn } from "./ui-kit";
import type { ContractValidationIssue, ContractValidationReport } from "../api/pipelineRuns";

const getValue = (source: any, key: string) => {
  if (!source) return undefined;
  const pascalKey = key.charAt(0).toUpperCase() + key.slice(1);
  return source[key] ?? source[pascalKey];
};

const toNumber = (value: any) => {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeIssue = (issue: any): ContractValidationIssue => ({
  severity: getValue(issue, "severity") ?? "Info",
  code: getValue(issue, "code") ?? "",
  message: getValue(issue, "message") ?? "",
  fieldPath: getValue(issue, "fieldPath") ?? "",
  actionHint: getValue(issue, "actionHint") ?? "",
});

const normalizeReport = (raw: any): ContractValidationReport | null => {
  if (!raw) return null;

  const issues = Array.isArray(getValue(raw, "issues"))
    ? getValue(raw, "issues").map(normalizeIssue)
    : [];

  return {
    contractName: getValue(raw, "contractName") ?? "",
    contractVersion: getValue(raw, "contractVersion") ?? "",
    status: getValue(raw, "status") ?? "Ready",
    errorCount: toNumber(getValue(raw, "errorCount")),
    warningCount: toNumber(getValue(raw, "warningCount")),
    infoCount: toNumber(getValue(raw, "infoCount")),
    issueCount: toNumber(getValue(raw, "issueCount")) || issues.length,
    issues,
  };
};

export const extractStageValidationReport = (outputJson?: string | null) => {
  if (!outputJson) return null;

  try {
    const data = JSON.parse(outputJson);
    const metadata = getValue(data, "metadata");
    return normalizeReport(getValue(metadata, "validationReport"));
  } catch {
    return null;
  }
};

const getStatusMeta = (status?: string) => {
  switch ((status ?? "").toLowerCase()) {
    case "blocked":
      return {
        label: "Bloklu",
        icon: XCircle,
        badge: "error" as const,
        shell: "border-rose-500/20 bg-rose-500/5",
        text: "text-rose-300",
      };
    case "review":
      return {
        label: "Kontrol",
        icon: AlertTriangle,
        badge: "warning" as const,
        shell: "border-amber-500/20 bg-amber-500/5",
        text: "text-amber-300",
      };
    default:
      return {
        label: "Hazir",
        icon: CheckCircle2,
        badge: "success" as const,
        shell: "border-emerald-500/20 bg-emerald-500/5",
        text: "text-emerald-300",
      };
  }
};

const getIssueIcon = (severity?: string) => {
  switch ((severity ?? "").toLowerCase()) {
    case "error":
      return <XCircle size={12} className="text-rose-400" />;
    case "warning":
      return <AlertTriangle size={12} className="text-amber-400" />;
    default:
      return <Info size={12} className="text-sky-400" />;
  }
};

export function StageValidationReport({ outputJson }: { outputJson?: string | null }) {
  const report = extractStageValidationReport(outputJson);
  if (!report) return null;

  const statusMeta = getStatusMeta(report.status);
  const StatusIcon = statusMeta.icon;
  const visibleIssues = report.issues.slice(0, 4);

  return (
    <div className={cn("mt-3 rounded-xl border p-3", statusMeta.shell)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-zinc-950/60">
            <StatusIcon size={15} className={statusMeta.text} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-300">
                Contract Health
              </span>
              <Badge variant={statusMeta.badge} className="text-[10px]">
                {statusMeta.label}
              </Badge>
            </div>
            <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-[11px] text-zinc-500">
              <ShieldCheck size={11} />
              <span className="truncate">
                {report.contractName || "Contract"} / {report.contractVersion || "v?"}
              </span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5 text-center">
          <MiniCount label="Error" value={report.errorCount} className="text-rose-300" />
          <MiniCount label="Warn" value={report.warningCount} className="text-amber-300" />
          <MiniCount label="Info" value={report.infoCount} className="text-sky-300" />
        </div>
      </div>

      {visibleIssues.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {visibleIssues.map((issue, index) => (
            <div
              key={`${issue.code}-${index}`}
              className="rounded-lg border border-zinc-800/70 bg-zinc-950/45 px-2.5 py-2"
            >
              <div className="flex items-start gap-2">
                <div className="mt-0.5">{getIssueIcon(issue.severity)}</div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] text-zinc-500">{issue.code || "issue"}</span>
                    {issue.fieldPath && (
                      <span className="rounded border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 font-mono text-[10px] text-zinc-400">
                        {issue.fieldPath}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-300">{issue.message}</p>
                  {issue.actionHint && (
                    <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">{issue.actionHint}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
          {report.issues.length > visibleIssues.length && (
            <div className="text-[11px] text-zinc-500">
              +{report.issues.length - visibleIssues.length} ek issue stage JSON'inda duruyor.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MiniCount({
  label,
  value,
  className,
}: {
  label: string;
  value: number;
  className?: string;
}) {
  return (
    <div className="min-w-12 rounded-lg border border-zinc-800/70 bg-zinc-950/50 px-2 py-1">
      <div className={cn("text-sm font-bold", className)}>{value}</div>
      <div className="text-[9px] uppercase tracking-wider text-zinc-600">{label}</div>
    </div>
  );
}
