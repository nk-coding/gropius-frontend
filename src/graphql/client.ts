import { ClientError, GraphQLClient, RequestMiddleware } from "graphql-request";
import { getSdk } from "./generated";
import { useAppStore } from "@/store/app";
import { useRouter } from "vue-router";

export function useClient() {
    const store = useAppStore();

    const requestMiddleware: RequestMiddleware = async (request) => {
        return {
            ...request,
            headers: {
                ...request.headers,
                Authorization: `Bearer ${await store.getAccessToken()}`
            }
        };
    };

    const client = new GraphQLClient("/api/graphql", {
        requestMiddleware
    });

    return getSdk(client, async (action) => {
        try {
            return await action();
        } catch (err) {
            if (
                (err as ClientError).response?.status >= 400 ||
                ((err as ClientError).response?.errors?.[0] as any | undefined)?.extensions?.status >= 400
            ) {
                await store.forceTokenRefresh();
            }
        }
        try {
            return await action();
        } catch (err) {
            store.accessToken = "";
            store.refreshToken = "";
            const router = useRouter();
            router.push({ name: "login" });
            throw err;
        }
    });
}

export type Client = ReturnType<typeof useClient>;
export type ClientReturnType<T extends keyof Client> = Awaited<ReturnType<Client[T]>>;
export type NodeReturnType<T extends keyof Client, N extends string> = ClientReturnType<T> extends { node?: infer X }
    ? X extends { __typename?: N }
        ? X
        : never
    : never;
