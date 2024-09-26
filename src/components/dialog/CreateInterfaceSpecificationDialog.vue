<template>
    <v-dialog v-model="createInterfaceSpecificationDialog" persistent width="auto">
        <VersionedTemplatedNodeDialogContent
            item-name="interface specification"
            confirmation-message="Create interface specification"
            :form-meta="meta"
            :form-validate="validate"
            :version-form-meta="versionMeta"
            :version-form-validate="versionValidate"
            :submit-disabled="submitDisabled"
            color="surface-elevated-3"
            @cancel="cancelCreateInterfaceSpecification"
            @confirm="createInterfaceSpecification"
        >
            <template #general>
                <div class="d-flex flex-wrap mx-n2">
                    <v-text-field
                        v-model="name"
                        v-bind="nameProps"
                        label="Name"
                        class="wrap-input mx-2 mb-1 flex-1-1-0"
                    />
                    <InterfaceSpecificationTemplateAutocomplete
                        v-model="template"
                        v-bind="templateProps"
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
                    :schema="templateValue.interfaceSpecificationVersionTemplate.templateFieldSpecifications"
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
import InterfaceSpecificationTemplateAutocomplete from "../input/InterfaceSpecificationTemplateAutocomplete.vue";
import TemplatedFieldsInput, { Field } from "../input/schema/TemplatedFieldsInput.vue";
import { computedAsync } from "@vueuse/core";
import { generateDefaultData } from "../input/schema/generateDefaultData";
import { watch } from "vue";
import { IdObject } from "@/util/types";
import VersionedTemplatedNodeDialogContent from "./VersionedTemplatedNodeDialogContent.vue";
import { InterfaceSpecificationVersionInput } from "@/graphql/generated";

const createInterfaceSpecificationDialog = ref(false);
const client = useClient();
const [blockWithErrorMessage, submitDisabled] = useBlockingWithErrorMessage();

const props = defineProps({
    component: {
        type: String,
        required: true
    }
});

const emit = defineEmits<{
    (event: "created-interface-specification", interfaceSpecification: IdObject): void;
}>();

const schema = toTypedSchema(
    yup.object().shape({
        name: yup.string().required().label("Name"),
        template: yup.string().required().label("Template"),
        description: yup.string().notRequired().label("Description")
    })
);

const { defineField, resetForm, handleSubmit, meta, validate } = useForm({
    validationSchema: schema
});

const [name, nameProps] = defineField("name", fieldConfig);
const [template, templateProps] = defineField("template", fieldConfig);
const [description, descriptionProps] = defineField("description", fieldConfig);

const templatedFields = ref<Field[]>([]);
const templateValue = computedAsync(
    async () => {
        if (template.value == null) {
            return null;
        }
        const templateRes = await withErrorMessage(async () => {
            return client.getInterfaceSpecificationTemplate({ id: template.value! });
        }, "Error loading template");
        const templateNode = templateRes.node as NodeReturnType<
            "getInterfaceSpecificationTemplate",
            "InterfaceSpecificationTemplate"
        >;
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
        versionTemplatedFields.value = newValue.interfaceSpecificationVersionTemplate.templateFieldSpecifications.map(
            (spec) => ({
                name: spec.name,
                value: generateDefaultData(spec.value, spec.value)
            })
        );
    }
});

onEvent("create-interface-specification", () => {
    resetForm();
    resetVersionForm();
    createInterfaceSpecificationDialog.value = true;
});

const getInterfaceSpecificationFields = handleSubmit(async (state) => {
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

async function createInterfaceSpecification(hasVersion: boolean) {
    const interfaceSpecification = await blockWithErrorMessage(async () => {
        const interfaceSpecificationFields = await getInterfaceSpecificationFields();
        const versions: InterfaceSpecificationVersionInput[] = [];
        if (hasVersion) {
            const versionFields = await getVersionFields();
            versions.push(versionFields!);
        }
        const res = await client.createInterfaceSpecification({
            input: {
                ...interfaceSpecificationFields!,
                versions: versions,
                component: props.component
            }
        });
        return res.createInterfaceSpecification.interfaceSpecification;
    }, "Error creating interfaceSpecification");
    createInterfaceSpecificationDialog.value = false;
    emit("created-interface-specification", interfaceSpecification);
}

function cancelCreateInterfaceSpecification() {
    createInterfaceSpecificationDialog.value = false;
}
</script>
<style scoped>
.wrap-input {
    min-width: 250px;
}
</style>
