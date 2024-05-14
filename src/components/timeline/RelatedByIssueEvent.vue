<template>
    <DefaultIconTimelineItem icon="mdi-triangle" icon-size="x-small" :item="item">
        added an <span class="text-high-emphasis">incoming relation</span>
        <template v-if="item.relation?.type"> with type <Type :type="item.relation.initialType ?? undefined" /> </template>
        <template v-if="item.relation?.issue" #content>
            <Issue :issue="item.relation.issue" />
        </template>
    </DefaultIconTimelineItem>
</template>
<script setup lang="ts">
import { PropType } from "vue";
import { TimelineItemType } from "./TimelineItemBase.vue";
import DefaultIconTimelineItem from "./DefaultIconTimelineItem.vue";
import Issue from "../info/Issue.vue";
import Type from "../info/Type.vue";

defineProps({
    item: {
        type: Object as PropType<TimelineItemType<"RelatedByIssueEvent">>,
        required: true
    }
});
</script>
<style scoped>
:deep(.timeline-icon-wrapper > i) {
    transform: scale(0.8) rotate(-90deg);
}
</style>
