<template>
    <v-card color="surface-elevated-3" rounded="lger" class="pa-3 update-view-content" elevation="0">
        <v-form @submit.prevent="submitChanges">
            <v-card-title class="pl-4">{{ title }}</v-card-title>
            <div class="pa-4">
                <v-text-field v-model="name" v-bind="nameProps" label="Name" class="mb-1" />
                <v-textarea v-model="description" v-bind="descriptionProps" label="Description" class="mb-1" />
                <ViewTemplateFilter :templates="templates" v-model="filterEntries" />
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
import { PropType, ref } from "vue";
import { watch } from "vue";
import { computed } from "vue";
import ViewTemplateFilter from "../input/ViewTemplateFilter.vue";

export interface View {
    name: string;
    description: string;
    filterByTemplate: string[];
}

const emit = defineEmits<{
    (event: "submit", view: View): void;
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
        type: Object as PropType<View>,
        required: true
    },
    submitDisabled: {
        type: Boolean,
        required: false,
        default: false
    },
    templates: {
        type: Array as PropType<
            {
                name: string;
                id: string;
            }[]
        >,
        required: true
    }
});

watch(
    () => props.initialValue,
    (value) => {
        resetForm({
            values: value
        });
        filterEntries.value = new Set(value.filterByTemplate);
    }
);

const schema = toTypedSchema(
    yup.object().shape({
        name: yup.string().required().label("Name"),
        description: yup.string().notRequired().label("Description")
    })
);

const { defineField, handleSubmit, meta, isFieldValid, resetForm } = useForm({
    validationSchema: schema,
    initialValues: props.initialValue
});

const [name, nameProps] = defineField("name", fieldConfig);
const [description, descriptionProps] = defineField("description", fieldConfig);

const filterEntries = ref<Set<string>>(new Set(props.initialValue.filterByTemplate));

const submitChanges = handleSubmit(async (state) => {
    emit("submit", {
        ...state,
        description: state.description ?? "",
        filterByTemplate: [...filterEntries.value]
    });
});
</script>
<style scoped lang="scss">
@use "@/styles/settings.scss";
.update-view-content {
    width: min(700px, calc(100vw - 3 * settings.$side-bar-width));
}

.wrap-input {
    min-width: 250px;
}

.filter-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(225px, 1fr));
    gap: 0 10px;
}
</style>
