<template>
    <FetchingAutocomplete
        mode="add-context"
        :fetch="searchLabels"
        :context-fetch="searchTrackables"
        :label="label"
        placeholder="Search component/project"
        :item-title="(item: any) => item.name ?? item.title"
        :initial-context="initialContext"
    >
        <template #item="{ props, item: label }">
            <v-list-item :title="label.raw.name" :subtitle="label.raw.description" v-bind="props">
                <template #prepend>
                    <v-icon :color="label.raw.color" class="opacity-100 mr-2" icon="mdi-circle" />
                </template>
            </v-list-item>
        </template>
        <template #context-item="{ props, item }">
            <v-list-item :title="item.raw.name" :subtitle="item.raw.description" v-bind="props"> </v-list-item>
        </template>
    </FetchingAutocomplete>
</template>
<script setup lang="ts">
import { NodeReturnType, useClient } from "@/graphql/client";
import { DefaultLabelInfoFragment, DefaultTrackableInfoFragment } from "@/graphql/generated";
import { withErrorMessage } from "@/util/withErrorMessage";
import FetchingAutocomplete from "./FetchingAutocomplete.vue";
import { transformSearchQuery } from "@/util/searchQueryTransformer";
import { PropType } from "vue";

const props = defineProps({
    label: {
        type: String,
        required: false,
        default: "Label"
    },
    initialContext: {
        type: Object as PropType<Readonly<DefaultTrackableInfoFragment>>,
        required: false
    }
});

const client = useClient();

async function searchLabels(
    filter: string,
    count: number,
    context?: DefaultTrackableInfoFragment
): Promise<DefaultLabelInfoFragment[]> {
    return await withErrorMessage(async () => {
        const query = transformSearchQuery(filter);
        if (query != undefined) {
            const res = await client.searchTrackableLabels({ query, count, trackable: context!.id });
            return res.searchLabels;
        } else {
            const res = await client.firstTrackableLabels({ trackable: context!.id, count });
            return (res.node as NodeReturnType<"firstTrackableLabels", "Component">).labels.nodes;
        }
    }, "Error searching labels");
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
