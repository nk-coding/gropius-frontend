<template>
    <v-dialog v-model="createAuthClientDialog" persistent width="auto">
        <AuthClientDialogContent
            title="Create auth client"
            discard-title="Discard auth client?"
            discard-message="Are you sure you want to discard this auth client?"
            submit-action="Create auth client"
            :initial-value="initialValue"
            :submit-disabled="submitDisabled"
            @submit="createAuthClient"
            @cancel="createAuthClientDialog = false"
        />
    </v-dialog>
</template>
<script lang="ts" setup>
import { onEvent } from "@/util/eventBus";
import { ref } from "vue";
import { useBlockingWithErrorMessage } from "@/util/withErrorMessage";
import AuthClientDialogContent, { AuthClientInput, AuthClientOutput } from "./AuthClientDialogContent.vue";
import { IdObject } from "@/util/types";
import axios from "axios";
import { useAppStore } from "@/store/app";

const createAuthClientDialog = ref(false);
const store = useAppStore();
const [blockWithErrorMessage, submitDisabled] = useBlockingWithErrorMessage();

const emit = defineEmits<{
    (event: "created-auth-client", authClient: IdObject): void;
}>();

const initialValue = ref<AuthClientInput>({
    name: "",
    redirectUrls: [],
    isValid: false,
    requiresSecret: false,
    validScopes: []
});

onEvent("create-auth-client", () => {
    createAuthClientDialog.value = true;
});

async function createAuthClient(state: AuthClientOutput) {
    const authClient = await blockWithErrorMessage(async () => {
        const res = await axios.post("/auth/api/login/client", state, {
            headers: {
                Authorization: `Bearer ${await store.getAccessToken()}`
            }
        });
        return res.data as IdObject;
    }, "Error creating auth client");
    createAuthClientDialog.value = false;
    emit("created-auth-client", authClient);
}
</script>
