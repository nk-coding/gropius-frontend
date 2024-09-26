<template>
    <v-chip color="primary" :prepend-icon="icon" :to="location">
        {{ name }}
        <v-tooltip v-if="description" activator="parent" location="bottom">
            {{ description }}
        </v-tooltip>
    </v-chip>
</template>
<script setup lang="ts">
import { DefaultAffectedByIssueInfoFragment } from "@/graphql/generated";
import { affectedByIssueName, affectedByIssueIcon, affectedByIssueDescription } from "@/util/affectedByIssueUtils";
import { computed } from "vue";
import { PropType } from "vue";
import { RouteLocationRaw } from "vue-router";

const props = defineProps({
    affectedEntity: {
        type: Object as PropType<DefaultAffectedByIssueInfoFragment>,
        required: true
    }
});

const icon = computed(() => {
    return affectedByIssueIcon(props.affectedEntity.__typename);
});

const name = computed(() => affectedByIssueName(props.affectedEntity));
const description = computed(() => affectedByIssueDescription(props.affectedEntity));

const location = computed<RouteLocationRaw | undefined>(() => {
    const type = props.affectedEntity.__typename;
    const id = props.affectedEntity.id;
    if (type === "Component") {
        return {
            name: "component",
            params: {
                trackable: id
            }
        };
    } else if (type === "Project") {
        return {
            name: "project",
            params: {
                trackable: id
            }
        };
    } else {
        return undefined;
    }
});
</script>
