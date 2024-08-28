<template>
    <FetchingAutocomplete
        mode="add-context"
        :fetch="searchComponentPermissions"
        :context-fetch="searchComponents"
        :label="componentPermission"
        placeholder="Search component"
        :item-title="(item: any) => item.name ?? item.title"
        :initial-context="initialContext"
    >
        <template #item="{ props, item: componentPermission }">
            <v-list-item
                :title="componentPermission.raw.name"
                :subtitle="componentPermission.raw.description"
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
import { DefaultComponentPermissionInfoFragment, DefaultTrackableInfoFragment } from "@/graphql/generated";
import { withErrorMessage } from "@/util/withErrorMessage";
import FetchingAutocomplete from "./FetchingAutocomplete.vue";
import { transformSearchQuery } from "@/util/searchQueryTransformer";
import { PropType } from "vue";

const props = defineProps({
    componentPermission: {
        type: String,
        required: false,
        default: "ComponentPermission"
    },
    initialContext: {
        type: Object as PropType<Readonly<DefaultTrackableInfoFragment>>,
        required: false
    }
});

const client = useClient();

async function searchComponentPermissions(
    filter: string,
    count: number,
    context?: DefaultTrackableInfoFragment
): Promise<DefaultComponentPermissionInfoFragment[]> {
    return await withErrorMessage(async () => {
        const query = transformSearchQuery(filter);
        if (query != undefined) {
            const res = await client.searchComponentPermissions({ query, count, component: context!.id });
            return res.searchComponentPermissions;
        } else {
            const res = await client.firstComponentPermissions({ component: context!.id, count });
            return (res.node as NodeReturnType<"firstComponentPermissions", "Component">).permissions.nodes;
        }
    }, "Error searching component permissions");
}

async function searchComponents(filter: string, count: number): Promise<DefaultTrackableInfoFragment[]> {
    return await withErrorMessage(async () => {
        const query = transformSearchQuery(filter);
        if (query != undefined) {
            const res = await client.searchComponents({ query, count });
            return res.searchComponents;
        } else {
            const res = await client.firstComponents({ count });
            return res.components.nodes;
        }
    }, "Error searching components");
}
</script>
