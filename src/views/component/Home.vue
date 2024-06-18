<template>
    <div class="pa-4 h-100 d-flex flex-column" v-if="component != undefined">
        <div class="text-h4">{{ component.name }}</div>
        <div class="text-body-1 mt-2">{{ component.description }}</div>
        <v-sheet
            class="pa-4 mt-5 pinned-issues-sheet d-flex flex-column"
            rounded="lger"
            color="surface-elevated-2"
            :elevation="0"
            :class="{
                'flex-shrink-0': component.pinnedIssues.nodes.length == 0
            }"
        >
            <div class="text-h6 mb-2">Pinned issues</div>
            <div v-if="component.pinnedIssues.nodes.length == 0" class="text-medium-emphasis">No pinned issues</div>
            <div v-else class="overflow-y-auto flex-shrink-1">
                <CustomList :items="component.pinnedIssues.nodes" :to="issueRoute">
                    <template #item="{ item }">
                        <IssueListItem :item="item" />
                    </template>
                </CustomList>
            </div>
        </v-sheet>
        <v-sheet
            class="pa-4 mt-5 overflow-hidden d-flex flex-column"
            rounded="lger"
            color="surface-elevated-2"
            :elevation="0"
            :class="{
                'flex-shrink-0': component.issues.nodes.length == 0
            }"
        >
            <div class="d-flex align-center mb-2">
                <div class="text-h6">Recent issues</div>
                <v-spacer />
                <IconButton :to="issuesRoute">
                    <v-icon icon="mdi-arrow-right-circle-outline" />
                    <v-tooltip activator="parent">View all issues</v-tooltip>
                </IconButton>
            </div>
            <div v-if="component.issues.nodes.length == 0" class="text-medium-emphasis">No issues</div>
            <div v-else class="overflow-y-auto flex-shrink-1">
                <CustomList :items="component.issues.nodes" :to="issueRoute">
                    <template #item="{ item }">
                        <IssueListItem :item="item" />
                    </template>
                </CustomList>
            </div>
        </v-sheet>
    </div>
</template>
<script lang="ts" setup>
import CustomList from "@/components/CustomList.vue";
import IssueListItem from "@/components/IssueListItem.vue";
import { NodeReturnType, useClient } from "@/graphql/client";
import { IdObject } from "@/util/types";
import { withErrorMessage } from "@/util/withErrorMessage";
import { computedAsync } from "@vueuse/core";
import { computed } from "vue";
import { RouteLocationRaw, useRoute } from "vue-router";

const client = useClient();
const route = useRoute();
const componentId = computed(() => route.params.trackable as string);

const component = computedAsync(
    async () => {
        if (!componentId.value) {
            return null;
        }
        const res = await withErrorMessage(
            () => client.getComponentDetails({ id: componentId.value }),
            "Error loading component details"
        );
        return res.node as NodeReturnType<"getComponentDetails", "Component">;
    },
    null,
    { shallow: false }
);

function issueRoute(issue: IdObject): RouteLocationRaw {
    return {
        name: "component-issue",
        params: { issue: issue.id, trackable: componentId.value }
    };
}

const issuesRoute = computed(() => ({
    name: "component-issues",
    params: { trackable: componentId.value }
}));
</script>
<style scoped>
.pinned-issues-sheet {
    overflow: hidden;
    max-height: 25vh;
}
</style>
