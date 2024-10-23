<template>
    <FetchingAutocomplete
        mode="add-context"
        :fetch="searchInterfaceSpecificationVersions"
        :context-fetch="searchInterfaceSpecifications"
        :label="label"
        placeholder="Search interface specification"
        item-title="name"
        :initial-context="initialContext"
    >
        <template #item="{ props, item }">
            <v-list-item v-bind="props" :title="`v${item.raw.version}`" />
        </template>
        <template #context-item="{ props, item }">
            <v-list-item :title="item.raw.name" :subtitle="item.raw.description" v-bind="props"> </v-list-item>
        </template>
    </FetchingAutocomplete>
</template>
<script setup lang="ts">
import { NodeReturnType, useClient } from "@/graphql/client";
import {
    DefaultInterfaceSpecificationVersionInfoFragment,
    DefaultInterfaceSpecificationInfoFragment
} from "@/graphql/generated";
import { withErrorMessage } from "@/util/withErrorMessage";
import FetchingAutocomplete from "./FetchingAutocomplete.vue";
import { transformSearchQuery } from "@/util/searchQueryTransformer";
import { PropType } from "vue";

const props = defineProps({
    label: {
        type: String,
        required: false,
        default: "Interface specification version"
    },
    initialContext: {
        type: Object as PropType<Readonly<DefaultInterfaceSpecificationInfoFragment>>,
        required: false
    },
    component: {
        type: String,
        required: true
    }
});

const client = useClient();

async function searchInterfaceSpecificationVersions(
    filter: string,
    count: number,
    context?: DefaultInterfaceSpecificationInfoFragment
): Promise<DefaultInterfaceSpecificationVersionInfoFragment[]> {
    return await withErrorMessage(async () => {
        const query = transformSearchQuery(filter);
        if (query != undefined) {
            const res = await client.searchInterfaceSpecificationVersions({
                query,
                count,
                interfaceSpecification: context!.id
            });
            return res.searchInterfaceSpecificationVersions;
        } else {
            const res = (
                await client.firstInterfaceSpecificationVersions({
                    interfaceSpecification: context!.id,
                    count: count - 1
                })
            ).node as NodeReturnType<"firstInterfaceSpecificationVersions", "InterfaceSpecification">;
            return res.versions.nodes;
        }
    }, "Error searching interface specification versions");
}

async function searchInterfaceSpecifications(
    filter: string,
    count: number
): Promise<DefaultInterfaceSpecificationInfoFragment[]> {
    return await withErrorMessage(async () => {
        const query = transformSearchQuery(filter);
        if (query != undefined) {
            const res = await client.searchInterfaceSpecifications({ query, count, component: props.component });
            return res.searchInterfaceSpecifications;
        } else {
            const res = (await client.firstInterfaceSpecifications({ count, component: props.component }))
                .node as NodeReturnType<"firstInterfaceSpecifications", "Component">;
            return res.interfaceSpecifications.nodes;
        }
    }, "Error searching interface specifications");
}
</script>
