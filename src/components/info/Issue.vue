<template>
    <div class="d-flex align-center">
        <IssueIcon :issue="issue" class="issue-icon mr-1 flex-0-0" />
        <span class="flex-1-1-0 text-ellipsis">
            <CustomRouterLink :to="issueLocation" :text="issue.title" class="text-high-emphasis" />
            <br />
            <span class="text-medium-emphasis text-body-2">
                <template v-for="(trackable, idx) in issue.trackables.nodes">
                    <Trackable :trackable="trackable" class="text-medium-emphasis text-body-2" />
                    <span v-if="idx < issue.trackables.nodes.length - 1">, </span>
                </template>
            </span>
        </span>
    </div>
</template>
<script setup lang="ts">
import { DefaultIssueInfoFragment } from "@/graphql/generated";
import { PropType, computed } from "vue";
import IssueIcon from "../IssueIcon.vue";
import Trackable from "./Trackable.vue";
import { RouteLocationRaw } from "vue-router";
import CustomRouterLink from "../CustomRouterLink.vue";

const props = defineProps({
    issue: {
        type: Object as PropType<DefaultIssueInfoFragment>,
        required: true
    }
});

const issueLocation = computed<RouteLocationRaw>(() => {
    const firstTrackable = props.issue.trackables.nodes[0];
    return {
        name: firstTrackable.__typename === "Component" ? "component-issue" : "project-issue",
        params: {
            issue: props.issue.id,
            trackable: firstTrackable.id
        }
    };
});
</script>
<style scoped lang="scss">
@use "@/styles/settings.scss";
@use "sass:map";

.issue-wrapper {
    display: inline-block;
}

$icon-size: 2.25em;

.issue-icon {
    vertical-align: middle;
    display: inline;
    width: $icon-size;
    height: $icon-size;
}
</style>
