<template>
    <div class="pa-4 h-100 overflow-y-auto">
        <DetailCompartment name="Danger Zone" color="error-container">
            <DefaultButton color="error">
                Delete IMS
                <ConfirmationDialog
                    title="Delete IMS"
                    message="Are you sure you want to delete this IMS? This deletes all associated IMS projects."
                    confirm-text="Delete IMS"
                    @confirm="deleteIMS"
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
const imsId = computed(() => route.params.ims as string);

async function deleteIMS() {
    await client.deleteIMS({ id: imsId.value });
    router.push({ name: "home" });
}
</script>
