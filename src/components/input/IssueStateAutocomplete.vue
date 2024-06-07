<template>
    <FetchingAutocomplete
        mode="model"
        :fetch="searchIssueStates"
        :dependency="template"
        label="State"
        item-title="name"
    >
        <template #item="{ props, item }">
            <v-list-item :title="item.raw.name" :subtitle="item.raw.description" v-bind="props">
                <template #prepend>
                    <v-icon
                        :color="item.raw.isOpen ? 'issue-open' : 'issue-closed'"
                        class="opacity-100 mr-4"
                        icon="mdi-circle"
                    />
                </template>
            </v-list-item>
        </template>
    </FetchingAutocomplete>
</template>
<script setup lang="ts">
import { NodeReturnType, useClient } from "@/graphql/client";
import { DefaultIssueStateInfoFragment } from "@/graphql/generated";
import { withErrorMessage } from "@/util/withErrorMessage";
import FetchingAutocomplete from "./FetchingAutocomplete.vue";
import { transformSearchQuery } from "@/util/searchQueryTransformer";

const props = defineProps({
    template: {
        type: String,
        required: false
    }
});

const client = useClient();

async function searchIssueStates(filter: string, count: number): Promise<DefaultIssueStateInfoFragment[]> {
    if (props.template == undefined) {
        return [];
    }
    return await withErrorMessage(async () => {
        const query = transformSearchQuery(filter);
        if (query != undefined) {
            const res = await client.searchIssueStates({ template: props.template!, query, count });
            return res.searchIssueStates;
        } else {
            const res = await client.firstIssueStates({ template: props.template!, count });
            const nodeRes = res.node as NodeReturnType<"firstIssueStates", "IssueTemplate">;
            return nodeRes.issueStates.nodes;
        }
    }, "Error searching issue states");
}
</script>
<style scoped lang="scss">
@use "@/styles/settings.scss";
@use "sass:map";

.state-icon {
    width: map.get(settings.$avatar-sizes, "large");
    height: map.get(settings.$avatar-sizes, "large");
}
</style>
