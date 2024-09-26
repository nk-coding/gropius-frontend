<template>
    <v-dialog v-model="createComponentVersionDialog" persistent width="auto">
        <TemplatedNodeDialogContent
            item-name="component version"
            confirmation-message="Create component version"
            :form-meta="meta"
            :form-validate="validate"
            :submit-disabled="submitDisabled"
            color="surface-elevated-3"
            @cancel="cancelCreateComponentVersion"
            @confirm="createComponentVersion"
        >
            <template #general>
                <v-text-field v-model="version" v-bind="versionProps" label="Version" class="mb-1" />
                <v-combobox
                    v-model="tags"
                    v-bind="tagsProps"
                    label="Tags"
                    class="mb-1"
                    multiple
                    chips
                    closable-chips
                    clearable
                />
            </template>
            <template #templatedFields>
                <TemplatedFieldsInput
                    v-if="templateValue != undefined"
                    :schema="templateValue.templateFieldSpecifications"
                    :model-value="templatedFields"
                />
            </template>
        </TemplatedNodeDialogContent>
    </v-dialog>
</template>
<script setup lang="ts">
import { ref, watch } from "vue";
import { onEvent } from "@/util/eventBus";
import * as yup from "yup";
import { useForm } from "vee-validate";
import { fieldConfig } from "@/util/vuetifyFormConfig";
import { useBlockingWithErrorMessage, withErrorMessage } from "@/util/withErrorMessage";
import { NodeReturnType, useClient } from "@/graphql/client";
import { toTypedSchema } from "@vee-validate/yup";
import TemplatedNodeDialogContent from "./TemplatedNodeDialogContent.vue";
import TemplatedFieldsInput, { Field } from "../input/schema/TemplatedFieldsInput.vue";
import { computedAsync } from "@vueuse/core";
import { generateDefaultData } from "../input/schema/generateDefaultData";
import { IdObject } from "@/util/types";

const createComponentVersionDialog = ref(false);
const client = useClient();
const [blockWithErrorMessage, submitDisabled] = useBlockingWithErrorMessage();

const props = defineProps({
    component: {
        type: String,
        required: true
    }
});

const emit = defineEmits<{
    (event: "created-component-version", componentVersion: IdObject): void;
}>();

const schema = toTypedSchema(
    yup.object().shape({
        version: yup.string().required().label("Version"),
        tags: yup.array().of(yup.string().required()).label("Tags")
    })
);

const { defineField, resetForm, handleSubmit, meta, validate } = useForm({
    validationSchema: schema
});

const [version, versionProps] = defineField("version", fieldConfig);
const [tags, tagsProps] = defineField("tags", fieldConfig);

const templatedFields = ref<Field[]>([]);
const templateValue = computedAsync(
    async () => {
        const templateRes = await withErrorMessage(async () => {
            return client.getComponentVersionTemplate({ component: props.component });
        }, "Error loading template");
        const componentNode = templateRes.node as NodeReturnType<"getComponentVersionTemplate", "Component">;
        const templateNode = componentNode.template.componentVersionTemplate;
        return templateNode;
    },
    null,
    { shallow: false }
);
watch(templateValue, (newValue, oldValue) => {
    if (newValue != null && newValue.id != oldValue?.id) {
        templatedFields.value = newValue.templateFieldSpecifications.map((spec) => ({
            name: spec.name,
            value: generateDefaultData(spec.value, spec.value)
        }));
    }
});

onEvent("create-component-version", () => {
    resetForm();
    createComponentVersionDialog.value = true;
});

const createComponentVersion = handleSubmit(async (state) => {
    const componentVersion = await blockWithErrorMessage(async () => {
        const res = await client.createComponentVersion({
            input: {
                ...state,
                tags: state.tags ?? [],
                templatedFields: templatedFields.value,
                component: props.component
            }
        });
        return res.createComponentVersion.componentVersion;
    }, "Error creating component");
    createComponentVersionDialog.value = false;
    emit("created-component-version", componentVersion);
});

function cancelCreateComponentVersion() {
    createComponentVersionDialog.value = false;
}
</script>
<style scoped>
.wrap-input {
    min-width: 250px;
}
</style>
