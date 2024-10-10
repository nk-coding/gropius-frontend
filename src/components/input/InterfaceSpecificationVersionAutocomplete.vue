<template>
    <FetchingAutocomplete
        mode="model"
        :fetch="searchIssueTypes"
        :dependency="interfaceSpecification"
        label="Version"
        item-title="version"
    >
        <template #item="{ props, item }">
            <v-list-item :title="item.raw.version" v-bind="props" />
        </template>
    </FetchingAutocomplete>
</template>
<script setup lang="ts">
import { NodeReturnType, useClient } from "@/graphql/client";
import { DefaultInterfaceSpecificationVersionInfoFragment } from "@/graphql/generated";
import { withErrorMessage } from "@/util/withErrorMessage";
import FetchingAutocomplete from "./FetchingAutocomplete.vue";
import { transformSearchQuery } from "@/util/searchQueryTransformer";

const props = defineProps({
    interfaceSpecification: {
        type: String,
        required: false
    }
});

const client = useClient();

async function searchIssueTypes(
    filter: string,
    count: number
): Promise<DefaultInterfaceSpecificationVersionInfoFragment[]> {
    if (props.interfaceSpecification == undefined) {
        return [];
    }
    return await withErrorMessage(async () => {
        const query = transformSearchQuery(filter);
        if (query != undefined) {
            const res = await client.searchInterfaceSpecificationVersions({
                interfaceSpecification: props.interfaceSpecification!,
                query,
                count
            });
            return res.searchInterfaceSpecificationVersions;
        } else {
            const res = await client.firstInterfaceSpecificationVersions({
                interfaceSpecification: props.interfaceSpecification!,
                count
            });
            const nodeRes = res.node as NodeReturnType<"firstInterfaceSpecificationVersions", "InterfaceSpecification">;
            return nodeRes.versions.nodes;
        }
    }, "Error searching interface specification versions");
}
</script>
