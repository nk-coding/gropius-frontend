<template>
    <DefaultIconTimelineItem icon="mdi-delete" :item="item">
        removed an <span class="text-high-emphasis">incoming relation</span>
        <template v-if="item.removedRelation?.type">
            with type <InverseType :type="item.removedRelation.type" />
        </template>
        <template v-if="item.removedRelation?.issue" #content>
            <Issue :issue="item.removedRelation.issue" />
        </template>
    </DefaultIconTimelineItem>
</template>
<script setup lang="ts">
import { PropType } from "vue";
import { TimelineItemType } from "./TimelineItemBase.vue";
import DefaultIconTimelineItem from "./DefaultIconTimelineItem.vue";
import Issue from "../info/Issue.vue";
import InverseType from "../info/InverseType.vue";

defineProps({
    item: {
        type: Object as PropType<TimelineItemType<"RemovedIncomingRelationEvent">>,
        required: true
    }
});
</script>
