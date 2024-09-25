<template>
    <PaginatedList
        name="interface specifications"
        :item-manager="itemManager"
        :sort-fields="sortFields"
        :to="(interfaceSpecification: InterfaceSpecification) => interfaceSpecificationRoute(interfaceSpecification)"
        query-param-prefix=""
    >
        <template #item="{ item }">
            <ListItem
                :title="item.name"
                :subtitle="item.description || 'No description provided'"
                :italic-subtitle="!item.description"
            />
        </template>
        <CreateInterfaceSpecificationDialog
            :component="trackableId"
            @created-interface-specification="
                (interfaceSpecification: IdObject) => selectInterfaceSpecification(interfaceSpecification)
            "
        />
    </PaginatedList>
</template>
<script lang="ts" setup>
import PaginatedList, { ItemManager } from "@/components/PaginatedList.vue";
import { NodeReturnType, useClient } from "@/graphql/client";
import { InterfaceSpecificationOrder, InterfaceSpecificationOrderField } from "@/graphql/generated";
import { RouteLocationRaw, useRoute, useRouter } from "vue-router";
import ListItem from "@/components/ListItem.vue";
import CreateInterfaceSpecificationDialog from "@/components/dialog/CreateInterfaceSpecificationDialog.vue";
import { IdObject } from "@/util/types";
import { computed } from "vue";

type InterfaceSpecification = NodeReturnType<
    "getInterfaceSpecificationList",
    "Component"
>["interfaceSpecifications"]["nodes"][0];

const client = useClient();
const router = useRouter();
const route = useRoute();
const trackableId = computed(() => route.params.trackable as string);

const sortFields = {
    Name: InterfaceSpecificationOrderField.Name,
    Template: [InterfaceSpecificationOrderField.TemplateName, InterfaceSpecificationOrderField.TemplateId],
    "[Default]": InterfaceSpecificationOrderField.Id
};

const itemManager: ItemManager<InterfaceSpecification, InterfaceSpecificationOrderField> = {
    fetchItems: async function (
        filter: string,
        orderBy: InterfaceSpecificationOrder[],
        count: number,
        page: number
    ): Promise<[InterfaceSpecification[], number]> {
        if (filter == undefined) {
            const res = (
                await client.getInterfaceSpecificationList({
                    orderBy,
                    count,
                    skip: page * count,
                    component: trackableId.value
                })
            ).node as NodeReturnType<"getInterfaceSpecificationList", "Component">;
            return [res.interfaceSpecifications.nodes, res.interfaceSpecifications.totalCount];
        } else {
            const res = await client.getFilteredInterfaceSpecificationList({
                query: filter,
                count,
                component: trackableId.value
            });
            return [res.searchInterfaceSpecifications, res.searchInterfaceSpecifications.length];
        }
    }
};

function selectInterfaceSpecification(interfaceSpecification: IdObject) {
    router.push(interfaceSpecificationRoute(interfaceSpecification));
}

function interfaceSpecificationRoute(interfaceSpecification: IdObject): RouteLocationRaw {
    return {
        name: "interface-specification-versions",
        params: {
            interfaceSpecification: interfaceSpecification.id
        }
    };
}
</script>
