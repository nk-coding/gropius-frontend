<template>
    <PaginatedList
        name="issues"
        :item-manager="itemManager"
        :sort-fields="Object.keys(sortFields)"
        :to="(issue: Issue) => issueRoute(issue)"
        :sort-ascending-initially="false"
        :dependencies="[stateFilterInput]"
    >
        <template #item="{ item }">
            <IssueListItem :item="item" />
        </template>
        <template #search-append>
            <IssueStateSegmentedButton v-model="issueStateIndices" />
        </template>
        <IssueDialogs />
    </PaginatedList>
</template>
<script lang="ts" setup>
import { NodeReturnType, useClient } from "@/graphql/client";
import { computed, ref } from "vue";
import { RouteLocationRaw, useRoute, useRouter } from "vue-router";
import PaginatedList, { ItemManager } from "@/components/PaginatedList.vue";
import { IssueListItemInfoFragment, IssueOrderField, OrderDirection } from "@/graphql/generated";
import IssueListItem from "@/components/IssueListItem.vue";
import IssueStateSegmentedButton from "@/components/input/IssueStateSegmentedButton.vue";
import { IdObject } from "@/util/types";
import IssueDialogs from "@/components/IssueDialogs.vue";

type Trackable = NodeReturnType<"getIssueList", "Component">;
type Issue = IssueListItemInfoFragment;

const client = useClient();
const router = useRouter();
const route = useRoute();

const issueStateIndices = ref([0]);

const stateFilterInput = computed(() => {
    if (issueStateIndices.value.length != 1) {
        return undefined;
    }
    const state = issueStateIndices.value[0] == 0;
    return { isOpen: { eq: state } };
});

const trackableId = computed(() => route.params.trackable as string);

const sortFields = {
    Updated: IssueOrderField.LastUpdatedAt,
    Created: IssueOrderField.CreatedAt,
    Title: IssueOrderField.Title
};

const itemManager: ItemManager<Issue, keyof typeof sortFields> = {
    fetchItems: async function (
        filter: string | undefined,
        sortField: keyof typeof sortFields,
        sortAscending: boolean,
        count: number,
        page: number
    ): Promise<[Issue[], number]> {
        if (filter == undefined) {
            const res = await client.getIssueList({
                orderBy: {
                    field: sortFields[sortField],
                    direction: sortAscending ? OrderDirection.Asc : OrderDirection.Desc
                },
                count,
                skip: page * count,
                trackable: trackableId.value,
                stateFilter: stateFilterInput.value
            });
            const issues = (res.node as Trackable).issues;
            return [issues.nodes, issues.totalCount];
        } else {
            const res = await client.getFilteredIssueList({
                query: filter,
                count,
                trackable: trackableId.value,
                stateFilter: stateFilterInput.value
            });
            return [res.searchIssues, res.searchIssues.length];
        }
    }
};

function issueRoute(issue: IdObject): RouteLocationRaw {
    return {
        name: (route.name as string).slice(0, -1),
        params: { issue: issue.id, trackable: trackableId.value }
    };
}
</script>
