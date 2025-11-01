import type { AiProviderType, AiAuthType } from "../api/types";

export const AI_PROVIDER_OPTIONS: { value: AiProviderType; label: string }[] = [
    { value: "OpenAI", label: "OpenAI (ChatGPT)" },
    { value: "GoogleVertex", label: "Google Vertex / Gemini" },
    { value: "DeepSeek", label: "DeepSeek" },
    { value: "AzureOpenAI", label: "Azure OpenAI" },
    { value: "Anthropic", label: "Anthropic Claude" },
];

export const AI_AUTH_TYPE_OPTIONS: { value: AiAuthType; label: string }[] = [
    { value: "ApiKey", label: "API Key" },
    { value: "ApiKeySecret", label: "API Key + Secret" },
    { value: "OAuth2", label: "OAuth2 (Token tabanlı)" },
];
