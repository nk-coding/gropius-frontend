<template>
    <div class="pa-4 h-100 overflow-y-auto">
        <DetailCompartment name="Danger Zone" color="error-container">
            <DefaultButton color="error">
                Delete IMS project
                <ConfirmationDialog
                    title="Delete IMS project"
                    message="Are you sure you want to delete this IMS project?"
                    confirm-text="Delete IMS project"
                    @confirm="deleteIMSProject"
                />
            </DefaultButton>
        </DetailCompartment>
    </div>
</template>
<script lang="ts" setup>
import DetailCompartment from "@/components/DetailCompartment.vue";
import ConfirmationDialog from "@/components/dialog/ConfirmationDialog.vue";
import { useClient } from "@/graphql/client";
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

const client = useClient();
const route = useRoute();
const router = useRouter();
const imsProjectId = computed(() => route.params.project as string);

async function deleteIMSProject() {
    await client.deleteIMSProject({ id: imsProjectId.value });
    router.push({ name: "ims-projects", params: { trackable: route.params.trackable } });
}
</script>
