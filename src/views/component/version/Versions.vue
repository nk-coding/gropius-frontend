<template>
    <PaginatedList
        name="versions"
        :item-manager="itemManager"
        :sort-fields="sortFields"
        :to="(componentVersion: ComponentVersion) => componentVersionRoute(componentVersion)"
        query-param-prefix=""
    >
        <template #item="{ item }">
            <ListItem
                :title="`v${item.version}`"
                :subtitle="item.tags.length == 0 ? 'No tags provided' : undefined"
                italic-subtitle
            >
                <template #subtitle v-if="item.tags.length > 0">
                    <div class="d-flex flex-wrap chip-container mt-1">
                        <v-chip
                            v-for="(tag, index) in item.tags"
                            :key="index"
                            color="primary"
                            size="small"
                            class="flex-shrink-0"
                        >
                            {{ tag }}
                        </v-chip>
                    </div>
                </template>
                <template #append>
                    <div class="text-medium-emphasis mr-2">v{{ item.version }}</div>
                    <div class="text-medium-emphasis issue-container">
                        <v-icon icon="mdi-source-commit-start" />
                        {{ item.interfaceDefinitions.totalCount }}
                    </div>
                </template>
            </ListItem>
        </template>
        <CreateComponentVersionDialog
            :component="trackableId"
            @created-component-version="(componentVersion: IdObject) => selectComponentVersion(componentVersion)"
        />
    </PaginatedList>
</template>
<script lang="ts" setup>
import PaginatedList, { ItemManager } from "@/components/PaginatedList.vue";
import { NodeReturnType, useClient } from "@/graphql/client";
import { ComponentVersionOrder, ComponentVersionOrderField } from "@/graphql/generated";
import { RouteLocationRaw, useRoute, useRouter } from "vue-router";
import ListItem from "@/components/ListItem.vue";
import { computed } from "vue";
import CreateComponentVersionDialog from "@/components/dialog/CreateComponentVersionDialog.vue";
import { IdObject } from "@/util/types";

type ComponentVersion = NodeReturnType<"getComponentVersionList", "Component">["versions"]["nodes"][0];

const client = useClient();
const router = useRouter();
const route = useRoute();
const trackableId = computed(() => route.params.trackable as string);

const sortFields = {
    Version: ComponentVersionOrderField.Version,
    "[Default]": ComponentVersionOrderField.Id
};

const itemManager: ItemManager<ComponentVersion, ComponentVersionOrderField> = {
    fetchItems: async function (
        filter: string | undefined,
        orderBy: ComponentVersionOrder[],
        count: number,
        page: number
    ): Promise<[ComponentVersion[], number]> {
        if (filter == undefined) {
            const res = (
                await client.getComponentVersionList({
                    orderBy,
                    count,
                    skip: page * count,
                    component: trackableId.value
                })
            ).node as NodeReturnType<"getComponentVersionList", "Component">;
            return [res.versions.nodes!, res.versions.totalCount];
        } else {
            const res = await client.getFilteredComponentVersionList({
                query: filter,
                count,
                component: trackableId.value
            });
            return [res.searchComponentVersions, res.searchComponentVersions.length];
        }
    }
};

function selectComponentVersion(componentVersion: IdObject) {
    router.push(componentVersionRoute(componentVersion));
}

function componentVersionRoute(componentVersion: IdObject): RouteLocationRaw {
    return {
        name: "component-version-general",
        params: {
            version: componentVersion.id
        }
    };
}
</script>
<style scoped lang="scss">
@use "@/styles/settings";
.issue-container {
    min-width: settings.$icon-with-number-width;
}

.chip-container {
    row-gap: 0.5rem;
    column-gap: 0.25rem;
}
</style>
