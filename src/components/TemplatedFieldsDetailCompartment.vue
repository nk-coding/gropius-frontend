<template>
    <DetailCompartment name="Templated Fields">
        <div v-if="templatedFields.length == 0" class="mt-n1 text-medium-emphasis">No templated fields available</div>
        <InputWrapper
            v-for="templatedField in templatedFields"
            :key="templatedField.name"
            v-model="templatedField.value"
            :readonly="readonly"
            v-slot="{ modelValue }"
            @save="save({ templatedFields: [{ name: templatedField.name, value: $event }] })"
        >
            <MetaForm
                :schema="templatedField.schema"
                :name="templatedField.name"
                :root-schema="templatedField.schema"
                v-model="modelValue.value"
                :readonly="readonly"
            />
        </InputWrapper>
    </DetailCompartment>
</template>
<script lang="ts" setup>
import { computed, PropType } from "vue";
import DetailCompartment from "./DetailCompartment.vue";
import InputWrapper from "./input/InputWrapper.vue";
import MetaForm from "./input/schema/MetaForm.vue";

const props = defineProps({
    templatedNode: {
        type: Object as PropType<{
            template: { templateFieldSpecifications: { name: string; value?: any }[] };
            templatedFields: { name: string; value?: any }[];
        }>,
        required: false
    },
    readonly: {
        type: Boolean,
        required: true
    },
    save: {
        type: Function as PropType<(input: { templatedFields: [{ name: string; value: any }] }) => unknown>,
        required: true
    }
});

const templatedFields = computed(() => {
    const templatedNode = props.templatedNode;
    if (templatedNode == undefined) {
        return [];
    }
    const templatedFieldsValues = new Map<string, any>();
    for (const field of templatedNode.templatedFields) {
        templatedFieldsValues.set(field.name, field.value);
    }
    return templatedNode.template.templateFieldSpecifications.map((field) => ({
        name: field.name,
        schema: field.value,
        value: templatedFieldsValues.get(field.name)
    }));
});
</script>
