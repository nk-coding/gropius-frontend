<template>
    <FetchingAutocomplete
        mode="add-context"
        :fetch="searchIMSPermissions"
        :context-fetch="searchIMSs"
        :label="imsPermission"
        placeholder="Search ims"
        :item-title="(item: any) => item.name ?? item.title"
        :initial-context="initialContext"
    >
        <template #item="{ props, item: imsPermission }">
            <v-list-item :title="imsPermission.raw.name" :subtitle="imsPermission.raw.description" v-bind="props" />
        </template>
        <template #context-item="{ props, item }">
            <v-list-item :title="item.raw.name" :subtitle="item.raw.description" v-bind="props"> </v-list-item>
        </template>
    </FetchingAutocomplete>
</template>
<script setup lang="ts">
import { NodeReturnType, useClient } from "@/graphql/client";
import {
    DefaultImsInfoFragment,
    DefaultImsPermissionInfoFragment,
    DefaultTrackableInfoFragment
} from "@/graphql/generated";
import { withErrorMessage } from "@/util/withErrorMessage";
import FetchingAutocomplete from "./FetchingAutocomplete.vue";
import { transformSearchQuery } from "@/util/searchQueryTransformer";
import { PropType } from "vue";

const props = defineProps({
    imsPermission: {
        type: String,
        required: false,
        default: "IMSPermission"
    },
    initialContext: {
        type: Object as PropType<Readonly<DefaultImsInfoFragment>>,
        required: false
    }
});

const client = useClient();

async function searchIMSPermissions(
    filter: string,
    count: number,
    context?: DefaultImsInfoFragment
): Promise<DefaultImsPermissionInfoFragment[]> {
    return await withErrorMessage(async () => {
        const query = transformSearchQuery(filter);
        if (query != undefined) {
            const res = await client.searchIMSPermissions({ query, count, ims: context!.id });
            return res.searchIMSPermissions;
        } else {
            const res = await client.firstIMSPermissions({ ims: context!.id, count });
            return (res.node as NodeReturnType<"firstIMSPermissions", "IMS">).permissions.nodes;
        }
    }, "Error searching ims permissions");
}

async function searchIMSs(filter: string, count: number): Promise<DefaultImsInfoFragment[]> {
    return await withErrorMessage(async () => {
        const query = transformSearchQuery(filter);
        if (query != undefined) {
            const res = await client.searchIMSs({ query, count });
            return res.searchIMSs;
        } else {
            return [];
        }
    }, "Error searching IMSs");
}
</script>
