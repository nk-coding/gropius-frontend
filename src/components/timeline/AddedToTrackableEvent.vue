<template>
    <DefaultIconTimelineItem :icon="affectedByIssueIcon(item.addedToTrackable?.__typename ?? 'Component')" :item="item">
        added this issue to <AffectedByIssue v-if="item.addedToTrackable" :affected-entity="item.addedToTrackable!" />
        <template v-else> a component or project </template>
    </DefaultIconTimelineItem>
</template>
<script setup lang="ts">
import { PropType } from "vue";
import { TimelineItemType } from "./TimelineItemBase.vue";
import DefaultIconTimelineItem from "./DefaultIconTimelineItem.vue";
import AffectedByIssue from "../info/AffectedByIssue.vue";
import { affectedByIssueIcon } from "@/util/affectedByIssueUtils";

defineProps({
    item: {
        type: Object as PropType<TimelineItemType<"AddedToTrackableEvent">>,
        required: true
    }
});
</script>
