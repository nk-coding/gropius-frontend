<template>
    <div class="pa-4 full-height">
        <DetailCompartment name="Danger Zone" color="error-container">
            <DefaultButton color="error">
                Delete component version
                <ConfirmationDialog
                    title="Delete component version"
                    message="Are you sure you want to delete this component version? This deletes all associated interfaces and relations."
                    confirm-text="Delete component version"
                    @confirm="deleteComponentVersion"
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
const componentVersionId = computed(() => route.params.version as string);

async function deleteComponentVersion() {
    await client.deleteComponentVersion({ id: componentVersionId.value });
    router.push({ name: "component-versions", params: { trackable: route.params.trackable } });
}
</script>
