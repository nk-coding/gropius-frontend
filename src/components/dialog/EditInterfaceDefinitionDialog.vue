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
                    v-model="cachedModel.visibleSelfDefined"
                    @update:model-value="
                        updateInterfaceDefinition(cachedModel.interfaceSpecificationVersion, true, $event ?? false)
                    "
                    label="Visible"
                    class="mb-1"
                    :disabled="!interfaceSpecificationVisibilityInfo.visible"
                />
                <v-switch
                    v-model="cachedModel.invisibleSelfDefined"
                    @update:model-value="
                        updateInterfaceDefinition(cachedModel.interfaceSpecificationVersion, false, $event ?? false)
                    "
                    label="Invisible"
                    class="mb-1"
                    :disabled="!interfaceSpecificationVisibilityInfo.invisible"
                />
            </div>
        </v-card>
    </v-dialog>
</template>
<script setup lang="ts">
import { NodeReturnType, useClient } from "@/graphql/client";
import { useCachedRef } from "@/util/useCachedRef";
import { withErrorMessage } from "@/util/withErrorMessage";
import { computedAsync } from "@vueuse/core";
import { computed, PropType } from "vue";

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
</script>
<style scoped lang="scss">
@use "@/styles/settings.scss";
.edit-interface-definition-dialog {
    width: min(500px, calc(100vw - 3 * settings.$side-bar-width));
    max-height: 75vh;
}
</style>
