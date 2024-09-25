<template>
    <PaginatedList
        name="versions"
        :item-manager="itemManager"
        :sort-fields="sortFields"
        :to="
            (interfaceSpecificationVersion: InterfaceSpecificationVersion) =>
                interfaceSpecificationVersionRoute(interfaceSpecificationVersion)
        "
        query-param-prefix=""
    >
        <template #item="{ item }">
            <ListItem
                :title="item.name"
                :subtitle="item.description || 'No description provided'"
                :italic-subtitle="!item.description"
            />
        </template>
        <CreateInterfaceSpecificationVersionDialog
            :interfaceSpecification="interfaceSpecificationId"
            @created-interface-specification-version="
                (interfaceSpecificationVersion: IdObject) =>
                    selectInterfaceSpecificationVersion(interfaceSpecificationVersion)
            "
        />
    </PaginatedList>
</template>
<script lang="ts" setup>
import PaginatedList, { ItemManager } from "@/components/PaginatedList.vue";
import { NodeReturnType, useClient } from "@/graphql/client";
import { InterfaceSpecificationVersionOrder, InterfaceSpecificationVersionOrderField } from "@/graphql/generated";
import { RouteLocationRaw, useRoute, useRouter } from "vue-router";
import ListItem from "@/components/ListItem.vue";
import { computed } from "vue";
import CreateInterfaceSpecificationVersionDialog from "@/components/dialog/CreateInterfaceSpecificationVersionDialog.vue";
import { IdObject } from "@/util/types";

type InterfaceSpecificationVersion = NodeReturnType<
    "getInterfaceSpecificationVersionList",
    "InterfaceSpecification"
>["versions"]["nodes"][0];

const client = useClient();
const router = useRouter();
const route = useRoute();
const interfaceSpecificationId = computed(() => route.params.interfaceSpecification as string);

const sortFields = {
    Name: InterfaceSpecificationVersionOrderField.Name,
    "[Default]": InterfaceSpecificationVersionOrderField.Id
};

const itemManager: ItemManager<InterfaceSpecificationVersion, InterfaceSpecificationVersionOrderField> = {
    fetchItems: async function (
        filter: string | undefined,
        orderBy: InterfaceSpecificationVersionOrder[],
        count: number,
        page: number
    ): Promise<[InterfaceSpecificationVersion[], number]> {
        if (filter == undefined) {
            const res = (
                await client.getInterfaceSpecificationVersionList({
                    orderBy,
                    count,
                    skip: page * count,
                    interfaceSpecification: interfaceSpecificationId.value
                })
            ).node as NodeReturnType<"getInterfaceSpecificationVersionList", "InterfaceSpecification">;
            return [res.versions.nodes!, res.versions.totalCount];
        } else {
            const res = await client.getFilteredInterfaceSpecificationVersionList({
                query: filter,
                count,
                interfaceSpecification: interfaceSpecificationId.value
            });
            return [res.searchInterfaceSpecificationVersions, res.searchInterfaceSpecificationVersions.length];
        }
    }
};

function selectInterfaceSpecificationVersion(interfaceSpecificationVersion: IdObject) {
    router.push(interfaceSpecificationVersionRoute(interfaceSpecificationVersion));
}

function interfaceSpecificationVersionRoute(interfaceSpecificationVersion: IdObject): RouteLocationRaw {
    return {
        name: "interface-specification-version-general",
        params: {
            interfaceSpecificationVersion: interfaceSpecificationVersion.id
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
