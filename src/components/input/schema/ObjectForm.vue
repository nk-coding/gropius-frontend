<template>
    <BaseObjectForm
        :name="name"
        :is-null="modelValue == undefined"
        @add-value="model = generateDefaultData(schema, rootSchema, true)"
    >
        <div class="w-100">
            <div
                v-if="
                    (isDiscriminatorForm(schema) || availableOptionalProperties.length > 0 || schema.nullable) &&
                    !readonly
                "
            >
                <div class="d-flex align-center mb-3">
                    <v-autocomplete
                        v-if="isDiscriminatorForm(schema)"
                        class="mr-3"
                        :items="Object.keys(schema.mapping)"
                        :label="schema.discriminator"
                        :model-value="model![schema.discriminator] as string | undefined"
                        hide-details
                        @update:model-value="updateDiscriminator"
                        :rules="[requiredRule]"
                    />
                    <v-btn v-if="availableOptionalProperties.length > 0" variant="tonal">
                        Add property
                        <v-menu activator="parent">
                            <v-list>
                                <v-list-item
                                    v-for="property in availableOptionalProperties"
                                    :key="property[0]"
                                    @click="addOptionalProprty(property)"
                                >
                                    <v-list-item-title>{{ property[0] }}</v-list-item-title>
                                </v-list-item>
                            </v-list>
                        </v-menu>
                    </v-btn>
                    <v-spacer />
                    <IconButton v-if="schema.nullable" @click="model = null">
                        <v-icon icon="mdi-delete" />
                        <v-tooltip activator="parent" location="bottom"> Set to null </v-tooltip>
                    </IconButton>
                </div>
                <v-divider v-if="Object.keys(model ?? {}).length > 0" class="mb-3" />
            </div>
            <template v-if="currentSchema != undefined">
                <MetaForm
                    v-for="property in Object.entries(currentSchema.properties!)"
                    :key="property[0]"
                    :schema="property[1]"
                    :root-schema="rootSchema"
                    :name="property[0]"
                    v-model="modelValue![property[0]]"
                    :readonly="readonly"
                />
                <div v-for="property in addedOptionalProperties" class="d-flex">
                    <MetaForm
                        :key="property[0]"
                        :schema="property[1]"
                        :root-schema="rootSchema"
                        :name="property[0]"
                        v-model="modelValue![property[0]]"
                        :readonly="readonly"
                    />
                    <IconButton v-if="!readonly" class="ml-2 mt-1" @click="removeOptionalProperty(property[0])">
                        <v-icon icon="mdi-close" />
                        <v-tooltip activator="parent" location="bottom"> Remove optional property </v-tooltip>
                    </IconButton>
                </div>
            </template>
        </div>
    </BaseObjectForm>
</template>
<script setup lang="ts">
import { Schema, SchemaFormDiscriminator, SchemaFormProperties, SchemaFormValues, isDiscriminatorForm } from "jtd";
import { PropType, computed } from "vue";
import BaseObjectForm from "./BaseObjectForm.vue";
import { derefSchemaRecursive, generateDefaultData } from "./generateDefaultData";
import MetaForm from "./MetaForm.vue";
import { requiredRule } from "./rules";

const props = defineProps({
    schema: {
        type: Object as PropType<SchemaFormDiscriminator | SchemaFormProperties | SchemaFormValues>,
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
    type: Object as PropType<Record<string, unknown> | null>,
    required: false
});

const currentSchema = computed(() => {
    if (isDiscriminatorForm(props.schema)) {
        const discriminator = model.value?.[props.schema.discriminator] as string | undefined;
        if (discriminator == undefined) {
            return undefined;
        } else {
            return derefSchemaRecursive(props.schema.mapping[discriminator], props.rootSchema) as SchemaFormProperties;
        }
    } else {
        return props.schema as SchemaFormProperties;
    }
});

const optionalProperties = computed(() => {
    if (currentSchema.value == undefined) {
        return [];
    } else {
        const properties = currentSchema.value.optionalProperties;
        if (properties == undefined || Object.keys(properties).length == 0) {
            return [];
        }
        return Object.entries(properties);
    }
});

const addedOptionalProperties = computed(() => {
    const modelValue = model.value;
    return optionalProperties.value.filter((property) => modelValue?.[property[0]] !== undefined);
});

const availableOptionalProperties = computed(() => {
    const modelValue = model.value;
    return optionalProperties.value.filter((property) => modelValue?.[property[0]] === undefined);
});

function addOptionalProprty(property: [string, Schema]) {
    model.value![property[0]] = generateDefaultData(property[1], props.rootSchema);
}

function removeOptionalProperty(name: string) {
    delete model.value![name];
}

function updateDiscriminator(discriminator: string) {
    const discriminatorSchema = props.schema as SchemaFormDiscriminator;
    const discriminatorSchemaValue = (props.schema as SchemaFormDiscriminator).mapping[discriminator];
    const newModelValue = {
        [discriminatorSchema.discriminator]: discriminator,
        ...generateDefaultData(discriminatorSchemaValue, props.rootSchema)
    };
    model.value = newModelValue;
}
</script>
