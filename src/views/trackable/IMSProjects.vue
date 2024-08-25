<template>
    <PaginatedList
        name="IMS projects"
        :item-manager="itemManager"
        :sort-fields="sortFields"
        :to="
            (imsProject: IMSProject) => (imsProject.ims ? imsProjectRoute(imsProject.id, imsProject.ims.id) : undefined)
        "
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
        <CreateIMSProjectDialog
            :trackable="trackable"
            @created-ims-project="(imsProject) => selectIMSProject(imsProject)"
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
import SyncSelfAllowedSwitch from "@/components/input/SyncSelfAllowedSwitch.vue";
import { computed } from "vue";
import CreateIMSProjectDialog from "@/components/dialog/CreateIMSProjectDialog.vue";

type IMSProject = DefaultImsProjectInfoFragment;

const client = useClient();
const router = useRouter();
const route = useRoute();

const trackable = computed(() => route.params.trackable as string);

const sortFields = {
    Name: ImsProjectOrderField.Name,
    IMS: [ImsProjectOrderField.ImsName, ImsProjectOrderField.ImsId],
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
                await client.getIMSProjectListFromTrackable({
                    orderBy,
                    count,
                    skip: page * count,
                    trackable: trackable.value
                })
            ).node as NodeReturnType<"getIMSProjectListFromTrackable", "Component">;
            return [res.syncsTo.nodes, res.syncsTo.totalCount];
        } else {
            const res = await client.getFilteredIMSProjectList({
                query: filter,
                count,
                filter: { trackable: { id: { eq: trackable.value } } }
            });
            return [res.searchIMSProjects, res.searchIMSProjects.length];
        }
    }
};

function selectIMSProject(imsProject: IdObject & { ims: IdObject }) {
    router.push(imsProjectRoute(imsProject.id, imsProject.ims.id));
}

function imsProjectRoute(id: string, ims: string): RouteLocationRaw {
    return {
        name: "ims-project-general",
        params: {
            ims,
            project: id
        }
    };
}
</script>
