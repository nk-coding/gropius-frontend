<template>
    <div class="pa-4 h-100 overflow-y-auto">
        <DetailCompartment name="Danger Zone" color="error-container">
            <DefaultButton color="error">
                Delete component
                <ConfirmationDialog
                    title="Delete component"
                    message="Are you sure you want to delete this component? This deletes all associated versions, interfaces, and relations. Further, all issues only present on this component are deleted."
                    confirm-text="Delete component"
                    @confirm="deleteComponent"
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
const componentId = computed(() => route.params.trackable as string);

async function deleteComponent() {
    await client.deleteComponent({ id: componentId.value });
    router.push({ name: "home" });
}
</script>
