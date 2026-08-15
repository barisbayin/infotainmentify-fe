import { http } from "./http";
import type { ConceptListDto, ConceptProfileDto } from "./concepts";
import type {
  PipelineTemplateHealthDto,
  PipelineTemplateListDto,
} from "./pipelineTemplates";
import type { ProductionBrief } from "./pipelineRuns";
import type { SavedProductionBriefDto } from "./productionBriefs";

export type ProductionWizardBootstrapDto = {
  concepts: ConceptListDto[];
  conceptProfile?: ConceptProfileDto | null;
  templates: PipelineTemplateListDto[];
  briefs: SavedProductionBriefDto[];
  recommendedConceptId?: number | null;
  recommendedTemplateId?: number | null;
  selectedTemplateHealth?: PipelineTemplateHealthDto | null;
  preflight: ProductionWizardPreflightDto;
};

export type ProductionWizardRequestDto = {
  conceptId?: number;
  templateId?: number;
  savedBriefId?: number;
  brief?: ProductionBrief;
  autoStart: boolean;
  pauseBeforeRender: boolean;
};

export type ProductionWizardStartResultDto = {
  runId: number;
  message: string;
  preflight: ProductionWizardPreflightDto;
};

export type ProductionWizardPreflightDto = {
  canStart: boolean;
  errorCount: number;
  warningCount: number;
  infoCount: number;
  items: ProductionWizardPreflightItemDto[];
  recommendedNextSteps: string[];
};

export type ProductionWizardPreflightItemDto = {
  severity: "Error" | "Warning" | "Info" | string;
  code: string;
  message: string;
  target?: string | null;
  howToFix?: string | null;
  actionLabel?: string | null;
  actionRoute?: string | null;
};

export const productionWizardApi = {
  bootstrap(params?: { conceptId?: number | string; templateId?: number | string }) {
    const p = new URLSearchParams();
    if (params?.conceptId) p.set("conceptId", String(params.conceptId));
    if (params?.templateId) p.set("templateId", String(params.templateId));
    const query = p.toString();
    return http<ProductionWizardBootstrapDto>(
      `/api/production-wizard/bootstrap${query ? `?${query}` : ""}`
    );
  },

  preflight(dto: ProductionWizardRequestDto) {
    return http<ProductionWizardPreflightDto>("/api/production-wizard/preflight", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },

  start(dto: ProductionWizardRequestDto) {
    return http<ProductionWizardStartResultDto>("/api/production-wizard/start", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },
};
