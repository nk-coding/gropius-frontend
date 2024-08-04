import { useAppStore } from "@/store/app";

export interface OAuthRespose {
    access_token: string;
    token_type: string;
    expires_in: number;
    refresh_token: string;
    scope: string;
}

export enum TokenScope {
    LOGIN_SERVICE = "login",
    LOGIN_SERVICE_REGISTER = "login-register",
    BACKEND = "backend"
}

function base64URLEncode(str: string): string {
    return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

export async function buildOAuthUrl(scope: TokenScope[], redirectTo: string): Promise<string> {
    const codeVerifierArray = new Uint8Array(32);
    crypto.getRandomValues(codeVerifierArray);
    const codeVerifier = base64URLEncode(String.fromCharCode.apply(null, Array.from(codeVerifierArray)));
    useAppStore().codeVerifier = codeVerifier;
    const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(codeVerifier));
    const codeChallenge = base64URLEncode(String.fromCharCode.apply(null, Array.from(new Uint8Array(hash))));
    return (
        "/auth/oauth/authorize?" +
        new URLSearchParams({
            client_id: "gropius-auth-client",
            response_type: "code",
            scope: scope.join(" "),
            redirect_uri: window.location.origin + "/login",
            state: JSON.stringify({ from: redirectTo, register: scope.includes(TokenScope.LOGIN_SERVICE_REGISTER) }),
            code_challenge_method: "S256",
            code_challenge: codeChallenge
        }).toString()
    );
}
