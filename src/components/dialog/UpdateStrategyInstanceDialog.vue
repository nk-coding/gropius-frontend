<template>
    <v-dialog v-model="updateStrategyInstanceDialog" persistent width="auto">
        <StrategyInstanceDialogContent
            v-if="model != undefined"
            title="Update strategy instance"
            discard-title="Discard strategy instance?"
            discard-message="Discard changes?"
            submit-action="Update strategy instance"
            :initial-value="model"
            :submit-disabled="submitDisabled"
            @submit="updateStrategyInstance"
            @cancel="updateStrategyInstanceDialog = false"
        />
    </v-dialog>
</template>
<script lang="ts" setup>
import { computed, PropType, ref } from "vue";
import { useBlockingWithErrorMessage } from "@/util/withErrorMessage";
import StrategyInstanceDialogContent, { StrategyInstance } from "./StrategyInstanceDialogContent.vue";
import { IdObject } from "@/util/types";
import axios from "axios";
import { useAppStore } from "@/store/app";

const updateStrategyInstanceDialog = computed({
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
    (event: "updated-strategy-instance", strategyInstance: IdObject): void;
}>();

const model = defineModel({
    type: Object as PropType<(StrategyInstance & IdObject) | null>,
    required: false
});

async function updateStrategyInstance(state: StrategyInstance, updatedInstanceConfig: boolean) {
    const strategyInstance = await blockWithErrorMessage(async () => {
        const res = await axios.put(
            `/auth/api/login/strategyInstance/${model.value?.id}`,
            {
                ...state,
                instanceConfig: updatedInstanceConfig ? state.instanceConfig : undefined
            },
            {
                headers: {
                    Authorization: `Bearer ${await store.getAccessToken()}`
                }
            }
        );
        return res.data as IdObject;
    }, "Error updating strategy instance");
    updateStrategyInstanceDialog.value = false;
    emit("updated-strategy-instance", strategyInstance);
}
</script>
