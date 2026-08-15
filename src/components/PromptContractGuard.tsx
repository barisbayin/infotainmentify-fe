import { AlertTriangle, CheckCircle2, Info, ShieldCheck } from "lucide-react";
import { Badge } from "./ui-kit";

export type PromptGuardKind = "topic" | "script";
export type PromptGuardSeverity = "ok" | "info" | "warning" | "error";

export type PromptGuardIssue = {
  severity: Exclude<PromptGuardSeverity, "ok">;
  title: string;
  detail: string;
};

type PromptContractGuardProps = {
  kind: PromptGuardKind;
  systemInstruction?: string;
  promptTemplate?: string;
  targetDurationSec?: number;
};

export function analyzePromptContract({
  kind,
  systemInstruction,
  promptTemplate,
  targetDurationSec,
}: PromptContractGuardProps): PromptGuardIssue[] {
  const text = `${systemInstruction ?? ""}\n${promptTemplate ?? ""}`.toLowerCase();
  const issues: PromptGuardIssue[] = [];

  if (!text.trim()) return issues;

  if (kind === "topic") {
    if (hasAny(text, ["topic ideas", "generate 1 long-form youtube topic idea", "generate 1 long-form youtube topic ideas"])) {
      issues.push({
        severity: "warning",
        title: "Topic fikir listesi gibi davranabilir",
        detail: "Long-form akista Topic stage rastgele fikir listesi degil, brief'i production-ready topic document'a cevirmeli.",
      });
    }

    if (!hasAny(text, ["{maintitle}", "{brieftitle}"])) {
      issues.push({
        severity: "info",
        title: "Brief ana baslik placeholder'i yok",
        detail: "{MainTitle} veya {BriefTitle} kullanmak, Topic'in brief disina kaymasini azaltir.",
      });
    }

    if (!hasAny(text, ["{angle}", "{audience}", "{mustcover}", "{avoid}", "{hookdirection}", "{thumbnaildirection}", "{notes}"])) {
      issues.push({
        severity: "info",
        title: "Brief detay placeholder'lari zayif",
        detail: "Angle, audience, must-cover ve avoid alanlari Topic kalitesini ciddi sekilde artirir.",
      });
    }
  }

  if (kind === "script") {
    const hasSceneDirectionFields = hasAny(text, [
      "scenerole",
      "scenepurpose",
      "viewerquestion",
      "emotionalbeat",
      "visualtype",
      "cameraplan",
      "transitionintent",
    ]);
    const locksOldJsonShape = hasAny(text, [
      "do not add extra json fields",
      "use only the exact json shape",
      "output exactly this json shape",
      "each scene must include: scene, audiotext, visualprompt, durationsec",
    ]);

    if (locksOldJsonShape && !hasSceneDirectionFields) {
      issues.push({
        severity: "error",
        title: "Eski JSON kontrati yeni pipeline ile cakisiyor",
        detail: "Prompt sadece audioText/visualPrompt/durationSec'e kilitlenirse Scene Direction V2 ve Visual Variety alanlari zayif kalir.",
      });
    }

    if (hasAny(text, ["do not add extra json fields", "do not add chapter objects", "do not add visualbeats"])) {
      issues.push({
        severity: "warning",
        title: "Kontrat kullanici prompt'una tasinmis",
        detail: "JSON shape ve yasaklar backend tarafindan ekleniyor. Kullanici prompt'u daha cok yaratici niyeti anlatmali.",
      });
    }

    if ((targetDurationSec ?? 0) >= 480 && hasAny(text, ["12 to 18 scenes", "12-18 scenes"])) {
      issues.push({
        severity: "warning",
        title: "Long-form icin sahne sayisi dusuk",
        detail: "8-10 dk videoda 12-18 script sahnesi ritmi zayiflatabilir. 45-80 anlatim sahnesi daha iyi baslangic.",
      });
    }

    if (hasAny(text, ["100 to 120 scenes", "100-120 scenes", "130 scenes", "approximately 130"])) {
      issues.push({
        severity: "warning",
        title: "Sahne sayisi cok agresif",
        detail: "Cok fazla script sahnesi image/TTS maliyetini ve rate-limit riskini artirir. Gorsel beatleri Storyboard/EditPlan yonetmeli.",
      });
    }

    if (hasAny(text, ["new visual should be generated every 4", "each scene represents exactly one visual generation"])) {
      issues.push({
        severity: "warning",
        title: "Script sahnesi gorsel beat'e karisiyor",
        detail: "Script anlatim sahnesini kurmali; tek sahne icindeki gorsel ritmi Storyboard, Image ve EditPlan katmanlari yonetmeli.",
      });
    }

    if (!hasAny(text, ["chapter", "section", "intro", "outro", "bolum", "bölüm"])) {
      issues.push({
        severity: "info",
        title: "Bolumlu long-form yapi zayif",
        detail: "Prompt chapter/section akisini isterse Creative Director ve Script daha tutarli ilerler.",
      });
    }
  }

  if (hasAny(text, ["cinematic documentary"]) && hasAny(text, ["stick figure", "whiteboard", "doodle"])) {
    issues.push({
      severity: "warning",
      title: "Gorsel stil sinyali karisik",
      detail: "Cinematic documentary ile whiteboard/stick-figure ayni promptta geciyorsa Image stage kararsiz kalabilir. Bir ana gorsel dil sec.",
    });
  }

  return issues;
}

export function PromptContractGuard(props: PromptContractGuardProps) {
  const issues = analyzePromptContract(props);
  const highest = issues.some((x) => x.severity === "error")
    ? "error"
    : issues.some((x) => x.severity === "warning")
      ? "warning"
      : issues.some((x) => x.severity === "info")
        ? "info"
        : "ok";

  const tone = {
    ok: "border-emerald-500/20 bg-emerald-500/[0.04]",
    info: "border-blue-500/20 bg-blue-500/[0.04]",
    warning: "border-amber-500/20 bg-amber-500/[0.04]",
    error: "border-red-500/20 bg-red-500/[0.04]",
  }[highest];

  return (
    <div className={`rounded-xl border ${tone} p-3`}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-bold text-zinc-200">
          <ShieldCheck size={14} className={highest === "error" ? "text-red-300" : highest === "warning" ? "text-amber-300" : "text-emerald-300"} />
          Prompt Contract Guard
        </div>
        <Badge variant="neutral" className="text-[9px]">
          {highest === "ok" ? "Temiz" : `${issues.length} uyari`}
        </Badge>
      </div>

      {issues.length === 0 ? (
        <div className="flex items-start gap-2 text-[11px] leading-relaxed text-emerald-200/80">
          <CheckCircle2 size={13} className="mt-0.5 shrink-0" />
          Prompt yaratici niyet ile backend kontratini su an karistirmiyor gibi gorunuyor.
        </div>
      ) : (
        <div className="space-y-2">
          {issues.map((issue, index) => (
            <div key={`${issue.title}-${index}`} className="flex gap-2 rounded-lg border border-zinc-800/70 bg-zinc-950/35 p-2">
              {issue.severity === "info" ? (
                <Info size={13} className="mt-0.5 shrink-0 text-blue-300" />
              ) : (
                <AlertTriangle size={13} className={`mt-0.5 shrink-0 ${issue.severity === "error" ? "text-red-300" : "text-amber-300"}`} />
              )}
              <div>
                <div className="text-[11px] font-semibold text-zinc-200">{issue.title}</div>
                <div className="mt-0.5 text-[10px] leading-relaxed text-zinc-500">{issue.detail}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function hasAny(text: string, patterns: string[]) {
  return patterns.some((pattern) => text.includes(pattern.toLowerCase()));
}
