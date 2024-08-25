<template>
    <v-switch
        v-if="targetNode != undefined"
        :model-value="targetNode.isSyncOthersAllowed"
        @update:model-value="toggleSyncOthersAllowed($event ?? false)"
        label="Allow sync others"
        @click.stop
    />
    <ConfirmationDialog
        v-model="confirmationDialog"
        title="Allow sync others?"
        message="
            Caution: this will allow the sync to sync data of other users, e.g., issues and comments, to a remote issue management system.
            On the remove issue management system, it will look like you are the author of the data.
            This feature is intended for bot accounts, which sync data for users who do not
            have access to the remote issue management system or do not allow the sync to sync their data.
        "
        :activator="undefined"
        @confirm="updateSyncOthersAllowed(true)"
    />
</template>
<script setup lang="ts">
import { NodeReturnType, useClient } from "@/graphql/client";
import { withErrorMessage } from "@/util/withErrorMessage";
import { computedAsync } from "@vueuse/core";
import ConfirmationDialog from "../dialog/ConfirmationDialog.vue";
import { ref } from "vue";

const props = defineProps({
    target: {
        type: String,
        required: true
    }
});

const client = useClient();

const targetNode = computedAsync(
    async () => {
        return await withErrorMessage(async () => {
            return (
                await client.getSyncPermissionTarget({
                    id: props.target
                })
            ).node as NodeReturnType<"getSyncPermissionTarget", "IMS">;
        }, "Failed to get sync permission target");
    },
    null,
    { shallow: false }
);

const confirmationDialog = ref(false);

function toggleSyncOthersAllowed(value: boolean) {
    if (value) {
        confirmationDialog.value = true;
    } else {
        updateSyncOthersAllowed(false);
    }
}

function updateSyncOthersAllowed(value: boolean) {
    withErrorMessage(async () => {
        await client.updateSyncPermissions({
            input: {
                id: props.target,
                canSyncOthers: value
            }
        });
        targetNode.value!.isSyncOthersAllowed = value;
    }, "Failed to update sync others permission");
}
</script>
