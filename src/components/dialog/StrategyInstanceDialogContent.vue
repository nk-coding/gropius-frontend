<template>
    <v-card color="surface-elevated-3" rounded="lger" class="pa-3 strategy-instance-dialog-content" elevation="0">
        <v-form @submit.prevent="submitChanges" v-model="isValid">
            <v-card-title class="pl-4">{{ title }}</v-card-title>
            <div class="pa-4">
                <div class="d-flex flex-wrap mx-n2">
                    <v-select
                        v-model="model.type"
                        :items="strategies"
                        item-title="typeName"
                        label="Type"
                        :readonly="!canChangeType"
                        :rules="[requiredRule]"
                        class="wrap-input mx-2 mb-1 flex-1-1-0"
                    />
                    <v-text-field
                        v-model="model.name"
                        label="Name"
                        :rules="[(value) => value.trim().length > 0 || 'Name is required']"
                        class="wrap-input mx-2 mb-1 flex-1-1-0"
                    />
                </div>
            </div>
            <template v-if="strategy">
                <div class="px-4">
                    <MetaForm
                        v-for="key in Object.keys(strategy.instanceConfigSchema)"
                        :key="key"
                        :schema="strategy.instanceConfigSchema[key]"
                        :root-schema="strategy.instanceConfigSchema[key]"
                        :name="key"
                        v-model="model.instanceConfig[key]"
                        @update:model-value="updatedInstanceConfig = true"
                    />
                </div>
                <div class="d-grid checkbox-grid px-4">
                    <v-checkbox
                        v-if="strategy.canLoginRegister"
                        v-model="model.isLoginActive"
                        label="Is login active"
                        hide-details
                    />
                    <v-checkbox
                        v-if="strategy.canLoginRegister"
                        v-model="model.isSelfRegisterActive"
                        label="Is self register active"
                        hide-details
                    />
                    <v-checkbox
                        v-if="strategy.canSync"
                        v-model="model.isSyncActive"
                        label="Is sync active"
                        hide-details
                    />
                    <v-checkbox
                        v-if="strategy.allowsImplicitSignup"
                        v-model="model.doesImplicitRegister"
                        label="Does implicit register"
                        hide-details
                    />
                </div>
            </template>
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
import { computedAsync } from "@vueuse/core";
import ConfirmationDialog from "./ConfirmationDialog.vue";
import { PropType, computed, ref, watch } from "vue";
import { Schema } from "jtd";
import axios from "axios";
import { withErrorMessage } from "@/util/withErrorMessage";
import MetaForm from "../input/schema/MetaForm.vue";
import { generateDefaultData } from "../input/schema/generateDefaultData";
import { requiredRule } from "../input/schema/rules";

export interface StrategyInstance {
    type?: string;
    name: string;
    instanceConfig: Record<string, any>;
    isLoginActive: boolean;
    isSelfRegisterActive: boolean;
    isSyncActive: boolean;
    doesImplicitRegister: boolean;
}

interface Strategy {
    typeName: string;
    canLoginRegister: boolean;
    canSync: boolean;
    allowsImplicitSignup: boolean;
    instanceConfigSchema: Record<string, Schema>;
}

const emit = defineEmits<{
    (event: "submit", strategyInstance: StrategyInstance, updatedInstanceConfig: boolean): void;
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
        type: Object as PropType<StrategyInstance>,
        required: true
    },
    submitDisabled: {
        type: Boolean,
        required: false,
        default: false
    }
});

const model = ref<StrategyInstance>({ ...props.initialValue });
const isValid = ref(false);
const updatedInstanceConfig = ref(false);

const canChangeType = computed(() => !props.initialValue.type);
const isDirty = computed(() => {
    const modelValue = model.value;
    const initialValue = props.initialValue;
    const keysToCompare: (keyof StrategyInstance)[] = [
        "name",
        "isLoginActive",
        "isSelfRegisterActive",
        "isSyncActive",
        "doesImplicitRegister"
    ];
    return updatedInstanceConfig.value || keysToCompare.some((key) => modelValue[key] !== initialValue[key]);
});

const strategies = computedAsync(async () => {
    return withErrorMessage(async () => {
        const res = await axios.get("/auth/api/login/strategy");
        return res.data as Strategy[];
    }, "Error loading strategies");
}, []);

const strategy = computed(() => {
    return strategies.value.find((strategy) => strategy.typeName === model.value.type);
});

watch(strategy, (value) => {
    if (canChangeType.value) {
        model.value.instanceConfig = {};
        if (value != undefined) {
            for (const key of Object.keys(value.instanceConfigSchema)) {
                model.value.instanceConfig[key] = generateDefaultData(
                    value.instanceConfigSchema[key],
                    value.instanceConfigSchema[key]
                );
            }
        }
    }
});

function submitChanges() {
    const currentStrategy = strategy.value;
    if (isValid.value && currentStrategy != undefined) {
        emit(
            "submit",
            {
                type: model.value.type,
                name: model.value.name,
                instanceConfig: model.value.instanceConfig,
                isLoginActive: model.value.isLoginActive && currentStrategy.canLoginRegister,
                isSelfRegisterActive: model.value.isSelfRegisterActive && currentStrategy.canLoginRegister,
                isSyncActive: model.value.isSyncActive && currentStrategy.canSync,
                doesImplicitRegister: model.value.doesImplicitRegister && currentStrategy.allowsImplicitSignup
            },
            updatedInstanceConfig.value
        );
    }
}
</script>
<style scoped lang="scss">
@use "@/styles/settings.scss";

.wrap-input {
    min-width: 250px;
}

.checkbox-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(225px, 1fr));
    gap: 0 10px;
}

.strategy-instance-dialog-content {
    width: min(600px, calc(100vw - 3 * settings.$side-bar-width));
}
</style>
