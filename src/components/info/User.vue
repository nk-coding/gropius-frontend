<template>
    <span class="user-wrapper">
        <img
            v-if="showAvatar"
            :src="user.avatar"
            class="rounded-circle avatar inline-avatar"
            :class="{
                [`avatar--size-${size}`]: true
            }"
        />
        <span v-if="showName" class="text-high-emphasis" :class="{ 'ml-1': showAvatar }">{{ user.displayName }}</span>
        <v-tooltip v-if="showTooltip" activator="parent" location="top" class="rich-tooltip">
            <img :src="user.avatar" class="rounded-circle overlay-avatar" />
            <div class="d-flex text-body-1 text-on-surface">
                <span class="text-on-surface">{{ user.displayName }}</span>
                <span v-if="user.username" class="text-medium-emphasis">
                    &nbsp;·
                    {{ user.username }}
                </span>
            </div>
        </v-tooltip>
    </span>
</template>
<script setup lang="ts">
import { DefaultUserInfoFragment } from "@/graphql/generated";
import { PropType } from "vue";

defineProps({
    user: {
        type: Object as PropType<DefaultUserInfoFragment>,
        required: true
    },
    showAvatar: {
        type: Boolean,
        required: false,
        default: true
    },
    showName: {
        type: Boolean,
        required: false,
        default: true
    },
    showTooltip: {
        type: Boolean,
        required: false,
        default: true
    },
    size: {
        type: String,
        required: false,
        default: "default"
    }
});
</script>
<style scoped lang="scss">
@use "@/styles/settings.scss";

.avatar {
    @each $name, $value in settings.$avatar-sizes {
        &--size-#{$name} {
            width: $value;
            height: $value;
        }
    }
}

.overlay-avatar {
    height: 50px;
}

.inline-avatar {
    vertical-align: middle;
    display: inline;
}

.user-wrapper {
    display: inline-block;
}
</style>
