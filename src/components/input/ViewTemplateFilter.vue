<template>
    <v-btn-toggle class="segmented-button" mandatory v-model="filterEnabled">
        <v-btn :prepend-icon="filterEnabled == 0 ? 'mdi-check' : 'mdi-filter-off'"> All components </v-btn>
        <v-btn :prepend-icon="filterEnabled == 1 ? 'mdi-check' : 'mdi-filter'"> Filter by component template </v-btn>
    </v-btn-toggle>
    <div v-if="filterEnabled == 1" class="d-grid filter-container mt-4">
        <v-checkbox
            v-for="entry in templates"
            :model-value="model.has(entry.id)"
            @update:model-value="$event ? model.add(entry.id) : model.delete(entry.id)"
            :key="entry.id"
            :label="entry.name"
            hide-details
        />
    </div>
</template>
<script lang="ts" setup>
import { computed, PropType, ref } from "vue";

const props = defineProps({
    templates: {
        type: Array as PropType<
            {
                name: string;
                id: string;
            }[]
        >,
        required: true
    }
});

const model = defineModel({
    type: Object as PropType<Set<string>>,
    required: true
});

const filterEnabled = computed({
    get: () => (model.value.size > 0 ? 1 : 0),
    set: (value) => {
        if (value == 0) {
            model.value.clear();
        } else {
            model.value = new Set(props.templates.map((entry) => entry.id));
        }
    }
});
</script>
<style scoped>
.filter-container {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(225px, 1fr));
    gap: 0 10px;
}
</style>
