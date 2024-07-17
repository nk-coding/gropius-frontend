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
                <div class="d-flex flex-wrap mx-n2">
                    <v-text-field
                        v-model="name"
                        v-bind="nameProps"
                        label="Name"
                        class="wrap-input mx-2 mb-1 flex-1-1-0"
                    />
                    <v-text-field
                        v-model="version"
                        v-bind="versionProps"
                        label="Version"
                        class="wrap-input mx-2 mb-1 flex-1-1-0"
                    />
                </div>
                <v-textarea v-model="description" v-bind="descriptionProps" label="Description" class="mb-1" />
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
        name: yup.string().required().label("Name"),
        version: yup.string().required().label("Version"),
        description: yup.string().notRequired().label("Description")
    })
);

const { defineField, resetForm, handleSubmit, meta, validate } = useForm({
    validationSchema: schema
});

const [name, nameProps] = defineField("name", fieldConfig);
const [version, versionProps] = defineField("version", fieldConfig);
const [description, descriptionProps] = defineField("description", fieldConfig);

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
                description: state.description ?? "",
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