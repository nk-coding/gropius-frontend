<template>
    <div class="pa-3">
        <CustomList :items="strategyInstances" :to="() => undefined">
            <template #item="{ item }">
                <ListItem :title="item.name" :subtitle="item.type">
                    <template #append>
                        <div class="ga-2 d-flex mr-5">
                            <v-chip v-if="item.isLoginActive" size="small" class="flex-shrink-0" color="primary"
                                >Login</v-chip
                            >
                            <v-chip v-if="item.isSelfRegisterActive" size="small" class="flex-shrink-0" color="primary"
                                >Self register</v-chip
                            >
                            <v-chip v-if="item.isSyncActive" size="small" class="flex-shrink-0" color="primary"
                                >Sync</v-chip
                            >
                            <v-chip v-if="item.doesImplicitRegister" size="small" class="flex-shrink-0" color="primary"
                                >Implicit register</v-chip
                            >
                        </div>
                        <IconButton
                            v-if="item.callbackUrl != undefined"
                            @click="callbackUrlToShow = item.callbackUrl"
                            class="mr-2"
                        >
                            <v-icon icon="mdi-link-lock" />
                            <v-tooltip activator="parent" location="bottom">Show callback URL</v-tooltip>
                        </IconButton>
                        <IconButton @click="updateStrategyInstance(item.id)" class="mr-2">
                            <v-icon icon="mdi-pencil" />
                            <v-tooltip activator="parent" location="bottom">Edit strategy instance</v-tooltip>
                        </IconButton>
                        <IconButton>
                            <v-icon icon="mdi-delete" />
                            <ConfirmationDialog
                                :title="`Delete strategy instance?`"
                                :message="`Are you sure you want to delete the strategy instance? Users will potentially lose access to their accounts.`"
                                confirm-text="Delete"
                                @confirm="deleteStrategyInstance(item.id)"
                            />
                            <v-tooltip activator="parent" location="bottom">Delete strategy instance</v-tooltip>
                        </IconButton>
                    </template>
                </ListItem>
            </template>
        </CustomList>
        <CreateStrategyInstanceDialog @created-strategy-instance="updateCounter++" />
        <UpdateStrategyInstanceDialog v-model="strategyInstanceToUpdate" @updated-strategy-instance="updateCounter++" />
        <RedirectUrlDialog v-model="callbackUrlToShow" />
    </div>
</template>
<script lang="ts" setup>
import CustomList from "@/components/CustomList.vue";
import ListItem from "@/components/ListItem.vue";
import ConfirmationDialog from "@/components/dialog/ConfirmationDialog.vue";
import CreateStrategyInstanceDialog from "@/components/dialog/CreateStrategyInstanceDialog.vue";
import RedirectUrlDialog from "@/components/dialog/RedirectUrlDialog.vue";
import UpdateStrategyInstanceDialog from "@/components/dialog/UpdateStrategyInstanceDialog.vue";
import { useAppStore } from "@/store/app";
import { withErrorMessage } from "@/util/withErrorMessage";
import { computedAsync } from "@vueuse/core";
import axios from "axios";
import { computed, ref } from "vue";
import { useRoute } from "vue-router";

interface StrategyInstance {
    type: string;
    name: string;
    id: string;
    isLoginActive: boolean;
    isSelfRegisterActive: boolean;
    isSyncActive: boolean;
    doesImplicitRegister: boolean;
    callbackUrl?: string;
}

interface Strategy {
    typeName: string;
    needsRedirectFlow: boolean;
}

const route = useRoute();
const store = useAppStore();

const updateCounter = ref(0);
const strategyInstanceToUpdate = ref<StrategyInstance | undefined>();
const callbackUrlToShow = ref<string>();

const strategyInstances = computedAsync(async () => {
    updateCounter.value;
    const needsRedirectFlow = await withErrorMessage(async () => {
        const res = await axios.get("/auth/api/login/strategy");
        return new Map<string, boolean>(
            res.data.map((strategy: Strategy) => [strategy.typeName, strategy.needsRedirectFlow])
        );
    }, "Error loading strategies");
    return withErrorMessage(async () => {
        const res = await axios.get("/auth/api/login/strategy-instance");
        const instances = res.data as StrategyInstance[];
        return instances.map((instance) => {
            instance.callbackUrl = needsRedirectFlow.get(instance.type) ? instance.callbackUrl : undefined;
            return instance;
        });
    }, "Error loading strategy instances");
}, []);

async function updateStrategyInstance(strategyInstanceId: string) {
    strategyInstanceToUpdate.value = await withErrorMessage(async () => {
        const res = await axios.get(`/auth/api/login/strategy-instance/${strategyInstanceId}`, {
            headers: {
                Authorization: `Bearer ${await store.getAccessToken()}`
            }
        });
        return res.data as StrategyInstance;
    }, "Error loading strategy instance");
}

async function deleteStrategyInstance(strategyInstanceId: string) {
    await withErrorMessage(async () => {
        await axios.delete(`/auth/api/login/strategy-instance/${strategyInstanceId}`, {
            headers: {
                Authorization: `Bearer ${await store.getAccessToken()}`
            }
        });
    }, "Error deleting strategy instance");
    updateCounter.value++;
}
</script>
