<template>
    <FetchingAutocomplete
        mode="add-context"
        :fetch="searchAffected"
        :context-fetch="searchTrackables"
        placeholder="Search component/project"
        :item-title="(item: any) => item.name ?? item.title"
        item-value="id"
        :initial-context="initialContext"
    >
        <template #item="{ props, item }">
            <v-list-item
                v-bind="props"
                :title="`${item.raw.name} [${item.raw.__typename}]`"
                :subtitle="item.raw.description"
            >
            </v-list-item>
        </template>
        <template #context-item="{ props, item }">
            <v-list-item v-bind="props" :title="item.raw.name" :subtitle="item.raw.description"> </v-list-item>
        </template>
    </FetchingAutocomplete>
</template>
<script setup lang="ts">
import { NodeReturnType, useClient } from "@/graphql/client";
import { DefaultAffectedByIssueInfoFragment, DefaultTrackableInfoFragment } from "@/graphql/generated";
import { withErrorMessage } from "@/util/withErrorMessage";
import FetchingAutocomplete from "./FetchingAutocomplete.vue";
import { transformSearchQuery } from "@/util/searchQueryTransformer";
import { PropType } from "vue";

const props = defineProps({
    initialContext: {
        type: Object as PropType<Readonly<DefaultTrackableInfoFragment>>,
        required: false
    },
    ignore: {
        type: Array as PropType<string[]>,
        required: false,
        default: () => []
    }
});

const client = useClient();

async function searchAffected(
    filter: string,
    count: number,
    context?: DefaultTrackableInfoFragment
): Promise<DefaultAffectedByIssueInfoFragment[]> {
    const searchRes = await withErrorMessage(async () => {
        const query = transformSearchQuery(filter);
        if (query != undefined) {
            const res = await client.searchAffectedByIssues({ query, count, trackable: context!.id });
            return res.searchAffectedByIssues;
        } else if (context!.__typename == "Component") {
            const res = (await client.getComponentVersions({ id: context!.id, count: count - 1 }))
                .node as NodeReturnType<"getComponentVersions", "Component">;
            return [context!, ...res.versions.nodes];
        } else {
            return [context!];
        }
    }, "Error searching affectable entities");
    const ignoredIds = new Set(props.ignore);
    return searchRes.filter((item) => !ignoredIds.has(item.id));
}

async function searchTrackables(filter: string, count: number): Promise<DefaultTrackableInfoFragment[]> {
    return await withErrorMessage(async () => {
        const query = transformSearchQuery(filter);
        if (query != undefined) {
            const res = await client.searchTrackables({ query, count });
            return res.searchTrackables;
        } else {
            const res = await client.firstTrackables({ count });
            return res.trackables.nodes;
        }
    }, "Error searching trackables");
}
</script>
