<template>
    <div class="pa-4 h-100 overflow-y-auto" v-if="component != undefined">
        <DetailCompartment name="General">
            <InputWrapper
                v-model="component.name"
                v-slot="{ modelValue }"
                @save="save({ name: $event })"
                :readonly="!component.admin"
            >
                <v-text-field v-model="modelValue.value" label="Name" :readonly="!component.admin" />
            </InputWrapper>
            <InputWrapper
                v-model="component.description"
                v-slot="{ modelValue }"
                @save="save({ description: $event })"
                :readonly="!component.admin"
            >
                <v-textarea v-model="modelValue.value" label="Description" :readonly="!component.admin" />
            </InputWrapper>
            <InputWrapper
                v-model="component.repositoryURL"
                v-slot="{ modelValue }"
                @save="save({ repositoryURL: $event })"
                :readonly="!component.admin"
            >
                <v-text-field v-model="modelValue.value" label="Repository URL" :readonly="!component.admin" />
            </InputWrapper>
        </DetailCompartment>
        <TemplatedFieldsDetailCompartment
            :templated-node="component"
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
const componentId = computed(() => route.params.trackable as string);

const component = computedAsync(
    async () => {
        if (!componentId.value) {
            return null;
        }
        const res = await withErrorMessage(
            () => client.getComponentGeneralDetails({ id: componentId.value }),
            "Error loading component details"
        );
        return res.node as NodeReturnType<"getComponentGeneralDetails", "Component">;
    },
    null,
    { shallow: false }
);

async function save(input: Omit<UpdateComponentInput, "id">) {
    await withErrorMessage(
        () =>
            client.updateComponent({
                input: {
                    id: componentId.value,
                    ...input
                }
            }),
        "Error updating component details"
    );
    if ("name" in input) {
        eventBus?.emit("title-segment-changed");
    }
}
</script>
