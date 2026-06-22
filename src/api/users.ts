import { http } from "./http";


export type AuthUser = {
    id: number;
    email: string;
    username: string;
    role: string;
    directoryName: string;
};
export type AuthResponse = {
    token: string;
    user: AuthUser
};

// Me => AuthUser (senin tipine göre)
export function getMe() {
    return http<AuthUser>("/api/app-users/me");
}

// Şifre değiştir
export function changeMyPassword(currentPassword: string, newPassword: string) {
    return http<void>("/api/app-users/me/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
    });
}
