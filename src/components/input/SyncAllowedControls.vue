<template>
    <v-switch v-model="target.isSyncSelfAllowed" label="Sync self" class="ml-10" @click.stop />
    <v-switch v-model="target.isSyncOthersAllowed" label="Sync others" class="ml-10" @click.stop />
</template>
<script setup lang="ts">
import { DefaultSyncPermissionTargetInfoFragment } from "@/graphql/generated";
import { PropType } from "vue";

defineProps({
    target: {
        type: Object as PropType<DefaultSyncPermissionTargetInfoFragment>,
        required: true
    }
});
</script>
