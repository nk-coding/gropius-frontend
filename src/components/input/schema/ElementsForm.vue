<template>
    <BaseObjectForm :name="name" :is-null="model == undefined" @add-value="model = []">
        <div class="w-100">
            <div v-if="!readonly" class="d-flex align-center mb-3">
                <v-btn variant="tonal" @click="addElement"> Add element </v-btn>
                <v-spacer />
                <IconButton v-if="schema.nullable" @click="model = null">
                    <v-icon icon="mdi-delete" />
                    <v-tooltip activator="parent" location="bottom"> Set to null </v-tooltip>
                </IconButton>
            </div>
            <v-divider v-if="model?.length && !readonly" class="mb-3" />
            <div v-for="(element, index) in model ?? []" class="d-flex">
                <MetaForm
                    :key="index"
                    :schema="schema.elements"
                    :root-schema="rootSchema"
                    v-model="model![index]"
                    :readonly="readonly"
                />
                <IconButton v-if="!readonly" class="ml-2 mt-1" @click="removeElement(index)">
                    <v-icon icon="mdi-close" />
                    <v-tooltip activator="parent" location="bottom"> Remove element </v-tooltip>
                </IconButton>
            </div>
        </div>
    </BaseObjectForm>
</template>
<script setup lang="ts">
import { Schema, SchemaFormElements } from "jtd";
import { PropType } from "vue";
import { generateDefaultData } from "./generateDefaultData";
import BaseObjectForm from "./BaseObjectForm.vue";
import MetaForm from "./MetaForm.vue";

const props = defineProps({
    schema: {
        type: Object as PropType<SchemaFormElements>,
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
        required: true
    }
});

const model = defineModel({
    type: Array as PropType<unknown[] | null>,
    required: false
});

function addElement() {
    const defaultData = generateDefaultData(props.schema.elements, props.rootSchema);
    model.value!.push(defaultData);
}

function removeElement(index: number) {
    model.value!.splice(index, 1);
}
</script>
