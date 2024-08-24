<template>
    <PaginatedList
        name="IMS projects"
        :item-manager="itemManager"
        :sort-fields="sortFields"
        :to="(ims: IMSProject) => imsProjectRoute(ims)"
        query-param-prefix=""
    >
        <template #item="{ item }">
            <ListItem
                :title="item.name"
                :subtitle="item.description || 'No description provided'"
                :italic-subtitle="!item.description"
            >
                <template #append>
                    <SyncAllowedControls :target="item" />
                </template>
            </ListItem>
        </template>
        <CreateIMSProjectDialog
            :ims="ims"
            @created-ims-project="(imsProject: IdObject) => selectIMSProject(imsProject)"
        />
    </PaginatedList>
</template>
<script lang="ts" setup>
import PaginatedList, { ItemManager } from "@/components/PaginatedList.vue";
import { NodeReturnType, useClient } from "@/graphql/client";
import { RouteLocationRaw, useRoute, useRouter } from "vue-router";
import ListItem from "@/components/ListItem.vue";
import { IdObject } from "@/util/types";
import { DefaultImsProjectInfoFragment, ImsProjectOrder, ImsProjectOrderField } from "@/graphql/generated";
import SyncAllowedControls from "@/components/input/SyncAllowedControls.vue";
import { computed } from "vue";
import CreateIMSProjectDialog from "@/components/dialog/CreateIMSProjectDialog.vue";

type IMSProject = DefaultImsProjectInfoFragment;

const client = useClient();
const router = useRouter();
const route = useRoute();

const ims = computed(() => route.params.ims as string);

const sortFields = {
    Name: ImsProjectOrderField.Name,
    "[Default]": ImsProjectOrderField.Id
};

const itemManager: ItemManager<IMSProject, ImsProjectOrderField> = {
    fetchItems: async function (
        filter: string | undefined,
        orderBy: ImsProjectOrder[],
        count: number,
        page: number
    ): Promise<[IMSProject[], number]> {
        if (filter == undefined) {
            const res = (
                await client.getIMSProjectListFromIMS({
                    orderBy,
                    count,
                    skip: page * count,
                    ims: ims.value
                })
            ).node as NodeReturnType<"getIMSProjectListFromIMS", "IMS">;
            return [res.projects.nodes, res.projects.totalCount];
        } else {
            const res = await client.getFilteredIMSProjectList({
                query: filter,
                count,
                filter: { ims: { id: { eq: ims.value } } }
            });
            return [res.searchIMSProjects, res.searchIMSProjects.length];
        }
    }
};

function selectIMSProject(ims: IdObject) {
    router.push(imsProjectRoute(ims));
}

function imsProjectRoute(imsProject: IdObject): RouteLocationRaw {
    return {
        name: "ims-project-general",
        params: {
            ims: ims.value,
            project: imsProject.id
        }
    };
}
</script>
