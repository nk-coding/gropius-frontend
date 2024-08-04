<template>
    <v-dialog v-model="showDialog" width="auto">
        <v-card color="surface-elevated-3" rounded="lger" class="pa-3 pb-5 auth-client-secret-dialog" elevation="0">
            <div class="d-flex align-center">
                <v-card-title class="pl-4">Client secrets</v-card-title>
                <v-spacer />
                <IconButton @click="showDialog = false">
                    <v-icon icon="mdi-close" />
                    <v-tooltip activator="parent">Close</v-tooltip>
                </IconButton>
            </div>
            <div class="ml-4 my-4">
                <CustomList :items="cachedModel" :to="() => undefined">
                    <template #item="{ item }">
                        <ListItem :title="item.secretText ? '' : item.censored" :subtitle="item.fingerprint">
                            <template #append>
                                <IconButton>
                                    <v-icon icon="mdi-delete" />
                                    <ConfirmationDialog
                                        :title="`Delete client secret?`"
                                        :message="`Are you sure you want to delete the client secret? Applications using this client secret may stop working.`"
                                        confirm-text="Delete"
                                        @confirm="deleteClientSecret(item.fingerprint)"
                                    />
                                    <v-tooltip activator="parent" location="bottom">Delete auth client</v-tooltip>
                                </IconButton>
                            </template>
                            <template v-if="item.secretText" #title-append>
                                <CopyText :model-value="item.secretText" class="flex-1-1-0 mr-10 my-1" />
                            </template>
                        </ListItem>
                    </template>
                </CustomList>
            </div>
            <DefaultButton class="mx-4" @click="createClientSecret"> Generate new secret </DefaultButton>
        </v-card>
    </v-dialog>
</template>
<script lang="ts" setup>
import { computed, ref, watch, PropType } from "vue";
import CustomList from "../CustomList.vue";
import ListItem from "../ListItem.vue";
import ConfirmationDialog from "./ConfirmationDialog.vue";
import axios from "axios";
import { useAppStore } from "@/store/app";
import { withErrorMessage } from "@/util/withErrorMessage";
import CopyText from "../CopyText.vue";

export interface AuthClientWithSecrets {
    id: string;
    censoredClientSecrets: Secret[];
}

interface Secret {
    secretText?: string;
    censored: string;
    fingerprint: string;
}

const showDialog = computed({
    get: () => model.value != null,
    set: (value) => {
        if (!value) {
            model.value = undefined;
        }
    }
});

const model = defineModel({
    type: Object as PropType<AuthClientWithSecrets>,
    required: false
});

const store = useAppStore();
const cachedModel = ref<Secret[]>([]);

watch(model, (value) => {
    if (value != undefined) {
        cachedModel.value = [...value.censoredClientSecrets];
    }
});

async function deleteClientSecret(fingerprint: string) {
    withErrorMessage(async () => {
        if (!model.value) {
            return;
        }
        await axios.delete(
            `/auth/api/login/client/${model.value.id}/client-secret/${encodeURIComponent(fingerprint)}`,
            {
                headers: {
                    Authorization: `Bearer ${await store.getAccessToken()}`
                }
            }
        );
        cachedModel.value = cachedModel.value.filter((s) => s.fingerprint != fingerprint);
    }, "Error deleting client secret");
}

async function createClientSecret() {
    withErrorMessage(async () => {
        if (!model.value) {
            return;
        }
        const response = await axios.post(`/auth/api/login/client/${model.value.id}/client-secret`, undefined, {
            headers: {
                Authorization: `Bearer ${await store.getAccessToken()}`
            }
        });
        cachedModel.value.push(response.data);
    }, "Error generating client secret");
}
</script>
<style scoped lang="scss">
@use "@/styles/settings.scss";
.auth-client-secret-dialog {
    width: min(700px, calc(100vw - 3 * settings.$side-bar-width));
}
</style>
