<template>
    <v-dialog v-model="updatePermissionDialog" persistent width="auto">
        <v-card color="surface-elevated-3" rounded="lger" class="pa-3 update-permission-dialog" elevation="0">
            <v-form @submit.prevent="updatePermission">
                <v-card-title class="pl-4">Update permission</v-card-title>
                <div class="pa-4">
                    <v-text-field v-model="name" v-bind="nameProps" label="Name" class="mb-1 flex-1-1-0" />
                    <v-textarea v-model="description" v-bind="descriptionProps" label="Description" class="mb-1" />
                    <PermissionEntryCheckboxGrid v-model="entries" :permission-entries="permissionEntries" />
                </div>
                <v-card-actions>
                    <v-spacer />
                    <DefaultButton variant="text" color="" @click="!meta.dirty && cancelUpdatePermission()">
                        Cancel
                        <ConfirmationDialog
                            v-if="meta.dirty"
                            title="Discard changes?"
                            message="Are you sure you want to discard the changes?"
                            confirm-text="Discard"
                            @confirm="cancelUpdatePermission"
                        />
                    </DefaultButton>
                    <DefaultButton variant="text" color="primary" type="submit" :disabled="submitDisabled"
                        >Update permission</DefaultButton
                    >
                </v-card-actions>
            </v-form>
        </v-card>
    </v-dialog>
</template>
<script lang="ts" setup generic="T extends string">
import { PropType, Ref, ref, watch } from "vue";
import { useBlockingWithErrorMessage, withErrorMessage } from "@/util/withErrorMessage";
import { computed } from "vue";
import { IdObject } from "@/util/types";
import { fieldConfig } from "@/util/vuetifyFormConfig";
import { toTypedSchema } from "@vee-validate/yup";
import { useForm } from "vee-validate";
import * as yup from "yup";
import { UpdatePermissionFunction } from "../PermissionList.vue";
import PermissionEntryCheckboxGrid from "../input/PermissionEntryCheckboxGrid.vue";
import ConfirmationDialog from "./ConfirmationDialog.vue";

export interface Permission {
    name: string;
    description: string;
    entries: string[];
}

const props = defineProps({
    permissionEntries: {
        type: Array as PropType<T[]>,
        required: true
    },
    updatePermission: {
        type: Function as PropType<UpdatePermissionFunction<T>>,
        required: true
    }
});

const emit = defineEmits<{
    (event: "updated-permission", permission: IdObject): void;
}>();

const model = defineModel({
    type: Object as PropType<(Permission & IdObject) | null>,
    required: false
});

const [blockWithErrorMessage, submitDisabled] = useBlockingWithErrorMessage();

const updatePermissionDialog = computed({
    get: () => model.value != null,
    set: (value) => {
        if (!value) {
            model.value = null;
        }
    }
});

watch(model, (value) => {
    if (value != undefined) {
        resetForm({
            values: value
        });
        entries.value = transformEntries(value);
    }
});

const schema = toTypedSchema(
    yup.object().shape({
        name: yup.string().required().label("Name"),
        description: yup.string().notRequired().label("Description")
    })
);

const { defineField, handleSubmit, meta, resetForm } = useForm({
    validationSchema: schema,
    initialValues: model.value
});

const [name, nameProps] = defineField("name", fieldConfig);
const [description, descriptionProps] = defineField("description", fieldConfig);
const entries: Ref<Partial<Record<T, boolean>>> = ref<any>(transformEntries(model.value));

const updatePermission = handleSubmit(async (state) => {
    await blockWithErrorMessage(async () => {
        const addedEntries: T[] = [];
        const removedEntries: T[] = [];
        for (const entry of props.permissionEntries) {
            const hasInitially = model.value?.entries?.includes(entry) == true;
            const hasNow = entries.value[entry] == true;
            if (hasInitially != hasNow) {
                if (hasNow) {
                    addedEntries.push(entry);
                } else {
                    removedEntries.push(entry);
                }
            }
        }
        return props.updatePermission({
            id: model.value!.id,
            name: state.name,
            description: state.description ?? "",
            addedEntries,
            removedEntries
        });
    }, "Error updating permission");
    updatePermissionDialog.value = false;
    emit("updated-permission", model.value!);
});

function cancelUpdatePermission() {
    updatePermissionDialog.value = false;
}

function transformEntries(permission: Permission | undefined | null): Partial<Record<T, boolean>> {
    const result: Partial<Record<T, boolean>> = {};
    for (const entry of props.permissionEntries) {
        result[entry] = permission?.entries?.includes(entry) == true;
    }
    return result;
}
</script>
<style scoped lang="scss">
@use "@/styles/settings.scss";
.update-permission-dialog {
    width: min(1000px, calc(100vw - 3 * settings.$side-bar-width));
}
</style>
