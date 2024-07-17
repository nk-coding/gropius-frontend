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
    BACKEND = "backend",
}

export function buildOAuthUrl(scope: TokenScope[], redirectTo: string): string {
    return (
        "/auth/oauth/authorize?" +
        new URLSearchParams({
            client_id: "gropius-auth-client",
            response_type: "code",
            scope: scope.join(" "),
            redirect_uri: window.location.origin + "/login",
            state: JSON.stringify({ from: redirectTo }),
        }).toString()
    );
}