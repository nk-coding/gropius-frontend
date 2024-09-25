<template>
    <div class="pa-4 h-100 overflow-y-auto">
        <DetailCompartment name="Danger Zone" color="error-container">
            <DefaultButton color="error">
                Delete interface specification version
                <ConfirmationDialog
                    title="Delete interface specification version"
                    message="Are you sure you want to delete this interface specification version? This deletes all associated interfaces and relations."
                    confirm-text="Delete interface specification version"
                    @confirm="deleteInterfaceSpecificationVersion"
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
const interfaceSpecificationVersionId = computed(() => route.params.interfaceSpecificationVersion as string);

async function deleteInterfaceSpecificationVersion() {
    await client.deleteInterfaceSpecificationVersion({ id: interfaceSpecificationVersionId.value });
    router.push({
        name: "interface-specification-versions",
        params: {
            trackable: route.params.trackable,
            interfaceSpecification: route.params.interfaceSpecification
        }
    });
}
</script>
