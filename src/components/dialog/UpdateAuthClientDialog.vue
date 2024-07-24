<template>
    <v-dialog v-model="updateAuthClientDialog" persistent width="auto">
        <AuthClientDialogContent
            v-if="cachedModel != undefined"
            title="Update auth client"
            discard-title="Discard auth client?"
            discard-message="Discard changes?"
            submit-action="Update auth client"
            :initial-value="cachedModel"
            :submit-disabled="submitDisabled"
            @submit="updateAuthClient"
            @cancel="updateAuthClientDialog = false"
        />
    </v-dialog>
</template>
<script lang="ts" setup>
import { computed, PropType, ref } from "vue";
import { useBlockingWithErrorMessage } from "@/util/withErrorMessage";
import AuthClientDialogContent, { AuthClientInput, AuthClientOutput } from "./AuthClientDialogContent.vue";
import { IdObject } from "@/util/types";
import axios from "axios";
import { useAppStore } from "@/store/app";
import { useCachedRef } from "@/util/useCachedRef";

const updateAuthClientDialog = computed({
    get: () => model.value != null,
    set: (value) => {
        if (!value) {
            model.value = null;
        }
    }
});
const store = useAppStore();
const [blockWithErrorMessage, submitDisabled] = useBlockingWithErrorMessage();

const emit = defineEmits<{
    (event: "updated-auth-client", authClient: IdObject): void;
}>();

const model = defineModel({
    type: Object as PropType<(AuthClientInput & IdObject) | null>,
    required: false
});

const cachedModel = useCachedRef(model);

async function updateAuthClient(state: AuthClientOutput) {
    const authClient = await blockWithErrorMessage(async () => {
        const res = await axios.put(`/auth/api/login/client/${model.value?.id}`, state, {
            headers: {
                Authorization: `Bearer ${await store.getAccessToken()}`
            }
        });
        return res.data as IdObject;
    }, "Error updating auth client");
    updateAuthClientDialog.value = false;
    emit("updated-auth-client", authClient);
}
</script>
