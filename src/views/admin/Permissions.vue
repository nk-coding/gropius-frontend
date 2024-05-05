<template>
    <PermissionList
        :permission-entries="permissionEntries"
        :item-manager="itemManager"
        node-name="global"
        :remove-permission="deletePermission"
        :update-permission="updatePermission"
        :create-permission="createPermission"
    >
    </PermissionList>
</template>
<script lang="ts" setup>
import { ItemManager } from "@/components/PaginatedList.vue";
import PermissionList, {
    CreatePermissionFunctionInput,
    UpdatePermissionFunctionInput
} from "@/components/PermissionList.vue";
import { useClient } from "@/graphql/client";
import {
    PermissionEntry,
    GlobalPermissionOrderField,
    DefaultGlobalPermissionInfoFragment,
    OrderDirection
} from "@/graphql/generated";
import { permissionSortFields } from "@/util/permissionSortFields";
import { IdObject } from "@/util/types";
import { computed } from "vue";
import { useRoute } from "vue-router";

const client = useClient();
const route = useRoute();

const globalId = computed(() => route.params.trackable as string);

const permissionEntries = Object.values(PermissionEntry);

const itemManager: ItemManager<DefaultGlobalPermissionInfoFragment, keyof typeof permissionSortFields> = {
    fetchItems: async function (
        filter: string | undefined,
        sortField: keyof typeof permissionSortFields,
        sortAscending: boolean,
        count: number,
        page: number
    ): Promise<[DefaultGlobalPermissionInfoFragment[], number]> {
        if (filter == undefined) {
            const res = await client.getGlobalPermissionList({
                orderBy: {
                    field: permissionSortFields[sortField] as GlobalPermissionOrderField,
                    direction: sortAscending ? OrderDirection.Asc : OrderDirection.Desc
                },
                count,
                skip: page * count
            });
            const permissions = res.globalPermissions;
            return [permissions.nodes, permissions.totalCount];
        } else {
            const res = await client.getFilteredGlobalPermissionList({
                query: filter,
                count
            });
            return [res.searchGlobalPermissions, res.searchGlobalPermissions.length];
        }
    }
};

async function deletePermission(id: string): Promise<void> {
    await client.deleteGlobalPermission({ globalPermission: id });
}

async function updatePermission(input: UpdatePermissionFunctionInput<PermissionEntry>): Promise<void> {
    await client.updateGlobalPermission({ input });
}

async function createPermission(input: CreatePermissionFunctionInput<PermissionEntry>): Promise<IdObject> {
    const res = await client.createGlobalPermission({
        input: { ...input }
    });
    return res.createGlobalPermission.globalPermission;
}
</script>
