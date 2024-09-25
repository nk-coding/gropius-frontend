<template>
    <div
        class="pa-4 h-100 overflow-y-auto"
        v-if="interfaceSpecificationVersion != undefined && interfaceSpecification != undefined"
    >
        <DetailCompartment name="General">
            <InputWrapper
                v-model="interfaceSpecificationVersion.name"
                v-slot="{ modelValue }"
                @save="save({ name: $event })"
                :readonly="!interfaceSpecification.admin"
            >
                <v-text-field v-model="modelValue.value" label="Name" :readonly="!interfaceSpecification.admin" />
            </InputWrapper>
            <InputWrapper
                v-model="interfaceSpecificationVersion.version"
                v-slot="{ modelValue }"
                @save="save({ version: $event })"
                :readonly="!interfaceSpecification.admin"
            >
                <v-text-field v-model="modelValue.value" label="Version" :readonly="!interfaceSpecification.admin" />
            </InputWrapper>
            <InputWrapper
                v-model="interfaceSpecificationVersion.description"
                v-slot="{ modelValue }"
                @save="save({ description: $event })"
                :readonly="!interfaceSpecification.admin"
            >
                <v-textarea v-model="modelValue.value" label="Description" :readonly="!interfaceSpecification.admin" />
            </InputWrapper>
        </DetailCompartment>
        <TemplatedFieldsDetailCompartment
            :templated-node="interfaceSpecificationVersion"
            :readonly="!interfaceSpecification.admin"
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
import { UpdateInterfaceSpecificationVersionInput } from "@/graphql/generated";
import { eventBusKey, trackableKey } from "@/util/keys";
import { withErrorMessage } from "@/util/withErrorMessage";
import { computedAsync } from "@vueuse/core";
import { inject } from "vue";
import { computed } from "vue";
import { useRoute } from "vue-router";

const client = useClient();
const route = useRoute();
const eventBus = inject(eventBusKey);
const interfaceSpecificationVersionId = computed(() => route.params.interfaceSpecificationVersion as string);

const interfaceSpecification = inject(trackableKey);

const interfaceSpecificationVersion = computedAsync(
    async () => {
        if (!interfaceSpecificationVersionId.value) {
            return null;
        }
        const res = await withErrorMessage(
            () => client.getInterfaceSpecificationVersionGeneralDetails({ id: interfaceSpecificationVersionId.value }),
            "Error loading interfaceSpecificationVersion details"
        );
        return res.node as NodeReturnType<
            "getInterfaceSpecificationVersionGeneralDetails",
            "InterfaceSpecificationVersion"
        >;
    },
    null,
    { shallow: false }
);

async function save(input: Omit<UpdateInterfaceSpecificationVersionInput, "id">) {
    await withErrorMessage(
        () =>
            client.updateInterfaceSpecificationVersion({
                input: {
                    id: interfaceSpecificationVersionId.value,
                    ...input
                }
            }),
        "Error updating interface specification version details"
    );
    if ("name" in input) {
        eventBus?.emit("title-segment-changed");
    }
}
</script>
