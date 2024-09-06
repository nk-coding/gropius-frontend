<template>
    <v-card color="surface-elevated-3" rounded="lger" class="pa-3 update-view-content" elevation="0">
        <v-form @submit.prevent="submitChanges">
            <v-card-title class="pl-4">{{ title }}</v-card-title>
            <div class="pa-4">
                <v-text-field v-model="name" v-bind="nameProps" label="Name" class="mb-1" />
                <v-textarea v-model="description" v-bind="descriptionProps" label="Description" class="mb-1" />
                <v-btn-toggle class="segmented-button" mandatory v-model="filterEnabled">
                    <v-btn :prepend-icon="filterEnabled == 0 ? 'mdi-check' : 'mdi-filter-off'"> All components </v-btn>
                    <v-btn :prepend-icon="filterEnabled == 1 ? 'mdi-check' : 'mdi-filter'">
                        Filter by component template
                    </v-btn>
                </v-btn-toggle>
                <div v-if="filterEnabled == 1" class="d-grid filter-container mt-4">
                    <v-checkbox
                        v-for="entry in templates"
                        v-model="filterEntries[entry.id]"
                        :key="entry.id"
                        :label="entry.name"
                        hide-details
                    />
                </div>
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

const filterEnabled = computed({
    get: () => (Object.values(filterEntries.value).some((value) => value) ? 1 : 0),
    set: (value) => {
        console.log(value);
        for (const key in filterEntries.value) {
            filterEntries.value[key] = value == 1;
        }
    }
});

const filterEntries = ref(
    Object.fromEntries(
        props.templates.map((entry) => [entry.id, props.initialValue.filterByTemplate.includes(entry.id)])
    )
);

watch(
    () => props.initialValue,
    (value) => {
        resetForm({
            values: value
        });
        filterEntries.value = Object.fromEntries(
            props.templates.map((entry) => [entry.id, value.filterByTemplate.includes(entry.id)])
        );
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

const submitChanges = handleSubmit(async (state) => {
    emit("submit", {
        ...state,
        description: state.description ?? "",
        filterByTemplate: Object.entries(filterEntries.value)
            .filter(([, value]) => value)
            .map(([key]) => key)
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
