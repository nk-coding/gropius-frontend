<template>
    <v-switch
        v-model="target.isSyncSelfAllowed"
        @update:model-value="updateSyncSelfAllowed($event ?? false)"
        label="Allow sync self"
        class="ml-10"
        @click.stop
    />
</template>
<script setup lang="ts">
import { useClient } from "@/graphql/client";
import { DefaultSyncPermissionTargetInfoFragment } from "@/graphql/generated";
import { withErrorMessage } from "@/util/withErrorMessage";
import { PropType } from "vue";

const props = defineProps({
    target: {
        type: Object as PropType<DefaultSyncPermissionTargetInfoFragment>,
        required: true
    }
});

const client = useClient();

function updateSyncSelfAllowed(value: boolean) {
    withErrorMessage(async () => {
        await client.updateSyncPermissions({
            input: {
                id: props.target.id,
                canSyncSelf: value
            }
        });
    }, "Failed to update sync self permission");
}
</script>
