<template>
    <FetchingAutocomplete mode="model" :fetch="searchViews" :label="label" item-title="name">
        <template #item="{ props, item }">
            <v-list-item v-bind="props" :title="item.raw.name" :subtitle="item.raw.description" />
        </template>
    </FetchingAutocomplete>
</template>
<script setup lang="ts">
import { NodeReturnType, useClient } from "@/graphql/client";
import { DefaultViewInfoFragment } from "@/graphql/generated";
import { withErrorMessage } from "@/util/withErrorMessage";
import FetchingAutocomplete from "./FetchingAutocomplete.vue";
import { transformSearchQuery } from "@/util/searchQueryTransformer";

const props = defineProps({
    label: {
        type: String,
        required: false,
        default: "View"
    },
    project: {
        type: String,
        required: true
    }
});

const client = useClient();

async function searchViews(filter: string, count: number): Promise<DefaultViewInfoFragment[]> {
    return await withErrorMessage(async () => {
        const query = transformSearchQuery(filter);
        if (query != undefined) {
            const res = await client.searchViews({ query, count, project: props.project });
            return res.searchViews;
        } else {
            const res = (await client.firstViews({ project: props.project, count: count - 1 })).node as NodeReturnType<
                "firstViews",
                "Project"
            >;
            return res.views.nodes;
        }
    }, "Error searching views");
}
</script>
