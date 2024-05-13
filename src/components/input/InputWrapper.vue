<template>
    <div class="d-flex input-wrapper mb-1">
        <v-form ref="editForm" v-model="formValid" class="flex-1-1-0">
            <slot :modelValue="valueCopy" />
        </v-form>
        <IconButton v-if="!readonly" class="mt-1 ml-1" :disabled="!hasUnsavedChanges" @click="save">
            <v-icon icon="mdi-content-save" />
            <v-tooltip activator="parent">Save</v-tooltip>
        </IconButton>
    </div>
</template>
<script lang="ts" setup>
import { ref, toRaw, watch } from "vue";

const props = defineProps({
    modelValue: {
        required: false
    },
    readonly: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits<{
    (event: "save", value: any): void;
}>();

const hasUnsavedChanges = ref(false);
const formValid = ref(false);
const editForm = ref<any>(null);

const valueCopy = ref<{ value: any }>({ value: copyModelValue() });

watch(
    () => props.modelValue,
    () => {
        updateValueCopy();
    }
);

watch(
    () => valueCopy.value.value,
    () => {
        hasUnsavedChanges.value = true;
    },
    {
        deep: true
    }
);

function updateValueCopy() {
    valueCopy.value.value = copyModelValue();
    hasUnsavedChanges.value = false;
}

function copyModelValue(): any {
    return structuredClone(toRaw(props.modelValue));
}

function save() {
    if (formValid.value) {
        emit("save", valueCopy.value.value);
        hasUnsavedChanges.value = false;
    } else {
        editForm.value.validate();
    }
}
</script>
<style scoped>
.input-wrapper {
    max-width: 500px;
}
</style>
