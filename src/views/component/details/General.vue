<template>
    <div class="pa-4 full-height" v-if="component != undefined">
        <DetailCompartment name="General">
            <InputWrapper v-model="component.name" v-slot="{ modelValue }" @save="save({ name: $event })">
                <v-text-field v-model="modelValue.value" label="Name" />
            </InputWrapper>
            <InputWrapper v-model="component.description" v-slot="{ modelValue }" @save="save({ description: $event })">
                <v-textarea v-model="modelValue.value" label="Description" />
            </InputWrapper>
            <InputWrapper
                v-model="component.repositoryURL"
                v-slot="{ modelValue }"
                @save="save({ repositoryURL: $event })"
            >
                <v-text-field v-model="modelValue.value" label="Repository URL" />
            </InputWrapper>
        </DetailCompartment>
        <DetailCompartment name="Templated Fields" class="mt-4">
            <div v-if="component.templatedFields.length == 0" class="mt-n1 text-medium-emphasis">
                No templated fields available
            </div>
            <InputWrapper
                v-for="templatedField in templatedFields"
                :key="templatedField.name"
                v-model="templatedField.value"
                v-slot="{ modelValue }"
                @save="save({ templatedFields: [{ name: templatedField.name, value: $event }] })"
            >
                <MetaForm
                    :schema="templatedField.schema"
                    :root-schema="templatedField.schema"
                    v-model="modelValue.value"
                />
            </InputWrapper>
        </DetailCompartment>
    </div>
</template>
<script lang="ts" setup>
import DetailCompartment from "@/components/DetailCompartment.vue";
import InputWrapper from "@/components/input/InputWrapper.vue";
import MetaForm from "@/components/input/schema/MetaForm.vue";
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

const templatedFields = computed(() => {
    if (component.value == undefined) {
        return [];
    }
    const templatedFieldsValues = new Map<string, any>();
    for (const field of component.value.templatedFields) {
        templatedFieldsValues.set(field.name, field.value);
    }
    return component.value.template.templateFieldSpecifications.map((field) => ({
        name: field.name,
        schema: field.value,
        value: templatedFieldsValues.get(field.name)
    }));
});

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
