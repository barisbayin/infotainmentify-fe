import { http } from "./http";

// Backend Enum'ına uygun stringler
export const STAGE_TYPES = [
    { value: "Topic", label: "Konu (Topic)" },
    { value: "Script", label: "Senaryo (Script)" },
    { value: "Image", label: "Görsel (Image)" },
    { value: "Tts", label: "Seslendirme (TTS)" },
    { value: "Stt", label: "Deşifre (STT)" },
    { value: "Video", label: "Video Üretimi" },
    { value: "SceneLayout", label: "Kurgu/Timeline" },
    { value: "Render", label: "Render (Birleştirme)" },
    { value: "Upload", label: "Yükleme (YouTube vs)" },
];

export type StageConfigDto = {
    id?: number;
    stageType: string;
    order: number;
    presetId?: number;
    optionsJson?: string;
};

export type PipelineTemplateListDto = {
    id: number;
    name: string;
    conceptName: string;
    stageCount: number;
    autoPublish: boolean;
    createdAt: string;
};

export type PipelineTemplateDetailDto = {
    id: number;
    name: string;
    description?: string;
    conceptId: number;
    stages: StageConfigDto[];
    autoPublish: boolean;
    createdAt: string;
    updatedAt?: string;
};

export type SavePipelineTemplateDto = {
    name: string;
    description?: string;
    conceptId: number;
    autoPublish: boolean;
    stages: StageConfigDto[];
};

export const pipelineTemplatesApi = {
    list(q?: string, conceptId?: string) { // 🔥 Eklendi
        const p = new URLSearchParams();
        if (q) p.set("q", q);
        if (conceptId) p.set("conceptId", conceptId);
        return http<PipelineTemplateListDto[]>(`/api/pipeline-templates?${p.toString()}`);
    },

    get(id: number) {
        return http<PipelineTemplateDetailDto>(`/api/pipeline-templates/${id}`);
    },

    create(dto: SavePipelineTemplateDto) {
        return http<{ id: number }>("/api/pipeline-templates", {
            method: "POST",
            body: JSON.stringify(dto),
        });
    },

    update(id: number, dto: SavePipelineTemplateDto) {
        return http<void>(`/api/pipeline-templates/${id}`, {
            method: "PUT",
            body: JSON.stringify(dto),
        });
    },

    delete(id: number) {
        return http<void>(`/api/pipeline-templates/${id}`, { method: "DELETE" });
    },
};