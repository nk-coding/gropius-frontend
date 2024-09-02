<template>
    <ElementsForm
        v-if="isElementsForm(derefSchema)"
        :schema="derefSchema"
        :root-schema="rootSchema"
        :name="name"
        v-model="model"
        :readonly="readonly"
    />
    <ValuesForm
        v-else-if="isValuesForm(derefSchema)"
        :schema="derefSchema"
        :root-schema="rootSchema"
        :name="name"
        v-model="model"
        :readonly="readonly"
    />
    <ObjectForm
        v-else-if="isPropertiesForm(schema) || isDiscriminatorForm(schema)"
        :schema="<any>derefSchema"
        :root-schema="rootSchema"
        :name="name"
        v-model="model"
        :readonly="readonly"
    />
    <TypeForm
        v-else-if="isTypeForm(schema)"
        :schema="<any>derefSchema"
        :root-schema="rootSchema"
        :name="name"
        v-model="model"
        :readonly="readonly"
    />
    <EnumForm
        v-else-if="isEnumForm(schema)"
        :schema="<any>derefSchema"
        :root-schema="rootSchema"
        :name="name"
        v-model="model"
        :readonly="readonly"
    />
</template>
<script setup lang="ts">
import {
    Schema,
    isElementsForm,
    isPropertiesForm,
    isDiscriminatorForm,
    isValuesForm,
    isTypeForm,
    isEnumForm
} from "jtd";
import { computed } from "vue";
import { PropType } from "vue";
import ElementsForm from "./ElementsForm.vue";
import ValuesForm from "./ValuesForm.vue";
import ObjectForm from "./ObjectForm.vue";
import EnumForm from "./EnumForm.vue";
import TypeForm from "./TypeForm.vue";
import { derefSchemaRecursive } from "./generateDefaultData";

const props = defineProps({
    schema: {
        type: Object as PropType<Schema>,
        required: true
    },
    rootSchema: {
        type: Object as PropType<Schema>,
        required: true
    },
    name: {
        type: String,
        required: false
    },
    readonly: {
        type: Boolean,
        required: false,
        default: false
    }
});

const model = defineModel<any>({
    required: false
});

const derefSchema = computed(() => {
    return derefSchemaRecursive(props.schema, props.rootSchema);
});
</script>
