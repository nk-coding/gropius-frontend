<template>
    <div class="pa-4 h-100 overflow-y-auto" v-if="imsProject != undefined">
        <DetailCompartment name="General">
            <InputWrapper
                v-model="imsProject.name"
                v-slot="{ modelValue }"
                @save="save({ name: $event })"
                :readonly="!hasPermission"
            >
                <v-text-field v-model="modelValue.value" label="Name" :readonly="!hasPermission" />
            </InputWrapper>
            <InputWrapper
                v-model="imsProject.description"
                v-slot="{ modelValue }"
                @save="save({ description: $event })"
                :readonly="!hasPermission"
            >
                <v-textarea v-model="modelValue.value" label="Description" :readonly="!hasPermission" />
            </InputWrapper>
        </DetailCompartment>
        <TemplatedFieldsDetailCompartment
            :templated-node="imsProject"
            :readonly="!hasPermission"
            :save="save"
            class="mt-4"
        />
    </div>
</template>
<script lang="ts" setup>
import DetailCompartment from "@/components/DetailCompartment.vue";
import InputWrapper from "@/components/input/InputWrapper.vue";
import TemplatedFieldsDetailCompartment from "@/components/TemplatedFieldsDetailCompartment.vue";
import { NodeReturnType, useClient } from "@/graphql/client";
import { UpdateImsProjectInput } from "@/graphql/generated";
import { eventBusKey } from "@/util/keys";
import { withErrorMessage } from "@/util/withErrorMessage";
import { computedAsync } from "@vueuse/core";
import { inject } from "vue";
import { computed } from "vue";
import { useRoute } from "vue-router";

const client = useClient();
const route = useRoute();
const eventBus = inject(eventBusKey);
const imsProjectId = computed(() => route.params.project as string);

const imsProject = computedAsync(
    async () => {
        if (!imsProjectId.value) {
            return null;
        }
        const res = await withErrorMessage(
            () => client.getIMSProjectGeneralDetails({ id: imsProjectId.value }),
            "Error loading imsProject details"
        );
        return res.node as NodeReturnType<"getIMSProjectGeneralDetails", "IMSProject">;
    },
    null,
    { shallow: false }
);

const hasPermission = computed(() => {
    const project = imsProject.value;
    if (project == undefined) {
        return false;
    }
    return project.ims?.syncTrackables && project.trackable.manageIMS;
});

async function save(input: Omit<UpdateImsProjectInput, "id">) {
    await withErrorMessage(
        () =>
            client.updateIMSProject({
                input: {
                    id: imsProjectId.value,
                    ...input
                }
            }),
        "Error updating IMS project details"
    );
    if ("name" in input) {
        eventBus?.emit("title-segment-changed");
    }
}
</script>
