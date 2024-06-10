<template>
    <FetchingAutocomplete
        mode="add-context"
        :fetch="searchIssues"
        :context-fetch="searchTrackables"
        :label="label"
        placeholder="Search component/project"
        :item-title="(item: any) => item.name ?? item.title"
        :initial-context="initialContext"
    >
        <template #item="{ props, item }">
            <v-list-item :title="item.raw.title" :subtitle="generateSubtitle(item.raw)" v-bind="props">
                <template #prepend>
                    <IssueIcon :issue="item.raw" class="issue-icon mr-2" />
                </template>
            </v-list-item>
        </template>
        <template #context-item="{ props, item }">
            <v-list-item :title="item.raw.name" :subtitle="item.raw.description" v-bind="props"> </v-list-item>
        </template>
    </FetchingAutocomplete>
</template>
<script setup lang="ts">
import { NodeReturnType, useClient } from "@/graphql/client";
import { DefaultIssueInfoFragment, DefaultTrackableInfoFragment } from "@/graphql/generated";
import { withErrorMessage } from "@/util/withErrorMessage";
import FetchingAutocomplete from "./FetchingAutocomplete.vue";
import { transformSearchQuery } from "@/util/searchQueryTransformer";
import IssueIcon from "../IssueIcon.vue";
import { PropType } from "vue";

const props = defineProps({
    label: {
        type: String,
        required: false,
        default: "Issue"
    },
    initialContext: {
        type: Object as PropType<Readonly<DefaultTrackableInfoFragment>>,
        required: false
    },
    ignore: {
        type: Array as PropType<string[]>,
        required: false,
        default: () => []
    }
});

const client = useClient();

function generateSubtitle(issue: DefaultIssueInfoFragment): string {
    return issue.trackables.nodes.map((trackable) => trackable.name).join(", ");
}

async function searchIssues(
    filter: string,
    count: number,
    context?: DefaultTrackableInfoFragment
): Promise<DefaultIssueInfoFragment[]> {
    const searchRes = await withErrorMessage(async () => {
        const query = transformSearchQuery(filter);
        if (query != undefined) {
            const res = await client.searchIssues({ query, count, trackable: context!.id });
            return res.searchIssues;
        } else {
            const res = await client.firstIssues({ trackable: context!.id, count });
            return (res.node as NodeReturnType<"firstIssues", "Component">).issues.nodes;
        }
    }, "Error searching issues");
    const ignoredIds = new Set(props.ignore);
    return searchRes.filter((item) => !ignoredIds.has(item.id));
}

async function searchTrackables(filter: string, count: number): Promise<DefaultTrackableInfoFragment[]> {
    return await withErrorMessage(async () => {
        const query = transformSearchQuery(filter);
        if (query != undefined) {
            const res = await client.searchTrackables({ query, count });
            return res.searchTrackables;
        } else {
            return [];
        }
    }, "Error searching trackables");
}
</script>
<style scoped lang="scss">
@use "@/styles/settings.scss";
@use "sass:map";

.issue-icon {
    width: map.get(settings.$avatar-sizes, "large");
    height: map.get(settings.$avatar-sizes, "large");
}
</style>
