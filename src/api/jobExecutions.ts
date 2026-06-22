import { http } from "./http";

export interface JobExecutionListDto {
    id: number;
    jobId: number;
    jobName: string;
    status: string;
    startedAt?: string;
    completedAt?: string;
    errorMessage?: string;
}

export const jobExecutionsApi = {
    list: (jobId?: number) =>
        http<JobExecutionListDto[]>(`/api/jobexecutions${jobId ? `?jobId=${jobId}` : ""}`),

    get: (id: number) =>
        http<JobExecutionListDto>(`/api/jobexecutions/${id}`),
};
