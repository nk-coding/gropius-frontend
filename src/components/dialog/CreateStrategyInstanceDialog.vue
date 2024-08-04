<template>
    <v-dialog v-model="createStrategyInstanceDialog" persistent width="auto">
        <StrategyInstanceDialogContent
            title="Create strategy instance"
            discard-title="Discard strategy instance?"
            discard-message="Are you sure you want to discard this strategy instance?"
            submit-action="Create strategy instance"
            :initial-value="initialValue"
            :submit-disabled="submitDisabled"
            @submit="createStrategyInstance"
            @cancel="createStrategyInstanceDialog = false"
        />
    </v-dialog>
</template>
<script lang="ts" setup>
import { onEvent } from "@/util/eventBus";
import { ref } from "vue";
import { useBlockingWithErrorMessage } from "@/util/withErrorMessage";
import StrategyInstanceDialogContent, { StrategyInstance } from "./StrategyInstanceDialogContent.vue";
import { IdObject } from "@/util/types";
import axios from "axios";
import { useAppStore } from "@/store/app";

const createStrategyInstanceDialog = ref(false);
const store = useAppStore();
const [blockWithErrorMessage, submitDisabled] = useBlockingWithErrorMessage();

const emit = defineEmits<{
    (event: "created-strategy-instance", strategyInstance: IdObject): void;
}>();

const initialValue = ref<StrategyInstance>({
    name: "",
    type: undefined,
    instanceConfig: {},
    isLoginActive: true,
    isSelfRegisterActive: true,
    isSyncActive: true,
    doesImplicitRegister: false
});

onEvent("create-strategy-instance", () => {
    createStrategyInstanceDialog.value = true;
});

async function createStrategyInstance(state: StrategyInstance) {
    const strategyInstance = await blockWithErrorMessage(async () => {
        const res = await axios.post("/auth/api/login/strategy-instance", state, {
            headers: {
                Authorization: `Bearer ${await store.getAccessToken()}`
            }
        });
        return res.data as IdObject;
    }, "Error creating strategy instance");
    createStrategyInstanceDialog.value = false;
    emit("created-strategy-instance", strategyInstance);
}
</script>
