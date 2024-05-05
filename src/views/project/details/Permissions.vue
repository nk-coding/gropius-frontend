<template>
    <PermissionList
        :permission-entries="permissionEntries"
        :item-manager="itemManager"
        node-name="project"
        :remove-permission="removePermission"
        :update-permission="updatePermission"
        :create-permission="createPermission"
    >
        <template #import-dialog="{ importedPermission }">
            <ImportProjectPermissionDialog :project="projectId" @imported-project-permission="importedPermission" />
        </template>
    </PermissionList>
</template>
<script lang="ts" setup>
import { ItemManager } from "@/components/PaginatedList.vue";
import PermissionList, {
    CreatePermissionFunctionInput,
    UpdatePermissionFunctionInput
} from "@/components/PermissionList.vue";
import ImportProjectPermissionDialog from "@/components/dialog/ImportProjectPermissionDialog.vue";
import { NodeReturnType, useClient } from "@/graphql/client";
import {
    ProjectPermissionEntry,
    ProjectPermissionOrderField,
    DefaultProjectPermissionInfoFragment,
    OrderDirection
} from "@/graphql/generated";
import { permissionSortFields } from "@/util/permissionSortFields";
import { IdObject } from "@/util/types";
import { computed } from "vue";
import { useRoute } from "vue-router";

const client = useClient();
const route = useRoute();

const projectId = computed(() => route.params.trackable as string);

const permissionEntries = Object.values(ProjectPermissionEntry);

const itemManager: ItemManager<DefaultProjectPermissionInfoFragment, keyof typeof permissionSortFields> = {
    fetchItems: async function (
        filter: string | undefined,
        sortField: keyof typeof permissionSortFields,
        sortAscending: boolean,
        count: number,
        page: number
    ): Promise<[DefaultProjectPermissionInfoFragment[], number]> {
        if (filter == undefined) {
            const res = await client.getProjectPermissionList({
                orderBy: {
                    field: permissionSortFields[sortField] as ProjectPermissionOrderField,
                    direction: sortAscending ? OrderDirection.Asc : OrderDirection.Desc
                },
                count,
                skip: page * count,
                project: projectId.value
            });
            const permissions = (res.node as NodeReturnType<"getProjectPermissionList", "Project">).permissions;
            return [permissions.nodes, permissions.totalCount];
        } else {
            const res = await client.getFilteredProjectPermissionList({
                query: filter,
                count,
                project: projectId.value
            });
            return [res.searchProjectPermissions, res.searchProjectPermissions.length];
        }
    }
};

async function removePermission(id: string): Promise<void> {
    await client.removeProjectPermissionFromProject({ project: projectId.value, projectPermission: id });
}

async function updatePermission(input: UpdatePermissionFunctionInput<ProjectPermissionEntry>): Promise<void> {
    await client.updateProjectPermission({ input });
}

async function createPermission(input: CreatePermissionFunctionInput<ProjectPermissionEntry>): Promise<IdObject> {
    const res = await client.createProjectPermission({
        input: { nodesWithPermission: [projectId.value], ...input }
    });
    return res.createProjectPermission.projectPermission;
}
</script>
