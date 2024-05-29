<template>
    <DefaultIconTimelineItem icon="mdi-pencil" :item="item">
        changed the type of an <span class="text-high-emphasis">incoming relation</span> from
        <InverseType :type="item.oldRelationType ?? undefined" name="inverseName" /> to
        <InverseType :type="item.newRelationType ?? undefined" />
        <template v-if="item.issueRelation.issue" #content>
            <Issue :issue="item.issueRelation.issue" />
        </template>
    </DefaultIconTimelineItem>
</template>
<script setup lang="ts">
import { PropType } from "vue";
import { TimelineItemType } from "./TimelineItemBase.vue";
import DefaultIconTimelineItem from "./DefaultIconTimelineItem.vue";
import Issue from "../info/Issue.vue";

defineProps({
    item: {
        type: Object as PropType<TimelineItemType<"IncomingRelationTypeChangedEvent">>,
        required: true
    }
});
</script>
