import { http } from "./http";

/* -------------------------------
   🎯 ENUM & DTO Tanımları
--------------------------------*/
export type JobStatus = "Pending" | "Running" | "Success" | "Failed" | "Stopped";

export interface JobSettingListDto {
    id: number;
    name: string;
    jobType: string;
    profileType: string;
    profileId: number;
    isAutoRunEnabled: boolean;
    periodHours: number | null;
    status: JobStatus;
    lastRunAt?: string | null;
    lastError?: string | null;
    lastErrorAt?: Date | null;
}

export interface JobSettingDetailDto extends JobSettingListDto { }

export interface JobExecutionListDto {
    id: number;
    jobId: number;
    jobName: string;
    status: JobStatus;
    startedAt: string;
    completedAt?: string | null;
    errorMessage?: string | null;
}

export interface JobExecutionDetailDto extends JobExecutionListDto {
    resultJson: any;
}

/* -------------------------------
   ⚙️ API Nesnesi
--------------------------------*/
export const jobsApi = {
    // --- Job Settings ---
    listSettings() {
        return http<JobSettingListDto[]>("/api/jobsettings");
    },

    getSetting(id: number) {
        return http<JobSettingDetailDto>(`/api/jobsettings/${id}`);
    },

    upsertSetting(dto: JobSettingDetailDto) {
        return http<number>("/api/jobsettings", {
            method: "POST",
            body: JSON.stringify(dto),
        });
    },

    deleteSetting(id: number) {
        return http<void>(`/api/jobsettings/${id}`, { method: "DELETE" });
    },

    triggerJob(id: number) {
        return http<void>(`/api/jobsettings/${id}/trigger`, { method: "POST" });
    },

    // --- Job Executions ---
    listExecutions() {
        return http<JobExecutionListDto[]>("/api/jobexecutions");
    },

    getExecution(id: number) {
        return http<JobExecutionDetailDto>(`/api/jobexecutions/${id}`);
    },
};
