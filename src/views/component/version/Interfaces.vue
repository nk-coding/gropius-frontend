<template>
    <PaginatedList
        name="interface definitions"
        :item-manager="itemManager"
        :sort-fields="sortFields"
        :to="() => undefined"
        :dependencies="modifiedIds"
        query-param-prefix=""
    >
        <template #item="{ item }">
            <ListItem
                :title="`${item.name} (v${item.version})`"
                :subtitle="item.description || 'No description provided'"
                :italic-subtitle="!item.description"
            >
                <template #append>
                    <v-chip
                        v-if="item.visibleSelfDefined || item.visibleDerivedBy.totalCount > 0"
                        color="primary"
                        size="small"
                        class="flex-shrink-0 mr-5"
                        >Visible</v-chip
                    >
                    <v-chip
                        v-if="item.invisibleSelfDefined || item.invisibleDerivedBy.totalCount > 0"
                        color="primary"
                        size="small"
                        class="flex-shrink-0 mr-5"
                        >Invisible</v-chip
                    >
                </template>
            </ListItem>
        </template>
        <AddInterfaceSpecificationVersionToComponentVersionDialog
            :component="componentId"
            :component-version="componentVersionId"
            @added-interface-specification-version-to-component-version="modifiedIds.push($event.id)"
        />
    </PaginatedList>
</template>
<script lang="ts" setup>
import PaginatedList, { ItemManager } from "@/components/PaginatedList.vue";
import { NodeReturnType, useClient } from "@/graphql/client";
import {
    DefaultInterfaceDefinitionInfoFragment,
    InterfaceDefinitionOrder,
    InterfaceDefinitionOrderField
} from "@/graphql/generated";
import { useRoute } from "vue-router";
import ListItem from "@/components/ListItem.vue";
import { computed, ref } from "vue";
import AddInterfaceSpecificationVersionToComponentVersionDialog from "@/components/dialog/AddInterfaceSpecificationVersionToComponentVersionDialog.vue";

type InterfaceDefinition = DefaultInterfaceDefinitionInfoFragment & {
    name: string;
    version: string;
    description?: string;
};

const client = useClient();
const route = useRoute();
const componentVersionId = computed(() => route.params.version as string);
const componentId = computed(() => route.params.trackable as string);
const modifiedIds = ref<string[]>([]);

const sortFields = {
    Version: InterfaceDefinitionOrderField.InterfaceSpecificationVersionVersion,
    "[Default]": InterfaceDefinitionOrderField.Id
};

const itemManager: ItemManager<InterfaceDefinition, InterfaceDefinitionOrderField> = {
    fetchItems: async function (
        filter: string,
        orderBy: InterfaceDefinitionOrder[],
        count: number,
        page: number
    ): Promise<[InterfaceDefinition[], number]> {
        if (filter == undefined) {
            const res = (
                await client.getInterfaceDefinitionList({
                    orderBy,
                    count,
                    skip: page * count,
                    componentVersion: componentVersionId.value
                })
            ).node as NodeReturnType<"getInterfaceDefinitionList", "ComponentVersion">;
            return [
                res.interfaceDefinitions.nodes.map((definition) => ({
                    ...definition,
                    name: definition.interfaceSpecificationVersion.interfaceSpecification.name,
                    description: definition.interfaceSpecificationVersion.interfaceSpecification.description,
                    version: definition.interfaceSpecificationVersion.version
                })),
                res.interfaceDefinitions.totalCount
            ];
        } else {
            const res = await client.getFilteredInterfaceDefinitionList({
                query: filter,
                count,
                componentVersion: componentVersionId.value
            });
            const definitions: InterfaceDefinition[] = [];
            for (const interfaceSpecification of res.searchInterfaceSpecifications) {
                for (const version of interfaceSpecification.versions.nodes) {
                    for (const definition of version.interfaceDefinitions.nodes) {
                        definitions.push({
                            ...definition,
                            name: interfaceSpecification.name,
                            description: interfaceSpecification.description,
                            version: version.version
                        });
                    }
                }
            }
            return [definitions, res.searchInterfaceSpecifications.length];
        }
    }
};
</script>
