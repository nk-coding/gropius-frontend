<template>
    <PaginatedList
        name="issues"
        :item-manager="itemManager"
        :sort-fields="issueSortFields"
        :to="(issue: Issue) => issueRoute(issue)"
        :sort-ascending-initially="false"
        :dependencies="[stateFilterInput]"
        query-param-prefix=""
    >
        <template #item="{ item }">
            <IssueListItem :item="item" />
        </template>
        <template #search-append>
            <IssueStateSegmentedButton v-model="issueStateIndices" class="ml-2" />
        </template>
        <IssueDialogs />
    </PaginatedList>
</template>
<script lang="ts" setup>
import { NodeReturnType, useClient } from "@/graphql/client";
import { computed } from "vue";
import { RouteLocationRaw, useRoute, useRouter } from "vue-router";
import PaginatedList, { ItemManager } from "@/components/PaginatedList.vue";
import { IssueOrder, IssueOrderField, ProjectComponentIssueListItemInfoFragment } from "@/graphql/generated";
import IssueListItem from "@/components/IssueListItem.vue";
import IssueStateSegmentedButton from "@/components/input/IssueStateSegmentedButton.vue";
import { IdObject } from "@/util/types";
import IssueDialogs from "@/components/IssueDialogs.vue";
import { issueSortFields } from "@/util/issueSortFields";

type Project = NodeReturnType<"getComponentIssueList", "Project">;
type Issue = ProjectComponentIssueListItemInfoFragment;

const client = useClient();
const router = useRouter();
const route = useRoute();

const issueStateIndices = computed({
    get: () => {
        const state = (route.query.state as string) ?? "open";
        if (state == "open") {
            return [0];
        } else if (state == "closed") {
            return [1];
        } else {
            return [0, 1];
        }
    },
    set: (value: number[]) => {
        const state = value.length == 1 ? ["open", "closed"][value[0]] : "all";
        router.replace({ query: { ...route.query, state } });
    }
});

const stateFilterInput = computed(() => {
    if (issueStateIndices.value.length != 1) {
        return undefined;
    }
    const state = issueStateIndices.value[0] == 0;
    return { isOpen: { eq: state } };
});

const trackableId = computed(() => route.params.trackable as string);

const itemManager: ItemManager<Issue, IssueOrderField> = {
    fetchItems: async function (
        filter: string | undefined,
        orderBy: IssueOrder[],
        count: number,
        page: number
    ): Promise<[Issue[], number]> {
        if (filter == undefined) {
            const res = await client.getComponentIssueList({
                orderBy,
                count,
                skip: page * count,
                project: trackableId.value,
                filter: { state: stateFilterInput.value }
            });
            const issues = (res.node as Project).componentIssues;
            return [issues.nodes, issues.totalCount];
        } else {
            const res = await client.getComponentFilteredIssueList({
                query: filter,
                count,
                project: trackableId.value,
                filter: { state: stateFilterInput.value }
            });
            return [res.searchIssues, res.searchIssues.length];
        }
    }
};

function issueRoute(issue: Issue): RouteLocationRaw {
    const trackable = issue.trackables.nodes[0];
    return {
        name: trackable.__typename == "Component" ? "component-issue" : "project-issue",
        params: { issue: issue.id, trackable: trackable.id }
    };
}
</script>
