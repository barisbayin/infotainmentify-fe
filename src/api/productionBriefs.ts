import { http } from "./http";
import type { ProductionBrief } from "./pipelineRuns";

export const PRODUCTION_BRIEF_FIELD_LIMITS = {
  name: 160,
  mainTitle: 500,
  angle: 12_000,
  audience: 4_000,
  targetDuration: 100,
  mustCover: 20_000,
  avoid: 12_000,
  hookDirection: 8_000,
  thumbnailDirection: 8_000,
  notes: 20_000,
} as const;

export type SavedProductionBriefDto = ProductionBrief & {
  id: number;
  conceptId?: number | null;
  conceptName?: string | null;
  name: string;
  createdAt: string;
  updatedAt?: string | null;
  lastUsedAt?: string | null;
};

export type SaveProductionBriefDto = ProductionBrief & {
  conceptId?: number | null;
  name: string;
};

export const productionBriefsApi = {
  list(params?: { q?: string; conceptId?: string | number }) {
    const p = new URLSearchParams();
    if (params?.q) p.set("q", params.q);
    if (params?.conceptId) p.set("conceptId", String(params.conceptId));
    const query = p.toString();
    return http<SavedProductionBriefDto[]>(
      `/api/production-briefs${query ? `?${query}` : ""}`
    );
  },

  get(id: number) {
    return http<SavedProductionBriefDto>(`/api/production-briefs/${id}`);
  },

  create(dto: SaveProductionBriefDto) {
    return http<{ id: number }>("/api/production-briefs", {
      method: "POST",
      body: JSON.stringify(dto),
    });
  },

  update(id: number, dto: SaveProductionBriefDto) {
    return http<void>(`/api/production-briefs/${id}`, {
      method: "PUT",
      body: JSON.stringify(dto),
    });
  },

  delete(id: number) {
    return http<void>(`/api/production-briefs/${id}`, { method: "DELETE" });
  },
};
