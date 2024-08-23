<template>
    <FetchingAutocomplete mode="model" :fetch="searchIMSTemplates" label="Template" item-title="name">
        <template #item="{ props, item }">
            <v-list-item :title="item.raw.name" :subtitle="item.raw.description" v-bind="props"> </v-list-item>
        </template>
    </FetchingAutocomplete>
</template>
<script setup lang="ts">
import { useClient } from "@/graphql/client";
import { DefaultImsTemplateInfoFragment } from "@/graphql/generated";
import { withErrorMessage } from "@/util/withErrorMessage";
import FetchingAutocomplete from "./FetchingAutocomplete.vue";
import { transformSearchQuery } from "@/util/searchQueryTransformer";

const client = useClient();

async function searchIMSTemplates(filter: string, count: number): Promise<DefaultImsTemplateInfoFragment[]> {
    return await withErrorMessage(async () => {
        const query = transformSearchQuery(filter);
        if (query != undefined) {
            const res = await client.searchIMSTemplates({ query, count });
            return res.searchIMSTemplates;
        } else {
            const res = await client.firstIMSTemplates({ count });
            return res.imsTemplates.nodes;
        }
    }, "Error searching IMS templates");
}
</script>
