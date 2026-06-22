// Random string
export function generateCodeVerifier() {
    const array = new Uint32Array(56);
    window.crypto.getRandomValues(array);
    return Array.from(array, dec => ('0' + dec.toString(16)).slice(-2)).join('');
}

// SHA256 → base64url
async function sha256(buffer: string) {
    const enc = new TextEncoder().encode(buffer);
    const hash = await crypto.subtle.digest('SHA-256', enc);
    return base64UrlEncode(hash);
}

function base64UrlEncode(buffer: ArrayBuffer) {
    return btoa(String.fromCharCode(...new Uint8Array(buffer)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');
}

// PKCE code challenge üret
export async function generateCodeChallenge(verifier: string) {
    return await sha256(verifier);
}
