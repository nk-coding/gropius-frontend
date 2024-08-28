<template>
    <FetchingAutocomplete
        mode="add-context"
        :fetch="searchProjectPermissions"
        :context-fetch="searchProjects"
        :label="projectPermission"
        placeholder="Search project"
        :item-title="(item: any) => item.name ?? item.title"
        :initial-context="initialContext"
    >
        <template #item="{ props, item: projectPermission }">
            <v-list-item
                :title="projectPermission.raw.name"
                :subtitle="projectPermission.raw.description"
                v-bind="props"
            />
        </template>
        <template #context-item="{ props, item }">
            <v-list-item :title="item.raw.name" :subtitle="item.raw.description" v-bind="props"> </v-list-item>
        </template>
    </FetchingAutocomplete>
</template>
<script setup lang="ts">
import { NodeReturnType, useClient } from "@/graphql/client";
import { DefaultProjectPermissionInfoFragment, DefaultTrackableInfoFragment } from "@/graphql/generated";
import { withErrorMessage } from "@/util/withErrorMessage";
import FetchingAutocomplete from "./FetchingAutocomplete.vue";
import { transformSearchQuery } from "@/util/searchQueryTransformer";
import { PropType } from "vue";

const props = defineProps({
    projectPermission: {
        type: String,
        required: false,
        default: "ProjectPermission"
    },
    initialContext: {
        type: Object as PropType<Readonly<DefaultTrackableInfoFragment>>,
        required: false
    }
});

const client = useClient();

async function searchProjectPermissions(
    filter: string,
    count: number,
    context?: DefaultTrackableInfoFragment
): Promise<DefaultProjectPermissionInfoFragment[]> {
    return await withErrorMessage(async () => {
        const query = transformSearchQuery(filter);
        if (query != undefined) {
            const res = await client.searchProjectPermissions({ query, count, project: context!.id });
            return res.searchProjectPermissions;
        } else {
            const res = await client.firstProjectPermissions({ project: context!.id, count });
            return (res.node as NodeReturnType<"firstProjectPermissions", "Project">).permissions.nodes;
        }
    }, "Error searching project permissions");
}

async function searchProjects(filter: string, count: number): Promise<DefaultTrackableInfoFragment[]> {
    return await withErrorMessage(async () => {
        const query = transformSearchQuery(filter);
        if (query != undefined) {
            const res = await client.searchProjects({ query, count });
            return res.searchProjects;
        } else {
            const res = await client.firstProjects({ count });
            return res.projects.nodes;
        }
    }, "Error searching projects");
}
</script>
