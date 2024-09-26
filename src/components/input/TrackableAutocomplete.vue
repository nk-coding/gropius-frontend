<template>
    <FetchingAutocomplete :mode="mode" :fetch="searchTrackables" item-title="name" item-value="id">
        <template #item="{ props, item: trackable }">
            <v-list-item :title="trackable.raw.name" :subtitle="trackable.raw.description" v-bind="props">
                <template #prepend>
                    <v-icon
                        color="primary"
                        class="opacity-100 mr-2"
                        :icon="affectedByIssueIcon(trackable.raw.__typename)"
                    />
                </template>
            </v-list-item>
        </template>
    </FetchingAutocomplete>
</template>
<script setup lang="ts">
import { useClient } from "@/graphql/client";
import { DefaultTrackableInfoFragment, TrackableFilterInput } from "@/graphql/generated";
import { withErrorMessage } from "@/util/withErrorMessage";
import FetchingAutocomplete from "./FetchingAutocomplete.vue";
import { transformSearchQuery } from "@/util/searchQueryTransformer";
import { PropType } from "vue";
import { affectedByIssueIcon } from "@/util/affectedByIssueUtils";

const props = defineProps({
    ignore: {
        type: Array as PropType<string[]>,
        required: false,
        default: () => []
    },
    filter: {
        type: Object as PropType<TrackableFilterInput>,
        required: false
    },
    mode: {
        type: String as PropType<"add" | "model">,
        required: false,
        default: "add"
    }
});

const client = useClient();

async function searchTrackables(filter: string, count: number): Promise<DefaultTrackableInfoFragment[]> {
    const searchRes = await withErrorMessage(async () => {
        const query = transformSearchQuery(filter);
        if (query != undefined) {
            const res = await client.searchTrackables({ query, count, filter: props.filter });
            return res.searchTrackables;
        } else {
            const res = await client.firstTrackables({ count, filter: props.filter });
            return res.trackables.nodes;
        }
    }, "Error searching trackables");
    const ignoredTrackables = new Set(props.ignore);
    return searchRes.filter((trackable) => !ignoredTrackables.has(trackable.id));
}
</script>
