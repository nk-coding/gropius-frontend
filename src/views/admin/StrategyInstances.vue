<template>
    <div class="pa-3">
        <CustomList :items="strategyInstances" :to="() => undefined">
            <template #item="{ item }">
                <ListItem :title="item.name" :subtitle="item.type">
                    <template #append>
                        <IconButton @click="updateStrategyInstance(item.id)" class="mr-2">
                            <v-icon icon="mdi-pencil" />
                            <v-tooltip activator="parent" location="bottom">Edit strategy instance</v-tooltip>
                        </IconButton>
                        <IconButton>
                            <v-icon icon="mdi-delete" />
                            <ConfirmationDialog
                                :title="`Delete strategyinstance?`"
                                :message="`Are you sure you want to delete the strategy instance? Users will potentially lose access to their accounts.`"
                                confirm-text="Remove"
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
    </div>
</template>
<script lang="ts" setup>
import CustomList from "@/components/CustomList.vue";
import ListItem from "@/components/ListItem.vue";
import ConfirmationDialog from "@/components/dialog/ConfirmationDialog.vue";
import CreateStrategyInstanceDialog from "@/components/dialog/CreateStrategyInstanceDialog.vue";
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
}

const route = useRoute();
const store = useAppStore();

const updateCounter = ref(0);
const strategyInstanceToUpdate = ref<StrategyInstance | undefined>();

const nodeName = computed(() => {
    if (route.name?.toString().startsWith("component")) {
        return "component";
    } else {
        return "project";
    }
});

const strategyInstances = computedAsync(async () => {
    updateCounter.value;
    return withErrorMessage(async () => {
        const res = await axios.get("/auth/api/login/strategyInstance");
        return res.data as StrategyInstance[];
    }, "Error loading strategy instances");
}, []);

async function updateStrategyInstance(strategyInstanceId: string) {
    strategyInstanceToUpdate.value = await withErrorMessage(async () => {
        const res = await axios.get(`/auth/api/login/strategyInstance/${strategyInstanceId}`, {
            headers: {
                Authorization: `Bearer ${await store.getAccessToken()}`
            }
        });
        return res.data as StrategyInstance;
    }, "Error loading strategy instance");
}

async function deleteStrategyInstance(strategyInstanceId: string) {
    await withErrorMessage(async () => {}, "Error deleting strategy instance");
    updateCounter.value++;
}
</script>
