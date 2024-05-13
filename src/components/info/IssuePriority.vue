<template>
    <v-chip v-if="priority != undefined" color="primary" rounded="pill" prepend-icon="mdi-alert-rhombus-outline">
        {{ priority.name }}
        <v-tooltip activator="parent" location="bottom">
            {{ priority.description }}
        </v-tooltip>
    </v-chip>
    <span v-else class="priority-wrapper text-high-emphasis ml-1">No priority</span>
</template>
<script setup lang="ts">
import { DefaultIssuePriorityInfoFragment } from "@/graphql/generated";
import { PropType } from "vue";

defineProps({
    priority: {
        type: Object as PropType<DefaultIssuePriorityInfoFragment>,
        required: false
    }
});
</script>
<style scoped>
.priority-wrapper {
    display: inline-block;
}
</style>
