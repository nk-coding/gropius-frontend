<template>
    <v-card color="surface-elevated-3 auth-client-dialog-content" rounded="lger" class="pa-3" elevation="0">
        <v-form @submit.prevent="submitChanges" v-model="isValid">
            <v-card-title class="pl-4">{{ title }}</v-card-title>
            <div class="pa-4">
                <v-text-field
                    v-model="model.name"
                    label="Name"
                    class="mb-1"
                    :rules="[(value) => value.trim().length > 0 || 'Name is required']"
                />
                <v-combobox v-model="model.redirectUrls" label="Redirect URLs" multiple class="mb-1" />
                <GropiusUserModelAutocomplete
                    clearable
                    v-model="userId"
                    label="Client credential flow user"
                    :initial-items="model.clientCredentialFlowUser ? [model.clientCredentialFlowUser] : []"
                />
                <v-checkbox v-model="model.requiresSecret" label="Requires secret" hide-details />
                <v-checkbox v-model="model.isValid" label="Is valid" hide-details />
            </div>
            <v-card-actions>
                <v-spacer />
                <DefaultButton variant="text" color="" @click="!isDirty && $emit('cancel')">
                    Cancel
                    <ConfirmationDialog
                        v-if="isDirty"
                        :title="discardTitle"
                        :message="discardMessage"
                        confirm-text="Discard"
                        @confirm="$emit('cancel')"
                    />
                </DefaultButton>
                <DefaultButton variant="text" color="primary" type="submit" :disabled="submitDisabled">{{
                    submitAction
                }}</DefaultButton>
            </v-card-actions>
        </v-form>
    </v-card>
</template>
<script lang="ts" setup>
import { TokenScope } from "@/util/oauth";
import { computed, PropType, ref } from "vue";
import ConfirmationDialog from "./ConfirmationDialog.vue";
import GropiusUserModelAutocomplete from "../input/GropiusUserModelAutocomplete.vue";
import { DefaultUserInfoFragment } from "@/graphql/generated";

export interface AuthClientInput {
    name?: string;
    redirectUrls: string[];
    isValid: boolean;
    requiresSecret: boolean;
    validScopes: TokenScope[];
    clientCredentialFlowUser?: DefaultUserInfoFragment;
}

export interface AuthClientOutput {
    name?: string;
    redirectUrls: string[];
    isValid: boolean;
    requiresSecret: boolean;
    validScopes: TokenScope[];
    clientCredentialFlowUser: string | null;
}

const emit = defineEmits<{
    (event: "submit", authClient: AuthClientOutput): void;
    (event: "cancel"): void;
}>();

const props = defineProps({
    title: {
        type: String,
        required: true
    },
    discardTitle: {
        type: String,
        required: true
    },
    discardMessage: {
        type: String,
        required: true
    },
    submitAction: {
        type: String,
        required: true
    },
    initialValue: {
        type: Object as PropType<AuthClientInput>,
        required: true
    },
    submitDisabled: {
        type: Boolean,
        required: false,
        default: false
    }
});

const model = ref<AuthClientInput>({ ...props.initialValue });
const isValid = ref(false);
const userId = ref<string | undefined>(props.initialValue.clientCredentialFlowUser?.id);

const isDirty = computed(() => {
    const initial = props.initialValue;
    const current = model.value;
    return (
        initial.name !== current.name ||
        initial.isValid !== current.isValid ||
        initial.requiresSecret !== current.requiresSecret ||
        initial.redirectUrls.join() !== current.redirectUrls.join()
    );
});

function submitChanges() {
    if (isValid.value) {
        emit("submit", {
            name: model.value.name,
            validScopes: [TokenScope.BACKEND],
            isValid: model.value.isValid,
            requiresSecret: model.value.requiresSecret,
            redirectUrls: model.value.redirectUrls,
            clientCredentialFlowUser: userId.value ?? null
        });
    }
}
</script>
<style scoped lang="scss">
@use "@/styles/settings.scss";

.auth-client-dialog-content {
    width: min(600px, calc(100vw - 3 * settings.$side-bar-width));
}
</style>
