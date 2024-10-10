<template>
    <v-dialog v-model="dialog" persistent width="auto">
        <v-card color="surface-elevated-3" rounded="lger" class="pa-3 create-project-dialog" elevation="0">
            <v-form @submit.prevent="addInterfaceSpecificationVersionToComponentVersion">
                <v-card-title class="pl-4">Add interface specification version</v-card-title>
                <div class="pa-4">
                    <InterfaceSpecificationAutocomplete
                        v-model="interfaceSpecification"
                        v-bind="interfaceSpecificationProps"
                        :component="component"
                        label="Interface Specification"
                        class="mb-1"
                    />
                    <InterfaceSpecificationVersionAutocomplete
                        v-model="interfaceSpecificationVersion"
                        v-bind="interfaceSpecificationVersionProps"
                        :interface-specification="interfaceSpecification"
                        :disabled="!interfaceSpecification"
                        label="Version"
                        class="mb-1"
                    />
                    <div class="d-flex flex-wrap mx-n2">
                        <v-checkbox
                            v-model="visible"
                            v-bind="visibleProps"
                            :disabled="!interfaceSpecificationVisibilityInfo.visible"
                            label="Visible"
                            class="wrap-input mx-2 mb-1 flex-1-1-0"
                        />
                        <v-checkbox
                            v-model="invisible"
                            v-bind="invisibleProps"
                            :disabled="!interfaceSpecificationVisibilityInfo.invisible"
                            label="Invisible"
                            class="wrap-input mx-2 mb-1 flex-1-1-0"
                        />
                    </div>
                </div>
                <v-card-actions>
                    <v-spacer />
                    <DefaultButton variant="text" color="" @click="!isDirty && cancelDialog()">
                        Cancel
                        <ConfirmationDialog
                            v-if="isDirty"
                            title="Discard?"
                            message="Are you sure you want to discard your changes?"
                            confirm-text="Discard"
                            @confirm="cancelDialog"
                        />
                    </DefaultButton>
                    <DefaultButton variant="text" color="primary" type="submit" :disabled="submitDisabled"
                        >Add interface specification version</DefaultButton
                    >
                </v-card-actions>
            </v-form>
        </v-card>
    </v-dialog>
</template>
<script setup lang="ts">
import { ref, watch } from "vue";
import { onEvent } from "@/util/eventBus";
import * as yup from "yup";
import { useForm, useIsFormDirty } from "vee-validate";
import { fieldConfig } from "@/util/vuetifyFormConfig";
import { useBlockingWithErrorMessage, withErrorMessage } from "@/util/withErrorMessage";
import { NodeReturnType, useClient } from "@/graphql/client";
import { toTypedSchema } from "@vee-validate/yup";
import ConfirmationDialog from "./ConfirmationDialog.vue";
import { IdObject } from "@/util/types";
import InterfaceSpecificationVersionAutocomplete from "../input/InterfaceSpecificationVersionAutocomplete.vue";
import InterfaceSpecificationAutocomplete from "../input/InterfaceSpecificationAutocomplete.vue";
import { computedAsync } from "@vueuse/core";

const dialog = ref(false);
const client = useClient();
const [blockWithErrorMessage, submitDisabled] = useBlockingWithErrorMessage();

const emit = defineEmits<{
    (event: "added-interface-specification-version-to-component-version", project: IdObject): void;
}>();

const props = defineProps({
    componentVersion: {
        type: String,
        required: true
    },
    component: {
        type: String,
        required: true
    },
    componentTemplate: {
        type: String,
        required: false
    }
});

const schema = toTypedSchema(
    yup.object().shape({
        interfaceSpecification: yup.string().required().label("Interface Specification"),
        interfaceSpecificationVersion: yup.string().required().label("Interface Specification Version"),
        visible: yup.boolean().required().label("Visible"),
        invisible: yup.boolean().required().label("Invisible")
    })
);

const { defineField, resetForm, handleSubmit, setValues } = useForm({
    validationSchema: schema,
    initialValues: {
        visible: true,
        invisible: false
    }
});
const isDirty = useIsFormDirty();

const [interfaceSpecification, interfaceSpecificationProps] = defineField("interfaceSpecification", fieldConfig);
const [interfaceSpecificationVersion, interfaceSpecificationVersionProps] = defineField(
    "interfaceSpecificationVersion",
    fieldConfig
);
const [visible, visibleProps] = defineField("visible", fieldConfig);
const [invisible, invisibleProps] = defineField("invisible", fieldConfig);

const interfaceSpecificationVisibilityInfo = computedAsync(
    async () => {
        if (props.componentTemplate == undefined || interfaceSpecification.value == null) {
            return {
                visible: true,
                invisible: true
            };
        }
        const visibilityRes = (
            await withErrorMessage(async () => {
                return client.getInterfaceSpecificationVisibilityInfo({
                    id: interfaceSpecification.value!,
                    componentTemplate: props.componentTemplate!
                });
            }, "Error loading interface specification visibility info")
        ).node as NodeReturnType<"getInterfaceSpecificationVisibilityInfo", "InterfaceSpecification">;
        return {
            visible: visibilityRes.template.canBeVisibleOnComponents.totalCount > 0,
            invisible: visibilityRes.template.canBeInvisibleOnComponents.totalCount > 0
        };
    },
    {
        visible: true,
        invisible: true
    },
    { shallow: false }
);

watch(
    () => interfaceSpecification.value,
    () => {
        if (interfaceSpecificationVersion.value != undefined) {
            setValues({
                interfaceSpecificationVersion: undefined
            });
        }
    }
);

watch(
    () => interfaceSpecificationVisibilityInfo.value,
    () => {
        if (!interfaceSpecificationVisibilityInfo.value.visible && visible.value) {
            setValues({
                visible: false
            });
        }
        if (!interfaceSpecificationVisibilityInfo.value.invisible && invisible.value) {
            setValues({
                invisible: false
            });
        }
    }
);

onEvent("add-interface-specification-version-to-component-version", () => {
    resetForm();
    dialog.value = true;
});

const addInterfaceSpecificationVersionToComponentVersion = handleSubmit(async (state) => {
    await blockWithErrorMessage(async () => {
        await client.addInterfaceSpecificationVersionToComponentVersion({
            input: {
                visible: state.visible,
                invisible: state.invisible,
                interfaceSpecificationVersion: state.interfaceSpecificationVersion,
                componentVersion: props.componentVersion
            }
        });
    }, "Error adding interface specification version to component version");
    dialog.value = false;
    emit("added-interface-specification-version-to-component-version", { id: state.interfaceSpecificationVersion });
});

function cancelDialog() {
    dialog.value = false;
}
</script>
<style scoped lang="scss">
@use "@/styles/settings.scss";
.create-project-dialog {
    width: min(700px, calc(100vw - 3 * settings.$side-bar-width));
}

.wrap-input {
    min-width: 250px;
}
</style>
