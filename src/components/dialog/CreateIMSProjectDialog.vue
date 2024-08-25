<template>
    <v-dialog v-model="createIMSProjectDialog" persistent width="auto">
        <TemplatedNodeDialogContent
            item-name="IMS project"
            confirmation-message="Create IMS project"
            :form-meta="meta"
            :form-validate="validate"
            :submit-disabled="submitDisabled"
            color="surface-elevated-3"
            @cancel="cancelCreateIMS"
            @confirm="createIMSProject"
        >
            <template #general>
                <div class="d-flex flex-wrap mx-n2">
                    <v-text-field
                        v-model="name"
                        v-bind="nameProps"
                        label="Name"
                        class="wrap-input mx-2 mb-1 flex-1-1-0"
                    />
                    <IMSAutocomplete
                        v-if="props.ims == undefined"
                        v-model="ims"
                        v-bind="imsProps"
                        class="wrap-input mx-2 mb-1 flex-1-1-0"
                    />
                    <TrackableAutocomplete
                        v-if="props.trackable == undefined"
                        v-model="trackable"
                        mode="model"
                        v-bind="trackableProps"
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
import { ref } from "vue";
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
import { watch } from "vue";
import { IdObject } from "@/util/types";
import TrackableAutocomplete from "../input/TrackableAutocomplete.vue";
import IMSAutocomplete from "../input/IMSAutocomplete.vue";

const createIMSProjectDialog = ref(false);
const client = useClient();
const [blockWithErrorMessage, submitDisabled] = useBlockingWithErrorMessage();

const props = defineProps({
    ims: {
        type: String,
        required: false
    },
    trackable: {
        type: String,
        required: false
    }
});

const emit = defineEmits<{
    (event: "created-ims-project", ims: IdObject & { ims: IdObject }): void;
}>();

const schema = toTypedSchema(
    yup.object().shape({
        name: yup.string().required().label("Name"),
        ims: yup.string().required().label("IMS"),
        trackable: yup.string().required().label("Trackable"),
        description: yup.string().notRequired().label("Description")
    })
);

const { defineField, resetForm, handleSubmit, meta, validate } = useForm({
    validationSchema: schema,
    initialValues: {
        ims: props.ims,
        trackable: props.trackable
    }
});

const [name, nameProps] = defineField("name", fieldConfig);
const [ims, imsProps] = defineField("ims", fieldConfig);
const [trackable, trackableProps] = defineField("trackable", fieldConfig);
const [description, descriptionProps] = defineField("description", fieldConfig);

const templatedFields = ref<Field[]>([]);
const templateValue = computedAsync(
    async () => {
        const id = props.ims ?? ims.value;
        if (id == null) {
            return null;
        }
        const templateRes = await withErrorMessage(async () => {
            return client.getIMSProjectTemplate({ id });
        }, "Error loading IMS");
        const imsNode = templateRes.node as NodeReturnType<"getIMSProjectTemplate", "IMS">;
        return imsNode.template.imsProjectTemplate;
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

onEvent("create-ims-project", () => {
    resetForm();
    createIMSProjectDialog.value = true;
});

const createIMSProject = handleSubmit(async (state) => {
    const ims = await blockWithErrorMessage(async () => {
        const res = await client.createIMSProject({
            input: {
                ...state,
                description: state.description ?? "",
                templatedFields: templatedFields.value
            }
        });
        return res.createIMSProject.imsProject;
    }, "Error creating IMS project");
    createIMSProjectDialog.value = false;
    emit("created-ims-project", { id: ims.id, ims: { id: state.ims } });
});

function cancelCreateIMS() {
    createIMSProjectDialog.value = false;
}
</script>
<style scoped>
.wrap-input {
    min-width: 250px;
}
</style>
