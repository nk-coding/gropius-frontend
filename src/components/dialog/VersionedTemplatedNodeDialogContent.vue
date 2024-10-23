<template>
    <v-card :color="color" rounded="lger" class="pa-3 templated-node-dialog" elevation="0">
        <v-card-title class="pl-4">Create {{ itemName }}</v-card-title>
        <v-stepper
            class="d-flex flex-column"
            v-model="step"
            :items="['General', 'Templated fields', 'Version', 'Version templated fields']"
            hide-actions
            :bg-color="color"
            flat
        >
            <template v-slot:item.1>
                <v-form v-model="form1Valid" validate-on="blur">
                    <slot name="general" />
                </v-form>
            </template>
            <template v-slot:item.2>
                <v-form ref="form2" v-model="form2Valid">
                    <slot name="templatedFields" />
                </v-form>
            </template>
            <template v-slot:item.3>
                <v-form v-model="form3Valid">
                    <v-checkbox v-if="!forceVersion" v-model="enableVersion" label="Create version" />
                    <slot name="version" :disabled="!versionEnabled" />
                </v-form>
            </template>
            <template v-slot:item.4>
                <v-form ref="form4" v-model="form4Valid">
                    <slot name="versionTemplatedFields" />
                </v-form>
            </template>
        </v-stepper>
        <v-card-actions>
            <DefaultButton variant="text" color="" :disabled="step == 1" @click="previous">Previous</DefaultButton>
            <v-spacer />
            <DefaultButton variant="text" color="" @click="!isDirty && $emit('cancel')">
                Cancel
                <ConfirmationDialog
                    v-if="isDirty"
                    :title="`Discard ${itemName}?`"
                    :message="`Are you sure you want to discard this ${itemName}?`"
                    confirm-text="Discard"
                    @confirm="$emit('cancel')"
                />
            </DefaultButton>
            <DefaultButton variant="text" color="primary" @click="next" :disabled="submitDisabled && step == 2">
                {{ (step == 3 && !versionEnabled) || step == 4 ? confirmationMessage : "Next" }}
            </DefaultButton>
        </v-card-actions>
    </v-card>
</template>
<script setup lang="ts">
import { ref } from "vue";
import ConfirmationDialog from "./ConfirmationDialog.vue";
import { computed } from "vue";

const props = defineProps({
    itemName: {
        type: String,
        required: true
    },
    confirmationMessage: {
        type: String,
        required: true
    },
    color: {
        type: String,
        required: true
    },
    formMeta: {
        type: Object,
        required: true
    },
    formValidate: {
        type: Function,
        required: true
    },
    versionFormMeta: {
        type: Object,
        required: true
    },
    versionFormValidate: {
        type: Function,
        required: true
    },
    submitDisabled: {
        type: Boolean,
        required: false,
        default: false
    },
    forceVersion: {
        type: Boolean,
        required: true
    }
});

const emit = defineEmits<{
    (event: "cancel"): void;
    (event: "confirm", hasVersion: boolean): void;
}>();

const step = ref(1);
const form1Valid = ref(false);
const form2Valid = ref(true);
const form3Valid = ref(true);
const form4Valid = ref(true);
const enableVersion = ref(false);
const versionEnabled = computed(() => enableVersion.value || props.forceVersion);

const isDirty = computed(() => {
    return step.value > 1 || props.formMeta.dirty;
});

const form2 = ref<any>(null);
const form4 = ref<any>(null);

function next() {
    if (step.value == 1) {
        if (props.formMeta.valid) {
            step.value = step.value + 1;
        } else {
            props.formValidate();
        }
    } else if (step.value == 2) {
        if (form2Valid.value) {
            step.value = step.value + 1;
        } else {
            form2.value.validate();
        }
    } else if (step.value == 3) {
        if (!versionEnabled.value) {
            emit("confirm", false);
        } else if (props.versionFormMeta.valid) {
            step.value = step.value + 1;
        } else {
            props.versionFormValidate();
        }
    } else {
        if (form4Valid.value) {
            emit("confirm", true);
        } else {
            form4.value.validate();
        }
    }
}

function previous() {
    step.value = step.value - 1;
}
</script>
<style scoped lang="scss">
@use "@/styles/settings.scss";
.templated-node-dialog {
    width: min(1000px, calc(100vw - 3 * settings.$side-bar-width));
}
</style>
