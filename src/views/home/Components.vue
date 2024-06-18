<template>
    <PaginatedList
        name="components"
        :item-manager="itemManager"
        :sort-fields="sortFields"
        :to="(component: Component) => componentRoute(component)"
        query-param-prefix=""
    >
        <template #item="{ item }">
            <ListItem
                :title="item.name"
                :subtitle="item.description || 'No description provided'"
                :italic-subtitle="!item.description"
            >
                <template #append>
                    <div class="text-medium-emphasis issue-container">
                        <v-icon icon="mdi-alert-circle-outline" />
                        {{ item.openIssues.totalCount }}
                    </div>
                </template>
            </ListItem>
        </template>
        <CreateComponentDialog @created-component="(component: IdObject) => selectComponent(component)" />
    </PaginatedList>
</template>
<script lang="ts" setup>
import PaginatedList, { ItemManager } from "@/components/PaginatedList.vue";
import { ClientReturnType, useClient } from "@/graphql/client";
import { ComponentOrder, ComponentOrderField, OrderDirection } from "@/graphql/generated";
import { RouteLocationRaw, useRouter } from "vue-router";
import ListItem from "@/components/ListItem.vue";
import CreateComponentDialog from "@/components/dialog/CreateComponentDialog.vue";
import { IdObject } from "@/util/types";

type Component = ClientReturnType<"getComponentList">["components"]["nodes"][0];

const client = useClient();
const router = useRouter();

const sortFields = {
    Name: ComponentOrderField.Name,
    Template: [ComponentOrderField.TemplateName, ComponentOrderField.TemplateId],
    "[Default]": ComponentOrderField.Id
};

const itemManager: ItemManager<Component, ComponentOrderField> = {
    fetchItems: async function (
        filter: string,
        orderBy: ComponentOrder[],
        count: number,
        page: number
    ): Promise<[Component[], number]> {
        if (filter == undefined) {
            const res = await client.getComponentList({
                orderBy,
                count,
                skip: page * count
            });
            return [res.components.nodes, res.components.totalCount];
        } else {
            const res = await client.getFilteredComponentList({
                query: filter,
                count
            });
            return [res.searchComponents, res.searchComponents.length];
        }
    }
};

function selectComponent(component: IdObject) {
    router.push(componentRoute(component));
}

function componentRoute(component: IdObject): RouteLocationRaw {
    return {
        name: "component",
        params: {
            trackable: component.id
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
