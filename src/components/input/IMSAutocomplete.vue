<template>
    <FetchingAutocomplete mode="model" :fetch="searchIMSs" item-title="name" item-value="id">
        <template #item="{ props, item }">
            <v-list-item :title="item.raw.name" :subtitle="item.raw.description" v-bind="props"> </v-list-item>
        </template>
    </FetchingAutocomplete>
</template>
<script setup lang="ts">
import { useClient } from "@/graphql/client";
import { DefaultImsInfoFragment, ImsFilterInput } from "@/graphql/generated";
import { withErrorMessage } from "@/util/withErrorMessage";
import FetchingAutocomplete from "./FetchingAutocomplete.vue";
import { transformSearchQuery } from "@/util/searchQueryTransformer";
import { PropType } from "vue";

const props = defineProps({
    filter: {
        type: Object as PropType<ImsFilterInput>,
        required: false
    }
});

const client = useClient();

async function searchIMSs(filter: string, count: number): Promise<DefaultImsInfoFragment[]> {
    const searchRes = await withErrorMessage(async () => {
        const query = transformSearchQuery(filter);
        if (query != undefined) {
            const res = await client.searchIMSs({ query, count, filter: props.filter });
            return res.searchIMSs;
        } else {
            return [];
        }
    }, "Error searching IMSs");
    return searchRes;
}
</script>
