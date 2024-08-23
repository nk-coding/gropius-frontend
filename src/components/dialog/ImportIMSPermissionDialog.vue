<template>
    <v-dialog v-model="importIMSPermissionDialog" persistent width="auto">
        <ImportDialogContent
            item-name="ims permission"
            confirmation-message="Import permission"
            :submit-disabled="submitDisabled"
            @cancel="importIMSPermissionDialog = false"
            @import="importIMSPermission($event as IdObject)"
        >
            <template #select="{ selectedItem }">
                <ExternalIMSPermissionAutocomplete
                    hide-details
                    autofocus
                    menu-mode="repeating"
                    :menu-delay="350"
                    @selected-item="selectedItem"
                />
            </template>
            <template #display="{ item }">
                <Permission :permission="<DefaultImsPermissionInfoFragment>item" />
            </template>
        </ImportDialogContent>
    </v-dialog>
</template>
<script setup lang="ts">
import { useClient } from "@/graphql/client";
import { onEvent } from "@/util/eventBus";
import { ref } from "vue";
import ImportDialogContent from "./ImportDialogContent.vue";
import ExternalIMSPermissionAutocomplete from "../input/ExternalIMSPermissionAutocomplete.vue";
import { DefaultImsPermissionInfoFragment } from "@/graphql/generated";
import { useBlockingWithErrorMessage, withErrorMessage } from "@/util/withErrorMessage";
import Permission from "../info/Permission.vue";
import { IdObject } from "@/util/types";

const importIMSPermissionDialog = ref(false);
const client = useClient();
const [blockWithErrorMessage, submitDisabled] = useBlockingWithErrorMessage();

const emit = defineEmits<{
    (event: "imported-ims-permission", imsPermission: IdObject): void;
}>();

const props = defineProps({
    ims: {
        type: String,
        required: true
    }
});

onEvent("import-permission", () => {
    importIMSPermissionDialog.value = true;
});

async function importIMSPermission(imsPermission: IdObject) {
    blockWithErrorMessage(async () => {
        await client.addIMSPermissionToIMS({
            imsPermission: imsPermission.id,
            ims: props.ims
        });
        importIMSPermissionDialog.value = false;
        emit("imported-ims-permission", imsPermission);
    }, "Error importing imspermission");
}
</script>
