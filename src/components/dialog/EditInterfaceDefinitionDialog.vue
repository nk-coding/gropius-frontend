<template>
    <v-dialog v-model="editInterfaceDefinitionDialog" width="auto" height="auto">
        <v-card
            color="surface-elevated-3"
            rounded="lger"
            class="pa-3 pb-5 edit-interface-definition-dialog"
            elevation="0"
        >
            <div class="d-flex align-center">
                <v-card-title class="pl-4">Edit {{ `${cachedModel?.name} (v${cachedModel?.version})` }}</v-card-title>
                <v-spacer />
                <IconButton @click="editInterfaceDefinitionDialog = false">
                    <v-icon icon="mdi-close" />
                    <v-tooltip activator="parent">Close</v-tooltip>
                </IconButton>
            </div>
            <div class="ma-3" v-if="cachedModel != null">
                <v-switch
                    :model-value="cachedModel.visibleSelfDefined"
                    @update:model-value="toggleVisible($event ?? false)"
                    label="Visible"
                    class="mb-1"
                    :disabled="!interfaceSpecificationVisibilityInfo.visible"
                />
                <v-switch
                    :model-value="cachedModel.invisibleSelfDefined"
                    @update:model-value="toggleInvisible($event ?? false)"
                    label="Invisible"
                    class="mb-1"
                    :disabled="!interfaceSpecificationVisibilityInfo.invisible"
                />
            </div>
        </v-card>
        <ConfirmationDialog
            v-model="visibleConfirmationDialog"
            title="Disable visible?"
            message="This will delete all adjacent relations, and potentially stop interfaces from propagating to other components."
            :activator="undefined"
            @confirm="updateValue(true, false)"
        />
        <ConfirmationDialog
            v-model="invisibleConfirmationDialog"
            title="Disable invisible?"
            message="This will potentially stop interfaces from propagating to other components."
            :activator="undefined"
            @confirm="updateValue(false, false)"
        />
    </v-dialog>
</template>
<script setup lang="ts">
import { NodeReturnType, useClient } from "@/graphql/client";
import { useCachedRef } from "@/util/useCachedRef";
import { withErrorMessage } from "@/util/withErrorMessage";
import { computedAsync } from "@vueuse/core";
import { computed, PropType, ref } from "vue";
import ConfirmationDialog from "./ConfirmationDialog.vue";

const props = defineProps({
    updateInterfaceDefinition: {
        type: Function as PropType<(id: string, visible: boolean, value: boolean) => void>,
        required: true
    },
    componentTemplate: {
        type: String,
        required: false
    }
});

const model = defineModel({
    type: Object as PropType<{
        name: string;
        version: string;
        interfaceSpecification: string;
        interfaceSpecificationVersion: string;
        visibleSelfDefined: boolean;
        invisibleSelfDefined: boolean;
    } | null>,
    required: false
});

const cachedModel = useCachedRef(model);
const visibleConfirmationDialog = ref(false);
const invisibleConfirmationDialog = ref(false);

const editInterfaceDefinitionDialog = computed({
    get: () => model.value != null,
    set: (value) => {
        if (!value) {
            model.value = null;
        }
    }
});

const client = useClient();

const interfaceSpecificationVisibilityInfo = computedAsync(
    async () => {
        if (props.componentTemplate == undefined || model.value?.interfaceSpecification == null) {
            return {
                visible: false,
                invisible: false
            };
        }
        const visibilityRes = (
            await withErrorMessage(async () => {
                return client.getInterfaceSpecificationVisibilityInfo({
                    id: model.value!.interfaceSpecification,
                    componentTemplate: props.componentTemplate!
                });
            }, "Error loading interface specification visibility info")
        ).node as NodeReturnType<"getInterfaceSpecificationVisibilityInfo", "InterfaceSpecification">;
        return {
            visible: visibilityRes.template.canBeVisibleOnComponents.totalCount > 0,
            invisible: visibilityRes.template.canBeInvisibleOnComponents.totalCount > 0
        };
    },
    {
        visible: false,
        invisible: false
    },
    { shallow: false }
);

function toggleVisible(value: boolean) {
    if (!value) {
        visibleConfirmationDialog.value = true;
    } else {
        updateValue(true, true);
    }
}

function toggleInvisible(value: boolean) {
    if (!value) {
        invisibleConfirmationDialog.value = true;
    } else {
        updateValue(false, true);
    }
}

function updateValue(visible: boolean, value: boolean) {
    if (visible) {
        cachedModel.value!.visibleSelfDefined = value;
    } else {
        cachedModel.value!.invisibleSelfDefined = value;
    }
    props.updateInterfaceDefinition(cachedModel.value!.interfaceSpecificationVersion, visible, value);
}
</script>
<style scoped lang="scss">
@use "@/styles/settings.scss";
.edit-interface-definition-dialog {
    width: min(500px, calc(100vw - 3 * settings.$side-bar-width));
    max-height: 75vh;
}
</style>
