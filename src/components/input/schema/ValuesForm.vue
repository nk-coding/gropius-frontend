<template>
    <BaseObjectForm :name="name" :is-null="model == undefined" @add-value="model = {}">
        <div class="w-100">
            <div v-if="!readonly" class="d-flex align-center mb-3">
                <v-text-field
                    v-model="addName"
                    label="Add value"
                    placeholder="Name"
                    @keydown.enter="addElement"
                    hide-details
                >
                    <template #append-inner>
                        <IconButton color="primary" :disabled="!validKey" @click="addElement">
                            <v-icon icon="mdi-plus" />
                        </IconButton>
                    </template>
                </v-text-field>
                <v-spacer />
                <IconButton v-if="schema.nullable" @click="model = null">
                    <v-icon icon="mdi-delete" />
                    <v-tooltip activator="parent" location="bottom"> Set to null </v-tooltip>
                </IconButton>
            </div>
            <v-divider v-if="Object.keys(model ?? {}).length > 0 && !readonly" class="mb-3" />
            <div v-for="property in Object.keys(model ?? {})" class="d-flex">
                <MetaForm
                    :key="property"
                    :schema="schema.values"
                    :root-schema="rootSchema"
                    :name="property"
                    v-model="model![property]"
                    :readonly="readonly"
                />
                <IconButton v-if="!readonly" class="ml-2 mt-1" @click="removeElement(property)">
                    <v-icon icon="mdi-close" />
                    <v-tooltip activator="parent" location="bottom"> Remove element </v-tooltip>
                </IconButton>
            </div>
        </div>
    </BaseObjectForm>
</template>
<script setup lang="ts">
import { Schema, SchemaFormValues } from "jtd";
import { PropType, computed, ref } from "vue";
import { generateDefaultData } from "./generateDefaultData";
import BaseObjectForm from "./BaseObjectForm.vue";
import MetaForm from "./MetaForm.vue";

const props = defineProps({
    schema: {
        type: Object as PropType<SchemaFormValues>,
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
    type: Object as PropType<Record<string, any> | null>,
    required: false
});

const addName = ref("");

const validKey = computed(() => {
    if (addName.value == "") {
        return false;
    }
    return !(addName.value in (model.value ?? {}));
});

function addElement() {
    if (model.value != undefined && validKey.value) {
        const defaultData = generateDefaultData(props.schema.values, props.rootSchema);
        model.value[addName.value] = defaultData;
        addName.value = "";
    }
}

function removeElement(name: string) {
    if (model.value != undefined) {
        delete model.value[name];
    }
}
</script>
