<template>
    <v-list-item
        class="px-0 py-2"
        :title="permission.name"
        :subtitle="permission.description || 'No description provided'"
    >
        <template #title>
            <v-list-item-title class="mb-1">{{ permission.name }}</v-list-item-title>
        </template>
    </v-list-item>
    <div class="d-flex flex-wrap chip-container">
        <v-chip
            v-for="(entry, index) in permission.entries"
            :key="index"
            color="primary"
            size="small"
            class="flex-shrink-0"
        >
            {{ enumToRegularCase(entry) }}
        </v-chip>
    </div>
</template>
<script setup lang="ts">
import { enumToRegularCase } from "@/util/casingTransformers";
import { PropType } from "vue";

defineProps({
    permission: {
        type: Object as PropType<{ name: string; description: string; entries: string[] }>,
        required: true
    }
});
</script>
<style scoped>
.chip-container {
    row-gap: 0.5rem;
    column-gap: 0.25rem;
}
</style>
