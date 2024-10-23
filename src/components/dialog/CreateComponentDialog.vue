<template>
    <v-dialog v-model="createComponentDialog" persistent width="auto">
        <VersionedTemplatedNodeDialogContent
            item-name="component"
            confirmation-message="Create component"
            :form-meta="meta"
            :form-validate="validate"
            :version-form-meta="versionMeta"
            :version-form-validate="versionValidate"
            :submit-disabled="submitDisabled"
            :force-version="forceCreateVersion"
            color="surface-elevated-3"
            @cancel="cancelCreateComponent"
            @confirm="createComponent"
        >
            <template #general>
                <div class="d-flex flex-wrap mx-n2">
                    <v-text-field
                        v-model="name"
                        v-bind="nameProps"
                        label="Name"
                        class="wrap-input mx-2 mb-1 flex-1-1-0"
                    />
                    <ComponentTemplateAutocomplete
                        v-model="template"
                        v-bind="templateProps"
                        class="wrap-input mx-2 mb-1 flex-1-1-0"
                    />
                </div>
                <v-textarea v-model="description" v-bind="descriptionProps" label="Description" class="mb-1" />
                <v-text-field v-model="repositoryURL" v-bind="repositoryURLProps" label="Repository URL" class="mb-1" />
            </template>
            <template #templatedFields>
                <TemplatedFieldsInput
                    v-if="templateValue != undefined"
                    :schema="templateValue.templateFieldSpecifications"
                    :model-value="templatedFields"
                />
            </template>
            <template #version="{ disabled }">
                <v-text-field
                    v-model="version"
                    v-bind="versionProps"
                    :disabled="disabled"
                    label="Version"
                    class="mb-1"
                />
                <v-combobox
                    v-model="tags"
                    v-bind="tagsProps"
                    :disabled="disabled"
                    label="Tags"
                    class="mb-1"
                    multiple
                    chips
                    closable-chips
                    clearable
                />
            </template>
            <template #versionTemplatedFields>
                <TemplatedFieldsInput
                    v-if="templateValue != undefined"
                    :schema="templateValue.componentVersionTemplate.templateFieldSpecifications"
                    :model-value="versionTemplatedFields"
                />
            </template>
        </VersionedTemplatedNodeDialogContent>
    </v-dialog>
</template>
<script setup lang="ts">
import { ref } from "vue";
import { onEvent } from "@/util/eventBus";
import * as yup from "yup";
import { useForm } from "vee-validate";
import { fieldConfig } from "@/util/vuetifyFormConfig";
import { useBlockingWithErrorMessage, withErrorMessage } from "@/util/withErrorMessage";
import { NodeReturnType, useClient } from "@/graphql/client";
import { toTypedSchema } from "@vee-validate/yup";
import ComponentTemplateAutocomplete from "../input/ComponentTemplateAutocomplete.vue";
import TemplatedFieldsInput, { Field } from "../input/schema/TemplatedFieldsInput.vue";
import { computedAsync } from "@vueuse/core";
import { generateDefaultData } from "../input/schema/generateDefaultData";
import { watch } from "vue";
import { IdObject } from "@/util/types";
import VersionedTemplatedNodeDialogContent from "./VersionedTemplatedNodeDialogContent.vue";
import { ComponentVersionInput } from "@/graphql/generated";

const props = defineProps({
    initialName: {
        type: String,
        required: false
    },
    forceCreateVersion: {
        type: Boolean,
        required: false,
        default: false
    }
});

const createComponentDialog = ref(false);
const client = useClient();
const [blockWithErrorMessage, submitDisabled] = useBlockingWithErrorMessage();

const emit = defineEmits<{
    (event: "created-component", component: IdObject, componentVersion: IdObject | undefined): void;
}>();

const schema = toTypedSchema(
    yup.object().shape({
        name: yup.string().required().label("Name"),
        template: yup.string().required().label("Template"),
        description: yup.string().notRequired().label("Description"),
        repositoryURL: yup.string().notRequired().label("Repository URL")
    })
);

const { defineField, resetForm, handleSubmit, meta, validate } = useForm({
    validationSchema: schema
});

watch(
    () => props.initialName,
    (newValue) => {
        if (newValue != undefined) {
            name.value = newValue;
        }
    }
);

const [name, nameProps] = defineField("name", fieldConfig);
const [template, templateProps] = defineField("template", fieldConfig);
const [description, descriptionProps] = defineField("description", fieldConfig);
const [repositoryURL, repositoryURLProps] = defineField("repositoryURL", fieldConfig);

const templatedFields = ref<Field[]>([]);
const templateValue = computedAsync(
    async () => {
        if (template.value == null) {
            return null;
        }
        const templateRes = await withErrorMessage(async () => {
            return client.getComponentTemplate({ id: template.value! });
        }, "Error loading template");
        const templateNode = templateRes.node as NodeReturnType<"getComponentTemplate", "ComponentTemplate">;
        return templateNode;
    },
    null,
    { shallow: false }
);

const versionSchema = toTypedSchema(
    yup.object().shape({
        version: yup.string().required().label("Version"),
        tags: yup.array(yup.string().required()).notRequired().label("Tags")
    })
);

const {
    defineField: defineVersionField,
    resetForm: resetVersionForm,
    handleSubmit: handleVersionSubmit,
    meta: versionMeta,
    validate: versionValidate
} = useForm({
    validationSchema: versionSchema
});

const [version, versionProps] = defineVersionField("version", fieldConfig);
const [tags, tagsProps] = defineVersionField("tags", fieldConfig);

const versionTemplatedFields = ref<Field[]>([]);

watch(templateValue, (newValue, oldValue) => {
    if (newValue != null && newValue.id != oldValue?.id) {
        templatedFields.value = newValue.templateFieldSpecifications.map((spec) => ({
            name: spec.name,
            value: generateDefaultData(spec.value, spec.value)
        }));
        versionTemplatedFields.value = newValue.componentVersionTemplate.templateFieldSpecifications.map((spec) => ({
            name: spec.name,
            value: generateDefaultData(spec.value, spec.value)
        }));
    }
});

onEvent("create-component", () => {
    resetForm();
    resetVersionForm();
    createComponentDialog.value = true;
});

const getComponentFields = handleSubmit(async (state) => {
    return {
        ...state,
        description: state.description ?? "",
        templatedFields: templatedFields.value
    } as const;
});

const getVersionFields = handleVersionSubmit(async (state) => {
    return {
        ...state,
        tags: state.tags ?? [],
        templatedFields: templatedFields.value
    };
});

async function createComponent(hasVersion: boolean) {
    const componentAndVersion = await blockWithErrorMessage(async () => {
        const componentFields = await getComponentFields();
        const versions: ComponentVersionInput[] = [];
        if (hasVersion) {
            const versionFields = await getVersionFields();
            versions.push(versionFields!);
        }
        const res = await client.createComponent({
            input: {
                ...componentFields!,
                versions: versions
            }
        });
        return [res.createComponent.component, res.createComponent.component.versions.nodes[0]] as const;
    }, "Error creating component");
    createComponentDialog.value = false;
    emit("created-component", ...componentAndVersion);
}

function cancelCreateComponent() {
    createComponentDialog.value = false;
}
</script>
<style scoped>
.wrap-input {
    min-width: 250px;
}
</style>
