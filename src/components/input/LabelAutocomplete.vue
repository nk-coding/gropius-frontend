<template>
    <FetchingAutocomplete mode="add" :fetch="searchLabels" item-title="name" item-value="id">
        <template #item="{ props, item: label }">
            <v-list-item :title="label.raw.name" :subtitle="label.raw.description" v-bind="props">
                <template #prepend>
                    <v-icon :color="label.raw.color" class="opacity-100 mr-2" icon="mdi-circle" />
                </template>
            </v-list-item>
        </template>
    </FetchingAutocomplete>
</template>
<script setup lang="ts">
import { NodeReturnType, useClient } from "@/graphql/client";
import { DefaultLabelInfoFragment } from "@/graphql/generated";
import { withErrorMessage } from "@/util/withErrorMessage";
import FetchingAutocomplete from "./FetchingAutocomplete.vue";
import { transformSearchQuery } from "@/util/searchQueryTransformer";
import { PropType } from "vue";

const props = defineProps({
    issue: {
        type: String,
        required: true
    },
    ignore: {
        type: Array as PropType<string[]>,
        required: false,
        default: () => []
    }
});

const client = useClient();

async function searchLabels(filter: string, count: number): Promise<DefaultLabelInfoFragment[]> {
    const searchRes = await withErrorMessage(async () => {
        const query = transformSearchQuery(filter);
        if (query != undefined) {
            const res = await client.searchLabels({ issue: props.issue, query, count });
            return res.searchLabels;
        } else {
            const res = await client.firstLabels({ issue: props.issue, count });
            const nodeRes = res.node as NodeReturnType<"firstLabels", "Issue">;
            return nodeRes.trackables.nodes.flatMap((trackable) => trackable.labels.nodes);
        }
    }, "Error searching labels");
    const searchedLabels = new Map(searchRes.map((label) => [label.id, label]));
    const currentLabels = new Set(props.ignore);
    return [...searchedLabels.values()].filter((label) => !currentLabels.has(label.id));
}
</script>
