<template>
    <div class="pa-3">
        <CustomList :items="authClients" :to="() => undefined">
            <template #item="{ item }">
                <ListItem
                    :title="item.name"
                    :subtitle="item.redirectUrls.join(', ') || 'No redirect URL configured'"
                    :italic-subtitle="item.redirectUrls.length == 0"
                >
                    <template #append>
                        <div class="ga-2 d-flex mr-5">
                            <v-chip v-if="item.requiresSecret" size="small" class="flex-shrink-0" color="primary"
                                >Requires secret</v-chip
                            >
                            <v-chip v-if="!item.isValid" size="small" class="flex-shrink-0" color="error"
                                >Invalid</v-chip
                            >
                        </div>
                        <IconButton @click="authClientIdToShow = item.id" class="mr-2">
                            <v-icon icon="mdi-identifier" />
                            <v-tooltip activator="parent" location="bottom">Copy auth client id</v-tooltip>
                        </IconButton>
                        <IconButton @click="updateAuthClient(item.id)" class="mr-2">
                            <v-icon icon="mdi-pencil" />
                            <v-tooltip activator="parent" location="bottom">Edit auth client</v-tooltip>
                        </IconButton>
                        <IconButton @click="showSecrets(item.id)" class="mr-2">
                            <v-icon icon="mdi-key" />
                            <v-tooltip activator="parent" location="bottom">Update secrets</v-tooltip>
                        </IconButton>
                        <IconButton>
                            <v-icon icon="mdi-delete" />
                            <ConfirmationDialog
                                :title="`Delete auth client?`"
                                :message="`Are you sure you want to delete the auth cliente? Applications using this auth client may stop working.`"
                                confirm-text="Delete"
                                @confirm="deleteAuthClient(item.id)"
                            />
                            <v-tooltip activator="parent" location="bottom">Delete auth client</v-tooltip>
                        </IconButton>
                    </template>
                </ListItem>
            </template>
        </CustomList>
        <CreateAuthClientDialog @created-auth-client="updateCounter++" />
        <UpdateAuthClientDialog v-model="authClientToUpdate" @updated-auth-client="updateCounter++" />
        <AuthClientSecretsDialog v-model="authClientToShowSecrets" />
        <CopyTextDialog v-model="authClientIdToShow" title="Auth client id" />
    </div>
</template>
<script lang="ts" setup>
import CustomList from "@/components/CustomList.vue";
import ListItem from "@/components/ListItem.vue";
import { AuthClientInput } from "@/components/dialog/AuthClientDialogContent.vue";
import AuthClientSecretsDialog, { AuthClientWithSecrets } from "@/components/dialog/AuthClientSecretsDialog.vue";
import ConfirmationDialog from "@/components/dialog/ConfirmationDialog.vue";
import CopyTextDialog from "@/components/dialog/CopyTextDialog.vue";
import CreateAuthClientDialog from "@/components/dialog/CreateAuthClientDialog.vue";
import UpdateAuthClientDialog from "@/components/dialog/UpdateAuthClientDialog.vue";
import { NodeReturnType, useClient } from "@/graphql/client";
import { DefaultUserInfoFragment } from "@/graphql/generated";
import { useAppStore } from "@/store/app";
import { TokenScope } from "@/util/oauth";
import { withErrorMessage } from "@/util/withErrorMessage";
import { computedAsync } from "@vueuse/core";
import axios from "axios";
import { ref } from "vue";

interface AuthClient {
    id: string;
    name?: string;
    redirectUrls: string[];
    isValid: boolean;
    requiresSecret: boolean;
    validScopes: TokenScope[];
    isInternal: boolean;
    clientCredentialFlowUser?: string;
}

const store = useAppStore();
const client = useClient();

const updateCounter = ref(0);
const authClientToUpdate = ref<AuthClientInput | undefined>();
const authClientToShowSecrets = ref<AuthClientWithSecrets>();
const authClientIdToShow = ref<string>();

const authClients = computedAsync(async () => {
    updateCounter.value;
    return withErrorMessage(async () => {
        const res = await axios.get("/auth/api/login/client", {
            headers: {
                Authorization: `Bearer ${await store.getAccessToken()}`
            }
        });
        return (res.data as AuthClient[]).filter((client) => !client.isInternal);
    }, "Error loading auth clients");
}, []);

async function updateAuthClient(authClientId: string) {
    authClientToUpdate.value = await withErrorMessage(async () => {
        const res = await axios.get(`/auth/api/login/client/${authClientId}`, {
            headers: {
                Authorization: `Bearer ${await store.getAccessToken()}`
            }
        });
        const authClient = res.data as AuthClient;
        let user: DefaultUserInfoFragment | undefined = undefined;
        if (authClient.clientCredentialFlowUser != undefined) {
            user = (await client.getUser({ id: authClient.clientCredentialFlowUser })).node as NodeReturnType<
                "getUser",
                "GropiusUser"
            >;
        }
        return {
            ...authClient,
            clientCredentialFlowUser: user
        };
    }, "Error loading auth client");
}

async function showSecrets(authClientId: string) {
    authClientToShowSecrets.value = await withErrorMessage(async () => {
        const res = await axios.get(`/auth/api/login/client/${authClientId}`, {
            headers: {
                Authorization: `Bearer ${await store.getAccessToken()}`
            }
        });
        return res.data as AuthClientWithSecrets;
    }, "Error loading auth client secrets");
}

async function deleteAuthClient(authClientId: string) {
    await withErrorMessage(async () => {
        await axios.delete(`/auth/api/login/client/${authClientId}`, {
            headers: {
                Authorization: `Bearer ${await store.getAccessToken()}`
            }
        });
    }, "Error deleting auth client");
    updateCounter.value++;
}
</script>
