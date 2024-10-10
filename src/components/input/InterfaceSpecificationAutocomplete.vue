<template>
    <FetchingAutocomplete
        mode="model"
        :fetch="searchIssueTypes"
        :dependency="component"
        label="Interface Specification"
        item-title="name"
    >
        <template #item="{ props, item }">
            <v-list-item :title="item.raw.name" :subtitle="item.raw.description" v-bind="props" />
        </template>
    </FetchingAutocomplete>
</template>
<script setup lang="ts">
import { NodeReturnType, useClient } from "@/graphql/client";
import { DefaultInterfaceSpecificationInfoFragment } from "@/graphql/generated";
import { withErrorMessage } from "@/util/withErrorMessage";
import FetchingAutocomplete from "./FetchingAutocomplete.vue";
import { transformSearchQuery } from "@/util/searchQueryTransformer";

const props = defineProps({
    component: {
        type: String,
        required: false
    }
});

const client = useClient();

async function searchIssueTypes(filter: string, count: number): Promise<DefaultInterfaceSpecificationInfoFragment[]> {
    if (props.component == undefined) {
        return [];
    }
    return await withErrorMessage(async () => {
        const query = transformSearchQuery(filter);
        if (query != undefined) {
            const res = await client.searchInterfaceSpecifications({ component: props.component!, query, count });
            return res.searchInterfaceSpecifications;
        } else {
            const res = await client.firstInterfaceSpecifications({ component: props.component!, count });
            const nodeRes = res.node as NodeReturnType<"firstInterfaceSpecifications", "Component">;
            return nodeRes.interfaceSpecifications.nodes;
        }
    }, "Error searching interface specifications");
}
</script>
