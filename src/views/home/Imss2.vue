<template>
    <PaginatedList
        name="imss"
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
            />
        </template>
        <CreateProjectDialog @created-project="(project: IdObject) => selectProject(project)" />
    </PaginatedList>
</template>
<script lang="ts" setup>
import PaginatedList, { ItemManager } from "@/components/PaginatedList.vue";
import { ClientReturnType, useClient } from "@/graphql/client";
import { ProjectOrderField, ProjectOrder } from "@/graphql/generated";
import { RouteLocationRaw, useRouter } from "vue-router";
import ListItem from "@/components/ListItem.vue";
import CreateProjectDialog from "@/components/dialog/CreateProjectDialog.vue";
import { IdObject } from "@/util/types";
import { ImsOrder } from "@/graphql/generated";
import { ImsOrderField } from "@/graphql/generated";

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

function selectProject(project: IdObject) {
    router.push(imsRoute(project));
}

function imsRoute(project: IdObject): RouteLocationRaw {
    return {
        name: "project",
        params: {
            trackable: project.id
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
