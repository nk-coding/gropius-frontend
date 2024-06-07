<template>
    <v-card color="surface-elevated-3" rounded="lger" class="pa-3 create-component-dialog" elevation="0">
        <v-form @submit.prevent="submitChanges">
            <v-card-title class="pl-4">{{ title }}</v-card-title>
            <div class="pa-4">
                <div class="d-flex flex-wrap mx-n2">
                    <v-text-field
                        v-model="name"
                        v-bind="nameProps"
                        label="Name"
                        class="wrap-input mx-2 mb-1 flex-1-1-0"
                    />
                    <v-text-field
                        v-model="color"
                        v-bind="colorProps"
                        label="Color"
                        class="wrap-input mx-2 mb-1 flex-1-1-0"
                    >
                        <template #append-inner v-if="isFieldValid('color')">
                            <v-icon :color="color" icon="mdi-circle" class="opacity-100" />
                        </template>
                        <v-menu activator="parent" :close-on-content-click="false">
                            <v-color-picker class="mt-1" rounded="lger" v-model="pickerColor" :modes="['rgb']" />
                        </v-menu>
                    </v-text-field>
                </div>
                <v-textarea v-model="description" v-bind="descriptionProps" label="Description" class="mb-1" />
            </div>
            <v-card-actions>
                <v-spacer />
                <DefaultButton variant="text" color="" @click="!meta.dirty && $emit('cancel')">
                    Cancel
                    <ConfirmationDialog
                        v-if="meta.dirty"
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
import * as yup from "yup";
import { useForm } from "vee-validate";
import { toTypedSchema } from "@vee-validate/yup";
import { fieldConfig } from "@/util/vuetifyFormConfig";
import ConfirmationDialog from "./ConfirmationDialog.vue";
import { PropType, computed } from "vue";
import { fallbackColor } from "@/util/fallbackColor";
import { watch } from "vue";

export interface Label {
    name: string;
    description: string;
    color: string;
}

const emit = defineEmits<{
    (event: "submit", label: Label): void;
    (event: "cancel"): void;
}>();

const props = defineProps({
    trackable: {
        type: String,
        required: true
    },
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
        type: Object as PropType<Label>,
        required: true
    },
    submitDisabled: {
        type: Boolean,
        required: false,
        default: false
    }
});

watch(
    () => props.initialValue,
    (value) => {
        resetForm({
            values: value
        });
    }
);

const schema = toTypedSchema(
    yup.object().shape({
        name: yup.string().required().label("Name"),
        description: yup.string().notRequired().label("Description"),
        color: yup
            .string()
            .required()
            .label("Color")
            .matches(/^#[0-9a-f]{6}$/i, "Is not a valid hex color code #RRGGBB")
    })
);

const { defineField, handleSubmit, meta, isFieldValid, resetForm } = useForm({
    validationSchema: schema,
    initialValues: props.initialValue
});

const [name, nameProps] = defineField("name", fieldConfig);
const [description, descriptionProps] = defineField("description", fieldConfig);
const [color, colorProps] = defineField("color", fieldConfig);

const pickerColor = computed({
    get() {
        return fallbackColor(color.value);
    },
    set(value: string) {
        color.value = value;
    }
});

const submitChanges = handleSubmit(async (state) => {
    emit("submit", {
        ...state,
        description: state.description ?? ""
    });
});
</script>
<style scoped lang="scss">
@use "@/styles/settings.scss";
.create-label-dialog {
    width: min(1000px, calc(100vw - 3 * settings.$side-bar-width));
}

.wrap-input {
    min-width: 250px;
}
</style>
