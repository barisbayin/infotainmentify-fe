import { http } from "./http";
import type { AuthUser } from "./types";

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
