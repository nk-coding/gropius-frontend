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
        <DetailCompartment name="Templated Fields" class="mt-4">
            <div v-if="ims.templatedFields.length == 0" class="mt-n1 text-medium-emphasis">
                No templated fields available
            </div>
            <InputWrapper
                v-for="templatedField in templatedFields"
                :key="templatedField.name"
                v-model="templatedField.value"
                :readonly="!ims.admin"
                v-slot="{ modelValue }"
                @save="save({ templatedFields: [{ name: templatedField.name, value: $event }] })"
            >
                <MetaForm
                    :schema="templatedField.schema"
                    :root-schema="templatedField.schema"
                    v-model="modelValue.value"
                    :readonly="!ims.admin"
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

const templatedFields = computed(() => {
    if (ims.value == undefined) {
        return [];
    }
    const templatedFieldsValues = new Map<string, any>();
    for (const field of ims.value.templatedFields) {
        templatedFieldsValues.set(field.name, field.value);
    }
    return ims.value.template.templateFieldSpecifications.map((field) => ({
        name: field.name,
        schema: field.value,
        value: templatedFieldsValues.get(field.name)
    }));
});

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
