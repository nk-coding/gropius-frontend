<template>
    <div class="pa-4 h-100 overflow-y-auto">
        <DetailCompartment name="Danger Zone" color="error-container">
            <DefaultButton color="error">
                Delete interface specification
                <ConfirmationDialog
                    title="Delete interface specification"
                    message="Are you sure you want to delete this interface specification? This deletes all associated interfaces and relations."
                    confirm-text="Delete interface specification"
                    @confirm="deleteInterfaceSpecification"
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
const interfaceSpecificationId = computed(() => route.params.interfaceSpecification as string);

async function deleteInterfaceSpecification() {
    await client.deleteInterfaceSpecification({ id: interfaceSpecificationId.value });
    router.push({ name: "component-details-interfaces", params: { trackable: route.params.trackable } });
}
</script>
