<template>
    <BaseLayout
        :title-segments="titleSegments"
        :tabs="tabs"
        :right-sidebar-items="rightSidebarItems"
        :left-sidebar-items="leftSidebarItems"
    >
        <template #content>
            <router-view />
        </template>
    </BaseLayout>
</template>

<script lang="ts" setup>
import BaseLayout from "@/components/BaseLayout.vue";
import { NodeReturnType, useClient } from "@/graphql/client";
import { asyncComputed } from "@vueuse/core";
import { computed, provide, ref } from "vue";
import { RouteLocationRaw, useRoute } from "vue-router";
import { withErrorMessage } from "@/util/withErrorMessage";
import { eventBusKey, trackableKey } from "@/util/keys";
import { inject } from "vue";
import { onEvent } from "@/util/eventBus";

type Project = NodeReturnType<"getProject", "Project">;

const client = useClient();
const route = useRoute();
const projectId = computed(() => route.params.trackable as string);
const eventBus = inject(eventBusKey);

const titleSegmentDependency = ref(0);
onEvent("title-segment-changed", () => {
    titleSegmentDependency.value++;
});

const project = asyncComputed(
    async () => {
        if (!projectId.value) {
            return null;
        }
        titleSegmentDependency.value;
        const res = await withErrorMessage(() => client.getProject({ id: projectId.value }), "Error loading project");
        return res.node as Project;
    },
    null,
    { shallow: false }
);

provide(trackableKey, project);

function projectPath(name: string): RouteLocationRaw {
    return {
        name,
        params: { trackable: projectId.value }
    };
}

const titleSegments = computed(() => [
    { icon: "$project", path: "/projects" },
    { name: project.value?.name ?? "", path: projectPath("") }
]);

const tabs = computed(() => [
    { name: "Home", path: projectPath("project") },
    { name: "Details", path: projectPath("project-details-general"), exact: false },
    { name: "Issues", path: projectPath("project-issues"), exact: false }
]);

const leftSidebarItems = computed(() => {
    if (route.path.includes("/details")) {
        return [
            [
                {
                    icon: "mdi-home",
                    name: "General",
                    color: "secondary",
                    to: projectPath("project-details-general")
                },
                {
                    icon: "mdi-label",
                    name: "Labels",
                    color: "secondary",
                    to: projectPath("project-details-labels")
                },
                {
                    icon: "mdi-shield-lock",
                    name: "Access",
                    color: "secondary",
                    to: projectPath("project-details-permissions"),
                    disabled: !(project?.value?.admin ?? false)
                }
            ]
        ];
    } else {
        return [];
    }
});

const rightSidebarItems = computed(() => {
    if (route.name == "project-issues" || route.name == "project-issue") {
        return [
            [
                {
                    icon: "mdi-plus",
                    description: `Create issue`,
                    color: "secondary",
                    disabled: !(project?.value?.createIssues ?? false),
                    onClick: () => {
                        eventBus?.emit("create-issue", undefined);
                    }
                },
                {
                    icon: "mdi-import",
                    description: "Import issue",
                    color: "secondary",
                    disabled: !(project?.value?.manageIssues ?? false),
                    onClick: () => {
                        eventBus?.emit("import-issue", undefined);
                    }
                }
            ]
        ];
    } else if (route.name == "project") {
        return [
            [
                {
                    icon: "mdi-plus",
                    description: "Add component version",
                    color: "secondary",
                    disabled: !(project?.value?.manageComponents ?? false),
                    onClick: () => {
                        eventBus?.emit("add-component-version-to-project", undefined);
                    }
                },
                {
                    icon: "mdi-auto-fix",
                    description: "Layout graph",
                    color: "secondary",
                    onClick: () => {
                        eventBus?.emit("layout-component-graph", undefined);
                    }
                }
            ]
        ];
    } else if (route.name == "project-details-labels") {
        return [
            [
                {
                    icon: "mdi-plus",
                    description: `Create label`,
                    color: "secondary",
                    disabled: !(project?.value?.manageLabels ?? false),
                    onClick: () => {
                        eventBus?.emit("create-label", undefined);
                    }
                },
                {
                    icon: "mdi-import",
                    description: "Import label",
                    color: "secondary",
                    disabled: !(project?.value?.manageLabels ?? false),
                    onClick: () => {
                        eventBus?.emit("import-label", undefined);
                    }
                }
            ]
        ];
    } else if (route.name == "project-details-permissions") {
        return [
            [
                {
                    icon: "mdi-plus",
                    description: `Create permission`,
                    color: "secondary",
                    onClick: () => {
                        eventBus?.emit("create-permission", undefined);
                    }
                },
                {
                    icon: "mdi-import",
                    description: "Import permission",
                    color: "secondary",
                    onClick: () => {
                        eventBus?.emit("import-permission", undefined);
                    }
                }
            ]
        ];
    } else {
        return [];
    }
});
</script>
