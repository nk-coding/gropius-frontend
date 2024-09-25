<template>
    <div class="pa-4 h-100 overflow-y-auto" v-if="interfaceSpecification != undefined && component != undefined">
        <DetailCompartment name="General">
            <InputWrapper
                v-model="interfaceSpecification.name"
                v-slot="{ modelValue }"
                @save="save({ name: $event })"
                :readonly="!component.admin"
            >
                <v-text-field v-model="modelValue.value" label="Name" :readonly="!component.admin" />
            </InputWrapper>
            <InputWrapper
                v-model="interfaceSpecification.description"
                v-slot="{ modelValue }"
                @save="save({ description: $event })"
                :readonly="!component.admin"
            >
                <v-textarea v-model="modelValue.value" label="Description" :readonly="!component.admin" />
            </InputWrapper>
        </DetailCompartment>
        <TemplatedFieldsDetailCompartment
            :templated-node="interfaceSpecification"
            :readonly="!component.admin"
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
import { UpdateInterfaceSpecificationInput } from "@/graphql/generated";
import { eventBusKey, trackableKey } from "@/util/keys";
import { withErrorMessage } from "@/util/withErrorMessage";
import { computedAsync } from "@vueuse/core";
import { inject } from "vue";
import { computed } from "vue";
import { useRoute } from "vue-router";

const client = useClient();
const route = useRoute();
const eventBus = inject(eventBusKey);
const interfaceSpecificationId = computed(() => route.params.interfaceSpecification as string);

const component = inject(trackableKey);

const interfaceSpecification = computedAsync(
    async () => {
        if (!interfaceSpecificationId.value) {
            return null;
        }
        const res = await withErrorMessage(
            () => client.getInterfaceSpecificationGeneralDetails({ id: interfaceSpecificationId.value }),
            "Error loading interfaceSpecification details"
        );
        return res.node as NodeReturnType<"getInterfaceSpecificationGeneralDetails", "InterfaceSpecification">;
    },
    null,
    { shallow: false }
);

async function save(input: Omit<UpdateInterfaceSpecificationInput, "id">) {
    await withErrorMessage(
        () =>
            client.updateInterfaceSpecification({
                input: {
                    id: interfaceSpecificationId.value,
                    ...input
                }
            }),
        "Error updating interface specification details"
    );
    if ("name" in input) {
        eventBus?.emit("title-segment-changed");
    }
}
</script>
