<template>
    <div class="pa-4 h-100 overflow-y-auto" v-if="project != undefined">
        <DetailCompartment name="General">
            <InputWrapper
                v-model="project.name"
                v-slot="{ modelValue }"
                @save="save({ name: $event })"
                :readonly="!project.admin"
            >
                <v-text-field v-model="modelValue.value" label="Name" :readonly="!project.admin" />
            </InputWrapper>
            <InputWrapper
                v-model="project.description"
                v-slot="{ modelValue }"
                @save="save({ description: $event })"
                :readonly="!project.admin"
            >
                <v-textarea v-model="modelValue.value" label="Description" :readonly="!project.admin" />
            </InputWrapper>
            <InputWrapper
                v-model="project.repositoryURL"
                v-slot="{ modelValue }"
                @save="save({ repositoryURL: $event })"
                :readonly="!project.admin"
            >
                <v-text-field v-model="modelValue.value" label="Repository URL" :readonly="!project.admin" />
            </InputWrapper>
        </DetailCompartment>
    </div>
</template>
<script lang="ts" setup>
import DetailCompartment from "@/components/DetailCompartment.vue";
import InputWrapper from "@/components/input/InputWrapper.vue";
import { NodeReturnType, useClient } from "@/graphql/client";
import { UpdateProjectInput } from "@/graphql/generated";
import { eventBusKey } from "@/util/keys";
import { withErrorMessage } from "@/util/withErrorMessage";
import { computedAsync } from "@vueuse/core";
import { inject } from "vue";
import { computed } from "vue";
import { useRoute } from "vue-router";

const client = useClient();
const route = useRoute();
const eventBus = inject(eventBusKey);
const projectId = computed(() => route.params.trackable as string);

const project = computedAsync(
    async () => {
        if (!projectId.value) {
            return null;
        }
        const res = await withErrorMessage(
            () => client.getProjectGeneralDetails({ id: projectId.value }),
            "Error loading project details"
        );
        return res.node as NodeReturnType<"getProjectGeneralDetails", "Project">;
    },
    null,
    { shallow: false }
);

async function save(input: Omit<UpdateProjectInput, "id">) {
    await withErrorMessage(
        () =>
            client.updateProject({
                input: {
                    id: projectId.value,
                    ...input
                }
            }),
        "Error updating project details"
    );
    if ("name" in input) {
        eventBus?.emit("title-segment-changed");
    }
}
</script>
