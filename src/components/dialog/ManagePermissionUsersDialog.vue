<template>
    <v-dialog v-model="managePermissionUsersDialog" width="auto" height="auto">
        <v-card
            color="surface-elevated-3"
            rounded="lger"
            class="pa-3 pb-5 manage-permission-users-dialog"
            elevation="0"
        >
            <v-card-title class="pl-4">Manage users</v-card-title>
            <div class="d-flex align-center ma-3">
                <GropiusUserAutocomplete label="Add user" hide-details autofocus @selected-item="addUser($event.id)" />
                <v-switch
                    v-model="allUsers"
                    label="Grant permission to all users"
                    class="ml-10"
                    @update:model-value="updateAllUsers"
                />
            </div>
            <v-divider class="my-2" />
            <PaginatedList
                name="users"
                :item-manager="itemManager"
                :sort-fields="sortFields"
                :to="() => undefined"
                :dependencies="modifiedUsers"
            >
                <template #item="{ item }">
                    <div class="d-flex align-center my-2">
                        <User :user="item" size="x-large" />
                        <v-spacer />
                        <IconButton>
                            <v-icon icon="mdi-close" />
                            <ConfirmationDialog
                                :title="`Remove user from permission?`"
                                :message="`Are you sure you want to remove the user from this permission}?`"
                                confirm-text="Remove"
                                @confirm="removeUser(item.id)"
                            />
                            <v-tooltip activator="parent" location="bottom">Remove user from permission</v-tooltip>
                        </IconButton>
                    </div>
                </template>
            </PaginatedList>
        </v-card>
    </v-dialog>
</template>
<script setup lang="ts" generic="T">
import { NodeReturnType, useClient } from "@/graphql/client";
import { PropType, computed, ref, watch } from "vue";
import PaginatedList, { ItemManager } from "../PaginatedList.vue";
import { DefaultUserInfoFragment, GropiusUserOrder, GropiusUserOrderField } from "@/graphql/generated";
import User from "../info/User.vue";
import ConfirmationDialog from "./ConfirmationDialog.vue";
import GropiusUserAutocomplete from "../input/GropiusUserAutocomplete.vue";
import { IdObject } from "@/util/types";
import { UpdatePermissionFunction } from "../PermissionList.vue";
import { withErrorMessage } from "@/util/withErrorMessage";

const props = defineProps({
    updatePermission: {
        type: Function as PropType<UpdatePermissionFunction<T>>,
        required: true
    }
});

const emit = defineEmits<{
    (event: "updated-permission"): void;
}>();

const model = defineModel({
    type: Object as PropType<(IdObject & { allUsers: boolean }) | null>,
    required: false
});

const allUsers = ref(model.value?.allUsers ?? false);

watch(model, (newModel) => {
    if (newModel != null) {
        allUsers.value = newModel.allUsers;
    }
});

const managePermissionUsersDialog = computed({
    get: () => model.value != null,
    set: (value) => {
        if (!value) {
            model.value = null;
        }
    }
});
const client = useClient();

const modifiedUsers = ref<string[]>([]);

async function removeUser(id: string) {
    await withErrorMessage(async () => {
        return props.updatePermission({
            id: model.value!.id,
            removedUsers: [id]
        });
    }, "Failed to remove user from permission");
    modifiedUsers.value.push(id);
    emit("updated-permission");
}

async function addUser(id: string) {
    await withErrorMessage(async () => {
        return props.updatePermission({
            id: model.value!.id,
            addedUsers: [id]
        });
    }, "Failed to add user to permission");
    modifiedUsers.value.push(id);
    emit("updated-permission");
}

async function updateAllUsers(checked: boolean | null) {
    const newValue = checked ?? false;
    try {
        await withErrorMessage(async () => {
            return props.updatePermission({
                id: model.value!.id,
                allUsers: newValue
            });
        }, "Failed to update all users permission setting");
    } catch (e) {
        allUsers.value = !newValue;
        throw e;
    }
    emit("updated-permission");
}

const sortFields = {
    Username: GropiusUserOrderField.Username,
    "Display name": GropiusUserOrderField.DisplayName,
    "[Default]": GropiusUserOrderField.Id
};

const itemManager: ItemManager<DefaultUserInfoFragment, GropiusUserOrderField> = {
    fetchItems: async function (
        filter: string | undefined,
        orderBy: GropiusUserOrder[],
        count: number,
        page: number
    ): Promise<[DefaultUserInfoFragment[], number]> {
        if (filter == undefined) {
            const res = await client.getPermissionUserList({
                orderBy,
                count,
                skip: page * count,
                permission: model.value!.id
            });
            const users = (res.node as NodeReturnType<"getPermissionUserList", "ComponentPermission">).users;
            return [users.nodes, users.totalCount];
        } else {
            const res = await client.getFilteredPermissionUserList({
                query: filter,
                count,
                permission: model.value!.id
            });
            return [res.searchGropiusUsers, res.searchGropiusUsers.length];
        }
    }
};
</script>
<style scoped lang="scss">
@use "@/styles/settings.scss";
.manage-permission-users-dialog {
    width: min(750px, calc(100vw - 3 * settings.$side-bar-width));
    max-height: 75vh;
}
</style>
