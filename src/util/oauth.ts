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