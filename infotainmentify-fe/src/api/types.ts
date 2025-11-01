export type Prompt = {
    id: number;
    name: string;
    category?: string | null;
    language?: string | null;
    isActive: boolean;
    body: string;
    createdAt?: string;
    updatedAt?: string | null;
};

export type Topic = {
    id: number;
    topicCode: string;
    category?: string | null;
    premiseTr?: string | null;
    premise?: string | null;
    tone?: string | null;
    potentialVisual?: string | null;
    needsFootage: boolean;
    factCheck: boolean;
    tagsJson?: string | null;
    topicJson?: string | null;
    promptId?: number | null;
    createdAt?: string;
    updatedAt?: string | null;
    isActive: boolean;
};

export class HttpError extends Error {
    status: number;
    detail?: any;
    constructor(message: string, status: number, detail?: any) {
        super(message);
        this.name = "HttpError";
        this.status = status;
        this.detail = detail;
    }
}

export type Paginated<T> = {
    items: T[];
    total: number;
    page: number;
    pageSize: number;
};

export type AuthUser = {
    id: number; email: string; username: string; role: string; directoryName: string;
};
export type AuthResponse = { token: string; user: AuthUser };

export type GenerateTopicsRequest = {
    promptId: number;
    count?: number;
    language?: string | null;
    category?: string | null;
    tone?: string | null;
    needsFootage?: boolean;
    factCheck?: boolean;
    tagsJson?: string | null;
    seedNotes?: string | null;
    ownerUserId?: number | null;
    dryRun?: boolean;
};
export type GenerateTopicsResponse = {
    jobId?: number;
    createdTopicIds?: number[];
    previewTitles?: string[];
};

// DTO tipleri (BE ile uyumlu)
export type AiProviderType = "OpenAI" | "GoogleVertex" | "DeepSeek" | "AzureOpenAI" | "Anthropic";
export type AiAuthType = "ApiKey" | "ApiKeySecret" | "OAuth2";
export type AiCapabilityFlags = number; // [Flags]


export const CredentialExposure = {
    None: 0,
    Masked: 1,
    Plain: 2,
} as const;

export type CredentialExposure =
    (typeof CredentialExposure)[keyof typeof CredentialExposure];


export type UserAiConnectionDetailDto = {
    id: number; // create'de 0 veya yok sayılacak
    name: string;
    provider: AiProviderType;
    authType: AiAuthType;
    capabilities: AiCapabilityFlags;
    isDefaultForText: boolean;
    isDefaultForImage: boolean;
    isDefaultForEmbedding: boolean;
    credentials?: Record<string, string> | null; // Create/Update: PLAIN gönder
    credentialsExposure: CredentialExposure; // Get dönüşünde hangi exposure kullanıldı
};

export type SocialChannelType =
    | "YouTube"
    | "Instagram"
    | "TikTok"
    | "Twitter"
    | "Other";
