<template>
    <FetchingAutocomplete
        mode="model"
        :fetch="searchInterfaceSpecificationTemplates"
        label="Template"
        item-title="name"
    >
        <template #item="{ props, item }">
            <v-list-item :title="item.raw.name" :subtitle="item.raw.description" v-bind="props"> </v-list-item>
        </template>
    </FetchingAutocomplete>
</template>
<script setup lang="ts">
import { useClient } from "@/graphql/client";
import { DefaultInterfaceSpecificationTemplateInfoFragment } from "@/graphql/generated";
import { withErrorMessage } from "@/util/withErrorMessage";
import FetchingAutocomplete from "./FetchingAutocomplete.vue";
import { transformSearchQuery } from "@/util/searchQueryTransformer";

const client = useClient();

async function searchInterfaceSpecificationTemplates(
    filter: string,
    count: number
): Promise<DefaultInterfaceSpecificationTemplateInfoFragment[]> {
    return await withErrorMessage(async () => {
        const query = transformSearchQuery(filter);
        if (query != undefined) {
            const res = await client.searchInterfaceSpecificationTemplates({ query, count });
            return res.searchInterfaceSpecificationTemplates;
        } else {
            const res = await client.firstInterfaceSpecificationTemplates({ count });
            return res.interfaceSpecificationTemplates.nodes;
        }
    }, "Error searching interface specification templates");
}
</script>
