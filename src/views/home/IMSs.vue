<template>
    <PaginatedList
        name="IMSs"
        :item-manager="itemManager"
        :sort-fields="sortFields"
        :to="(ims: IMS) => imsRoute(ims)"
        query-param-prefix=""
    >
        <template #item="{ item }">
            <ListItem
                :title="item.name"
                :subtitle="item.description || 'No description provided'"
                :italic-subtitle="!item.description"
            >
                <template #append>
                    <SyncSelfAllowedSwitch :target="item" />
                </template>
            </ListItem>
        </template>
        <CreateIMSDialog @created-ims="(ims: IdObject) => selectIMS(ims)" />
    </PaginatedList>
</template>
<script lang="ts" setup>
import PaginatedList, { ItemManager } from "@/components/PaginatedList.vue";
import { ClientReturnType, useClient } from "@/graphql/client";
import { RouteLocationRaw, useRouter } from "vue-router";
import ListItem from "@/components/ListItem.vue";
import CreateIMSDialog from "@/components/dialog/CreateIMSDialog.vue";
import { IdObject } from "@/util/types";
import { ImsOrder } from "@/graphql/generated";
import { ImsOrderField } from "@/graphql/generated";
import SyncSelfAllowedSwitch from "@/components/input/SyncSelfAllowedSwitch.vue";

type IMS = ClientReturnType<"getIMSList">["imss"]["nodes"][0];

const client = useClient();
const router = useRouter();

const sortFields = {
    Name: ImsOrderField.Name,
    Template: [ImsOrderField.TemplateName, ImsOrderField.TemplateId],
    "[Default]": ImsOrderField.Id
};

const itemManager: ItemManager<IMS, ImsOrderField> = {
    fetchItems: async function (
        filter: string | undefined,
        orderBy: ImsOrder[],
        count: number,
        page: number
    ): Promise<[IMS[], number]> {
        if (filter == undefined) {
            const res = await client.getIMSList({
                orderBy,
                count,
                skip: page * count
            });
            return [res.imss.nodes, res.imss.totalCount];
        } else {
            const res = await client.getFilteredIMSList({
                query: filter,
                count
            });
            return [res.searchIMSs, res.searchIMSs.length];
        }
    }
};

function selectIMS(ims: IdObject) {
    router.push(imsRoute(ims));
}

function imsRoute(ims: IdObject): RouteLocationRaw {
    return {
        name: "ims",
        params: {
            ims: ims.id
        }
    };
}
</script>
