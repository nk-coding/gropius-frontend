<template>
    <v-dialog v-model="createPermissionDialog" persistent width="auto">
        <v-card color="surface-elevated-3" rounded="lger" class="pa-3 permission-dialog" elevation="0">
            <v-card-title class="pl-4">Create permission</v-card-title>
            <v-stepper
                class="d-flex flex-column"
                v-model="step"
                :items="['General', 'Users']"
                hide-actions
                bg-color="surface-elevated-3"
                flat
            >
                <template v-slot:item.1>
                    <v-form validate-on="blur">
                        <div class="pa-4">
                            <v-text-field v-model="name" v-bind="nameProps" label="Name" class="mb-1" />
                            <v-textarea
                                v-model="description"
                                v-bind="descriptionProps"
                                label="Description"
                                class="mb-1"
                            />
                            <PermissionEntryCheckboxGrid v-model="entries" :permission-entries="permissionEntries" />
                        </div>
                    </v-form>
                </template>
                <template v-slot:item.2>
                    <div class="d-flex align-center ma-3">
                        <GropiusUserAutocomplete
                            label="Add user"
                            hide-details
                            autofocus
                            @selected-item="users.push($event)"
                        />
                        <v-checkbox
                            v-model="allUsers"
                            label="Grant permission to all users"
                            class="ml-10"
                            hide-details
                        />
                    </div>
                    <template v-for="(user, index) in users" :key="index">
                        <v-divider />
                        <div class="d-flex align-center my-2 mx-3">
                            <User :user="user" size="x-large" />
                            <v-spacer />
                            <IconButton>
                                <v-icon icon="mdi-close" />
                                <v-tooltip activator="parent" location="bottom">Remove user</v-tooltip>
                            </IconButton>
                        </div>
                    </template>
                </template>
            </v-stepper>
            <v-card-actions>
                <DefaultButton variant="text" color="" :disabled="step == 1" @click="previous">Previous</DefaultButton>
                <v-spacer />
                <DefaultButton variant="text" color="" @click="!isDirty && (createPermissionDialog = false)">
                    Cancel
                    <ConfirmationDialog
                        v-if="isDirty"
                        :title="`Discard permission?`"
                        :message="`Are you sure you want to discard this permission?`"
                        confirm-text="Discard"
                        @confirm="createPermissionDialog = false"
                    />
                </DefaultButton>
                <DefaultButton variant="text" color="primary" :disabled="submitDisabled && step == 2" @click="next">
                    {{ step == 1 ? "Next" : "Create permission" }}
                </DefaultButton>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
<script setup lang="ts" generic="T extends string">
import { Ref, ref } from "vue";
import ConfirmationDialog from "./ConfirmationDialog.vue";
import { computed } from "vue";
import { IdObject } from "@/util/types";
import { onEvent } from "@/util/eventBus";
import { PropType } from "vue";
import { CreatePermissionFunction } from "../PermissionList.vue";
import { toTypedSchema } from "@vee-validate/yup";
import * as yup from "yup";
import { useForm } from "vee-validate";
import { fieldConfig } from "@/util/vuetifyFormConfig";
import { enumToRegularCase } from "@/util/casingTransformers";
import { watch } from "vue";
import { useBlockingWithErrorMessage, withErrorMessage } from "@/util/withErrorMessage";
import { objectEntries } from "@vueuse/core";
import { DefaultUserInfoFragment } from "@/graphql/generated";
import GropiusUserAutocomplete from "../input/GropiusUserAutocomplete.vue";
import User from "../info/User.vue";
import PermissionEntryCheckboxGrid from "../input/PermissionEntryCheckboxGrid.vue";

const props = defineProps({
    createPermission: {
        type: Function as PropType<CreatePermissionFunction<T>>,
        required: true
    },
    permissionEntries: {
        type: Array as PropType<T[]>,
        required: true
    }
});

const emit = defineEmits<{
    (event: "created-permission", permission: IdObject): void;
}>();

const createPermissionDialog = ref(false);
const step = ref(1);
const [blockWithErrorMessage, submitDisabled] = useBlockingWithErrorMessage();

const isDirty = computed(() => {
    return step.value > 1 || meta.value.dirty;
});

onEvent("create-permission", () => {
    createPermissionDialog.value = true;
});

watch(createPermissionDialog, (value) => {
    if (value) {
        reset();
    }
});

const schema = toTypedSchema(
    yup.object().shape({
        name: yup.string().required().label("Name"),
        description: yup.string().notRequired().label("Description")
    })
);

const { defineField, meta, resetForm, validate, handleSubmit } = useForm({
    validationSchema: schema
});

const [name, nameProps] = defineField("name", fieldConfig);
const [description, descriptionProps] = defineField("description", fieldConfig);
const entries: Ref<Partial<Record<T, boolean>>> = ref({});
const allUsers = ref(false);
const users = ref<DefaultUserInfoFragment[]>([]);

function next() {
    if (step.value == 1) {
        if (meta.value.valid) {
            step.value = step.value + 1;
        } else {
            validate();
        }
    } else {
        createPermission();
    }
}

const createPermission = handleSubmit(async (state) => {
    const permission = await blockWithErrorMessage(async () => {
        const entriesToAdd: T[] = [];
        for (const entry in entries.value) {
            if (entries.value[entry]) {
                entriesToAdd.push(entry);
            }
        }
        return props.createPermission({
            name: state.name,
            description: state.description ?? "",
            entries: entriesToAdd,
            users: users.value.map((user) => user.id),
            allUsers: allUsers.value
        });
    }, "Error creating permission");
    createPermissionDialog.value = false;
    emit("created-permission", permission);
});

function previous() {
    step.value = step.value - 1;
}

function reset() {
    resetForm();
    step.value = 1;
    entries.value = {};
    allUsers.value = false;
    users.value = [];
}
</script>
<style scoped lang="scss">
@use "@/styles/settings.scss";
.permission-dialog {
    width: min(1000px, calc(100vw - 3 * settings.$side-bar-width));
}
</style>
