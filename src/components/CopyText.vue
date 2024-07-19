<template>
    <div class="ml-4 my-4 d-flex align-center">
        <v-text-field :model-value="modelValue" readonly hide-details />
        <IconButton v-if="isSecureContext" @click="copyToClipboard()" class="ml-1" density="default">
            <v-icon
                :icon="showSuccessIcon ? 'mdi-check' : 'mdi-content-copy'"
                :color="showSuccessIcon ? 'success' : 'tertiary'"
            />
            <v-tooltip activator="parent">Copy to clipboard</v-tooltip>
        </IconButton>
    </div>
</template>
<script lang="ts" setup>
import { ref } from "vue";

const props = defineProps({
    modelValue: {
        type: String,
        required: true
    }
});

const showSuccessIcon = ref(false);
const lastTimeout = ref<number>();
const isSecureContext = window.isSecureContext;

function copyToClipboard() {
    navigator.clipboard.writeText(props.modelValue);
    showSuccessIcon.value = true;
    if (lastTimeout.value != undefined) {
        window.clearTimeout(lastTimeout.value);
    }
    lastTimeout.value = window.setTimeout(() => {
        showSuccessIcon.value = false;
        lastTimeout.value = undefined;
    }, 1000);
}
</script>
