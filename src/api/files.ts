import { upload } from "./http";

export function uploadUserFile(file: File) {
    const form = new FormData();
    form.append("file", file);
    return upload(`/api/files/upload`, form);
}
