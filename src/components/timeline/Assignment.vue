<template>
    <DefaultIconTimelineItem icon="mdi-account" :item="item">
        assigned <User :user="item.user" />
        <template v-if="item.type">as <Type :type="item.initialType ?? undefined" /></template>
    </DefaultIconTimelineItem>
</template>
<script setup lang="ts">
import { PropType } from "vue";
import { TimelineItemType } from "./TimelineItemBase.vue";
import DefaultIconTimelineItem from "./DefaultIconTimelineItem.vue";
import Type from "../info/Type.vue";
import User from "@/components/info/User.vue";

defineProps({
    item: {
        type: Object as PropType<TimelineItemType<"Assignment">>,
        required: true
    }
});
</script>
