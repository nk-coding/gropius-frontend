<template>
    <BaseLayout :title-segments="titleSegments" :tabs="[]" :right-sidebar-items="[]" :left-sidebar-items="[]">
        <template #content>
            <router-view />
        </template>
    </BaseLayout>
</template>
<script lang="ts" setup>
import BaseLayout from "@/components/BaseLayout.vue";
import { computed } from "vue";

const titleSegments = computed(() => [
    { name: "Gropius", path: "/" },
    { name: "GraphiQL", path: "/graphiql" }
]);
</script>
