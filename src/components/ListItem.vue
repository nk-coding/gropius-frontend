<template>
    <div class="d-flex align-center my-2">
        <slot name="prepend" />
        <div class="flex-1-1 min-width-0">
            <div class="mb-1 d-flex align-center">
                <slot name="title">
                    <slot name="title-prepend" />
                    <v-list-item-title>{{ title }}</v-list-item-title>
                    <slot name="title-append" />
                </slot>
            </div>
            <slot name="subtitle">
                <div
                    class="text-medium-emphasis text-body-2 text-ellipsis"
                    :class="{
                        'font-italic': italicSubtitle
                    }"
                >
                    {{ subtitle }}
                </div>
            </slot>
            <slot name="append-line" />
        </div>
        <slot name="append" />
    </div>
</template>
<script lang="ts" setup>
defineProps({
    title: {
        type: String,
        required: false,
        default: ""
    },
    subtitle: {
        type: String,
        required: false,
        default: ""
    },
    italicSubtitle: {
        type: Boolean,
        required: false,
        default: false
    }
});
</script>
<style scoped>
.min-width-0 {
    min-width: 0;
}
</style>
