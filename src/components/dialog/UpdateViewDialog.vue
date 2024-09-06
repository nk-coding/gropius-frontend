<template>
    <v-dialog v-model="updateViewDialog" persistent width="auto">
        <ViewDialogContent
            v-if="cachedModel != undefined"
            title="Update view"
            discard-title="Discard changes?"
            discard-message="Are you sure you want to discard the changes?"
            submit-action="Update view"
            :initial-value="cachedModel"
            :submit-disabled="submitDisabled"
            :templates="templates"
            @submit="updateView"
            @cancel="updateViewDialog = false"
        />
    </v-dialog>
</template>
<script lang="ts" setup>
import { useClient } from "@/graphql/client";
import { PropType } from "vue";
import { useBlockingWithErrorMessage } from "@/util/withErrorMessage";
import ViewDialogContent, { View } from "./ViewDialogContent.vue";
import { computed } from "vue";
import { IdObject } from "@/util/types";
import { useCachedRef } from "@/util/useCachedRef";

const updateViewDialog = computed({
    get: () => model.value != null,
    set: (value) => {
        if (!value) {
            model.value = null;
        }
    }
});
const client = useClient();
const [blockWithErrorMessage, submitDisabled] = useBlockingWithErrorMessage();

const emit = defineEmits<{
    (event: "updated-view", view: IdObject): void;
}>();

defineProps({
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
    type: Object as PropType<(View & IdObject) | null>,
    required: false
});

const cachedModel = useCachedRef(model);

async function updateView(state: View) {
    const view = await blockWithErrorMessage(async () => {
        const res = await client.updateView({
            input: {
                ...state,
                id: model.value!.id
            }
        });
        return res.updateView.view;
    }, "Error updating view");
    updateViewDialog.value = false;
    emit("updated-view", view);
}
</script>
