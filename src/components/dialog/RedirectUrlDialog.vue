<template>
    <v-dialog v-model="showDialog" width="auto">
        <v-card
            v-if="cachedModel"
            color="surface-elevated-3"
            rounded="lger"
            class="pa-3 pb-5 redirect-url-dialog"
            elevation="0"
        >
            <div class="d-flex align-center">
                <v-card-title class="pl-4">Callback URL</v-card-title>
                <v-spacer />
                <IconButton @click="showDialog = false">
                    <v-icon icon="mdi-close" />
                    <v-tooltip activator="parent">Close</v-tooltip>
                </IconButton>
            </div>
            <CopyText v-if="cachedModel != undefined" :model-value="cachedModel" />
        </v-card>
    </v-dialog>
</template>
<script lang="ts" setup>
import { computed, ref } from "vue";
import CopyText from "@/components/CopyText.vue";
import { useCachedRef } from "@/util/useCachedRef";

const showDialog = computed({
    get: () => model.value != null,
    set: (value) => {
        if (!value) {
            model.value = undefined;
        }
    }
});

const model = defineModel({
    type: String,
    required: false
});

const cachedModel = useCachedRef(model);
</script>
<style scoped lang="scss">
@use "@/styles/settings.scss";
.redirect-url-dialog {
    width: min(700px, calc(100vw - 3 * settings.$side-bar-width));
}

.wrap-input {
    min-width: 250px;
}
</style>
