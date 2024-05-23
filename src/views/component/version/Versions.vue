<template>
    <PaginatedList
        name="versions"
        :item-manager="itemManager"
        :sort-fields="Object.keys(sortFields)"
        :to="(componentVersion: ComponentVersion) => componentVersionRoute(componentVersion)"
        query-param-prefix=""
    >
        <template #item="{ item }">
            <ListItem
                :title="item.name"
                :subtitle="item.description || 'No description provided'"
                :italic-subtitle="!item.description"
            >
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
import { ComponentVersionOrderField, OrderDirection } from "@/graphql/generated";
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
    "[Default]": ComponentVersionOrderField.Id,
    Name: ComponentVersionOrderField.Name
};

const itemManager: ItemManager<ComponentVersion, keyof typeof sortFields> = {
    fetchItems: async function (
        filter: string | undefined,
        sortField: keyof typeof sortFields,
        sortAscending: boolean,
        count: number,
        page: number
    ): Promise<[ComponentVersion[], number]> {
        if (filter == undefined) {
            const res = (
                await client.getComponentVersionList({
                    orderBy: {
                        field: sortFields[sortField],
                        direction: sortAscending ? OrderDirection.Asc : OrderDirection.Desc
                    },
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
</style>
