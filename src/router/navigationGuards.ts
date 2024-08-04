import { useAppStore } from "@/store/app";
import { buildOAuthUrl, OAuthRespose, TokenScope } from "@/util/oauth";
import { withErrorMessage } from "@/util/withErrorMessage";
import axios from "axios";
import { RouteLocationNormalized, RouteLocationRaw } from "vue-router";

export async function onLoginEnter(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
): Promise<RouteLocationRaw | boolean> {
    const oauthCode = to.query["code"] ?? "";
    const state = JSON.parse((to.query["state"] as string | undefined) ?? "{}");
    const store = useAppStore();
    if (oauthCode !== undefined && oauthCode.length > 0) {
        try {
            const tokenResponse: OAuthRespose = await withErrorMessage(
                async () =>
                    (
                        await axios.post("/auth/oauth/token", {
                            grant_type: "authorization_code",
                            client_id: "gropius-auth-client",
                            code: oauthCode,
                            code_verifier: store.codeVerifier
                        })
                    ).data,
                "Could not login."
            );
            if (state.register) {
                withErrorMessage(async () => {
                    await axios.post(
                        "/auth/api/login/registration/self-link",
                        {
                            register_token: tokenResponse.access_token
                        },
                        {
                            headers: {
                                Authorization: `Bearer ${await store.getAccessToken()}`
                            }
                        }
                    );
                }, "Could not link account.");
            } else {
                await handleOAuthResponse(tokenResponse, store);
            }
            return {
                path: state.from,
                replace: true
            };
        } catch (err) {
            return {
                name: "home",
                replace: true
            };
        }
    } else {
        return authorizeIfRequired(to);
    }
}

export async function onAnyEnter(
    to: RouteLocationNormalized,
    from: RouteLocationNormalized
): Promise<RouteLocationRaw | boolean> {
    if (to.name == "login") {
        return true;
    }
    return await authorizeIfRequired(to);
}

async function authorizeIfRequired(to: RouteLocationNormalized) {
    const store = useAppStore();
    if (!(await store.isLoggedIn())) {
        window.location.href = await buildOAuthUrl([TokenScope.LOGIN_SERVICE, TokenScope.BACKEND], to.fullPath);
        true;
    } else {
        store.validateUser();
    }
    return true;
}

async function handleOAuthResponse(tokenResponse: OAuthRespose, store: ReturnType<typeof useAppStore>) {
    store.setNewTokenPair(tokenResponse.access_token, tokenResponse.refresh_token);
}
