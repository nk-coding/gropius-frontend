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
import { computedAsync } from "@vueuse/core";
import { computed, ref } from "vue";
import { RouteLocationRaw, useRoute } from "vue-router";
import { withErrorMessage } from "@/util/withErrorMessage";
import { inject } from "vue";
import { eventBusKey } from "@/util/keys";
import { onEvent } from "@/util/eventBus";

type Component = NodeReturnType<"getComponent", "Component">;

const client = useClient();
const route = useRoute();
const imsId = computed(() => route.params.ims as string);
const imsProjectId = computed(() => route.params.project as string | undefined);
const eventBus = inject(eventBusKey);

const titleSegmentDependency = ref(0);
onEvent("title-segment-changed", () => {
    titleSegmentDependency.value++;
});

const ims = computedAsync(
    async () => {
        if (!imsId.value) {
            return null;
        }
        titleSegmentDependency.value;
        const res = await withErrorMessage(() => client.getIMS({ id: imsId.value }), "Error loading component");
        return res.node as Component;
    },
    null,
    { shallow: false }
);

const project = computedAsync(
    async () => {
        if (!imsProjectId.value) {
            return null;
        }
        titleSegmentDependency.value;
        const res = await withErrorMessage(
            () => client.getNamedNode({ id: imsProjectId.value! }),
            "Error loading ims project"
        );
        return res.node as { id: string; name: string };
    },
    null,
    { shallow: false }
);

function imsPath(name: string): RouteLocationRaw {
    return {
        name,
        params: { ims: imsId.value }
    };
}

function imsProjectPath(name: string): RouteLocationRaw {
    return {
        name,
        params: { ims: imsId.value, project: imsProjectId.value }
    };
}

const titleSegments = computed(() => {
    const segments = [
        { icon: "$ims", path: "/imss" },
        { name: ims.value?.name ?? "", path: imsPath("ims") }
    ];
    const projectValue = project.value;
    if (projectValue != undefined && imsProjectId.value != undefined) {
        segments.push({ name: projectValue.name, path: imsProjectPath("ims-project-general") });
    }
    return segments;
});

const tabs = computed(() => {
    if (imsProjectId.value != undefined) {
        return [];
    }
    return [
        { name: "Projects", path: imsPath("ims") },
        { name: "Details", path: imsPath("ims-details-general"), exact: false }
    ];
});

const leftSidebarItems = computed(() => {
    if (route.path.includes("/details")) {
        return [
            [
                {
                    icon: "mdi-home",
                    name: "General",
                    color: "secondary",
                    to: imsPath("ims-details-general")
                },
                {
                    icon: "mdi-shield-lock",
                    name: "Access",
                    color: "secondary",
                    to: imsPath("ims-details-permissions"),
                    disabled: !(ims?.value?.admin ?? false)
                }
            ],
            [
                {
                    icon: "mdi-alert",
                    name: "Danger",
                    color: "error",
                    to: imsPath("ims-details-danger"),
                    disabled: !(ims?.value?.admin ?? false)
                }
            ]
        ];
    } else if (route.name?.toString().startsWith("ims-project-")) {
        return [
            [
                {
                    icon: "mdi-home",
                    name: "General",
                    color: "secondary",
                    to: imsPath("ims-project-general")
                }
            ],
            [
                {
                    icon: "mdi-alert",
                    name: "Danger",
                    color: "error",
                    to: imsPath("ims-project-danger")
                }
            ]
        ];
    } else {
        return [];
    }
});

const rightSidebarItems = computed(() => {
    if (route.name == "ims-details-permissions") {
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
    } else if (route.name == "ims") {
        return [
            [
                {
                    icon: "mdi-plus",
                    description: `Create IMS project`,
                    color: "secondary",
                    onClick: () => {
                        eventBus?.emit("create-ims-project", undefined);
                    }
                }
            ]
        ];
    } else {
        return [];
    }
});
</script>
