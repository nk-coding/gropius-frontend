<template>
    <div class="pa-4 h-100 overflow-y-auto" v-if="ims != undefined">
        <DetailCompartment name="General">
            <InputWrapper
                v-model="ims.name"
                v-slot="{ modelValue }"
                @save="save({ name: $event })"
                :readonly="!ims.admin"
            >
                <v-text-field v-model="modelValue.value" label="Name" :readonly="!ims.admin" />
            </InputWrapper>
            <InputWrapper
                v-model="ims.description"
                v-slot="{ modelValue }"
                @save="save({ description: $event })"
                :readonly="!ims.admin"
            >
                <v-textarea v-model="modelValue.value" label="Description" :readonly="!ims.admin" />
            </InputWrapper>
        </DetailCompartment>
        <TemplatedFieldsDetailCompartment
            :templated-node="ims"
            :readonly="!ims.admin"
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
import { UpdateComponentInput } from "@/graphql/generated";
import { eventBusKey } from "@/util/keys";
import { withErrorMessage } from "@/util/withErrorMessage";
import { computedAsync } from "@vueuse/core";
import { inject } from "vue";
import { computed } from "vue";
import { useRoute } from "vue-router";

const client = useClient();
const route = useRoute();
const eventBus = inject(eventBusKey);
const imsId = computed(() => route.params.ims as string);

const ims = computedAsync(
    async () => {
        if (!imsId.value) {
            return null;
        }
        const res = await withErrorMessage(
            () => client.getIMSGeneralDetails({ id: imsId.value }),
            "Error loading IMS details"
        );
        return res.node as NodeReturnType<"getIMSGeneralDetails", "IMS">;
    },
    null,
    { shallow: false }
);

async function save(input: Omit<UpdateComponentInput, "id">) {
    await withErrorMessage(
        () =>
            client.updateIMS({
                input: {
                    id: imsId.value,
                    ...input
                }
            }),
        "Error updating IMS details"
    );
    if ("name" in input) {
        eventBus?.emit("title-segment-changed");
    }
}
</script>
