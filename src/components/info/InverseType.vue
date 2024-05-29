<template>
    <span class="text-high-emphasis">
        <template v-if="type != undefined">
            {{ type.inverseName }}
            <v-tooltip activator="parent" location="bottom">
                {{ type.description }}
            </v-tooltip>
        </template>
        <template v-else> [No type] </template>
    </span>
</template>
<script setup lang="ts">
import { PropType } from "vue";

defineProps({
    type: {
        type: Object as PropType<{ inverseName: string; description: string }>,
        required: false
    }
});
</script>
