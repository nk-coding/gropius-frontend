<template>
    <v-dialog v-model="createInterfaceSpecificationVersionDialog" persistent width="auto">
        <TemplatedNodeDialogContent
            item-name="interfaceSpecification version"
            confirmation-message="Create interface specification version"
            :form-meta="meta"
            :form-validate="validate"
            :submit-disabled="submitDisabled"
            color="surface-elevated-3"
            @cancel="cancelCreateInterfaceSpecificationVersion"
            @confirm="createInterfaceSpecificationVersion"
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

const createInterfaceSpecificationVersionDialog = ref(false);
const client = useClient();
const [blockWithErrorMessage, submitDisabled] = useBlockingWithErrorMessage();

const props = defineProps({
    interfaceSpecification: {
        type: String,
        required: true
    },
    initialVersion: {
        type: String,
        required: false
    }
});

const emit = defineEmits<{
    (event: "created-interfaceSpecification-version", interfaceSpecificationVersion: IdObject): void;
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

watch(
    () => props.initialVersion,
    (newValue) => {
        if (newValue != undefined) {
            version.value = newValue;
        }
    }
);

const [version, versionProps] = defineField("version", fieldConfig);
const [tags, tagsProps] = defineField("tags", fieldConfig);

const templatedFields = ref<Field[]>([]);
const templateValue = computedAsync(
    async () => {
        const templateRes = await withErrorMessage(async () => {
            return client.getInterfaceSpecificationVersionTemplate({
                interfaceSpecification: props.interfaceSpecification
            });
        }, "Error loading template");
        const interfaceSpecificationNode = templateRes.node as NodeReturnType<
            "getInterfaceSpecificationVersionTemplate",
            "InterfaceSpecification"
        >;
        const templateNode = interfaceSpecificationNode.template.interfaceSpecificationVersionTemplate;
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

onEvent("create-interface-specification-version", () => {
    resetForm();
    createInterfaceSpecificationVersionDialog.value = true;
});

const createInterfaceSpecificationVersion = handleSubmit(async (state) => {
    const interfaceSpecificationVersion = await blockWithErrorMessage(async () => {
        const res = await client.createInterfaceSpecificationVersion({
            input: {
                ...state,
                tags: state.tags ?? [],
                templatedFields: templatedFields.value,
                interfaceSpecification: props.interfaceSpecification
            }
        });
        return res.createInterfaceSpecificationVersion.interfaceSpecificationVersion;
    }, "Error creating interfaceSpecification");
    createInterfaceSpecificationVersionDialog.value = false;
    emit("created-interfaceSpecification-version", interfaceSpecificationVersion);
});

function cancelCreateInterfaceSpecificationVersion() {
    createInterfaceSpecificationVersionDialog.value = false;
}
</script>
<style scoped>
.wrap-input {
    min-width: 250px;
}
</style>
