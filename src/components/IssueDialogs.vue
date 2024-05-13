<template>
    <CreateIssueDialog :trackable="trackableId" @created-issue="(issue: IdObject) => selectIssue(issue)" />
    <ImportIssueDialog :trackable="trackableId" @imported-issue="(issue: IdObject) => selectIssue(issue)" />
</template>
<script lang="ts" setup>
import { IdObject } from "@/util/types";
import { computed } from "vue";
import { useRouter, useRoute, RouteLocationRaw } from "vue-router";
import CreateIssueDialog from "./dialog/CreateIssueDialog.vue";
import ImportIssueDialog from "./dialog/ImportIssueDialog.vue";

const router = useRouter();
const route = useRoute();

const trackableId = computed(() => route.params.trackable as string);

function selectIssue(issue: IdObject) {
    router.push(issueRoute(issue));
}

function issueRoute(issue: IdObject): RouteLocationRaw {
    return {
        name: (route.name as string).replace(/s$/, ""),
        params: { issue: issue.id, trackable: trackableId.value }
    };
}
</script>
