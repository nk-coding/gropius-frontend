<template>
    <v-dialog v-model="createViewDialog" persistent width="auto">
        <ViewDialogContent
            title="Create view"
            discard-title="Discard view?"
            discard-message="Are you sure you want to discard this view?"
            submit-action="Create view"
            :initial-value="initialValue"
            :submit-disabled="submitDisabled"
            :templates="templates"
            @submit="createView"
            @cancel="createViewDialog = false"
        />
    </v-dialog>
</template>
<script lang="ts" setup>
import { onEvent } from "@/util/eventBus";
import { useClient } from "@/graphql/client";
import { computed, PropType, ref } from "vue";
import { useBlockingWithErrorMessage } from "@/util/withErrorMessage";
import ViewDialogContent, { View } from "./ViewDialogContent.vue";
import { IdObject } from "@/util/types";
import { CreateViewInput } from "@/graphql/generated";

const createViewDialog = ref(false);
const client = useClient();
const [blockWithErrorMessage, submitDisabled] = useBlockingWithErrorMessage();

const emit = defineEmits<{
    (event: "created-view", view: IdObject): void;
}>();

const props = defineProps({
    project: {
        type: String,
        required: true
    },
    templates: {
        type: Array as PropType<
            {
                name: string;
                id: string;
            }[]
        >,
        required: true
    },
    initialTemplates: {
        type: Array as PropType<string[]>,
        default: () => [],
        required: false
    },
    layouts: {
        type: Object as PropType<Pick<CreateViewInput, "relationLayouts" | "relationPartnerLayouts">>,
        default: () => ({}),
        required: false
    }
});

const initialValue = computed<View>(() => ({
    name: "",
    description: "",
    filterByTemplate: props.initialTemplates
}));

onEvent("create-view", () => {
    createViewDialog.value = true;
});

async function createView(state: View) {
    const view = await blockWithErrorMessage(async () => {
        const res = await client.createView({
            input: {
                ...state,
                project: props.project,
                ...props.layouts
            }
        });
        return res.createView.view;
    }, "Error creating view");
    createViewDialog.value = false;
    emit("created-view", view);
}
</script>
