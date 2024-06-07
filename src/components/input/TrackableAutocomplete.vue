<template>
    <FetchingAutocomplete mode="add" :fetch="searchTrackables" item-title="name" item-value="id">
        <template #item="{ props, item: trackable }">
            <v-list-item :title="trackable.raw.name" :subtitle="trackable.raw.description" v-bind="props">
                <template #prepend>
                    <v-icon
                        color="primary"
                        class="opacity-100 mr-2"
                        :icon="mapAffectedByIssueTypeToIcon(trackable.raw.__typename)"
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
import { mapAffectedByIssueTypeToIcon } from "@/util/mapAffectedByIssueTypeToIcon";

const props = defineProps({
    ignore: {
        type: Array as PropType<string[]>,
        required: false,
        default: () => []
    },
    filter: {
        type: Object as PropType<TrackableFilterInput>,
        required: false
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
            return [];
        }
    }, "Error searching trackables");
    const searchedTrackables = new Map(searchRes.map((trackable) => [trackable.id, trackable]));
    const currentTrackables = new Set(props.ignore);
    return [...searchedTrackables.values()].filter((trackable) => !currentTrackables.has(trackable.id));
}
</script>
