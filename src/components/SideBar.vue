<template>
    <div class="d-flex flex-column">
        <div v-for="(itemGroup, idx) in items" :key="idx" class="d-flex flex-column align-center w-100">
            <div v-if="idx > 0" class="mx-3 mb-3 mt-1 align-self-stretch">
                <v-divider></v-divider>
            </div>
            <div v-for="(item, index) in itemGroup" :key="index" class="sidebar-item mb-2">
                <SideBarButton
                    v-if="'name' in item"
                    :icon="item.icon"
                    :text="item.name"
                    :color="item.color"
                    :to="item.to"
                ></SideBarButton>
                <FAB
                    v-else
                    :color="`${item.color}-container`"
                    elevation="0"
                    :disabled="item.disabled"
                    @click="item.onClick"
                >
                    <v-icon class="fab-icon" :icon="item.icon" />
                    <v-tooltip v-if="item.description" activator="parent" location="bottom">{{
                        item.description
                    }}</v-tooltip>
                </FAB>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import { PropType } from "vue";
import SideBarButton from "./SideBarButton.vue";
import { RouteLocationRaw } from "vue-router";

export interface BaseSideBarItem {
    color?: string;
    icon: string;
}

export interface FABSideBarItem extends BaseSideBarItem {
    description?: string;
    onClick: () => void;
    disabled?: boolean;
}

export interface IconSideBarItem extends BaseSideBarItem {
    name: string;
    to: RouteLocationRaw;
    exact?: boolean;
}

export type SideBarItem = FABSideBarItem | IconSideBarItem;

const props = defineProps({
    items: {
        type: Array as PropType<SideBarItem[][]>,
        default: () => []
    }
});
</script>
<style scoped>
.fab-icon {
    --v-icon-size-multiplier: 1;
}
</style>
