<template>
    <FetchingAutocomplete
        mode="add-context"
        :fetch="searchComponentVersions"
        :context-fetch="searchComponents"
        :label="label"
        placeholder="Search component"
        item-title="name"
        :initial-context="initialContext"
    >
        <template #item="{ props, item }">
            <v-list-item v-bind="props" :title="`v${item.raw.version}`" />
        </template>
        <template #context-item="{ props, item }">
            <v-list-item :title="item.raw.name" :subtitle="item.raw.description" v-bind="props"> </v-list-item>
        </template>
    </FetchingAutocomplete>
</template>
<script setup lang="ts">
import { NodeReturnType, useClient } from "@/graphql/client";
import {
    ComponentFilterInput,
    DefaultComponentVersionInfoFragment,
    DefaultTrackableInfoFragment
} from "@/graphql/generated";
import { withErrorMessage } from "@/util/withErrorMessage";
import FetchingAutocomplete from "./FetchingAutocomplete.vue";
import { transformSearchQuery } from "@/util/searchQueryTransformer";
import { PropType } from "vue";

const props = defineProps({
    label: {
        type: String,
        required: false,
        default: "Component version"
    },
    initialContext: {
        type: Object as PropType<Readonly<DefaultTrackableInfoFragment>>,
        required: false
    },
    componentFilter: {
        type: Object as PropType<ComponentFilterInput>,
        required: false
    }
});

const client = useClient();

async function searchComponentVersions(
    filter: string,
    count: number,
    context?: DefaultTrackableInfoFragment
): Promise<DefaultComponentVersionInfoFragment[]> {
    return await withErrorMessage(async () => {
        const query = transformSearchQuery(filter);
        if (query != undefined) {
            const res = await client.searchComponentVersions({ query, count, component: context!.id });
            return res.searchComponentVersions;
        } else {
            const res = (await client.firstComponentVersions({ component: context!.id, count: count - 1 }))
                .node as NodeReturnType<"firstComponentVersions", "Component">;
            return res.versions.nodes;
        }
    }, "Error searching component versions");
}

async function searchComponents(filter: string, count: number): Promise<DefaultTrackableInfoFragment[]> {
    return await withErrorMessage(async () => {
        const query = transformSearchQuery(filter);
        if (query != undefined) {
            const res = await client.searchComponents({ query, count, filter: props.componentFilter });
            return res.searchComponents;
        } else {
            const res = await client.firstComponents({ count, filter: props.componentFilter });
            return res.components.nodes;
        }
    }, "Error searching components");
}
</script>
