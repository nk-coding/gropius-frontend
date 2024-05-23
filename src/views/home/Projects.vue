<template>
    <PaginatedList
        name="projects"
        :item-manager="itemManager"
        :sort-fields="Object.keys(sortFields)"
        :to="(project: Project) => projectRoute(project)"
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
        <CreateProjectDialog @created-project="(project: IdObject) => selectProject(project)" />
    </PaginatedList>
</template>
<script lang="ts" setup>
import PaginatedList, { ItemManager } from "@/components/PaginatedList.vue";
import { ClientReturnType, useClient } from "@/graphql/client";
import { ProjectOrderField, OrderDirection } from "@/graphql/generated";
import { RouteLocationRaw, useRouter } from "vue-router";
import ListItem from "@/components/ListItem.vue";
import CreateProjectDialog from "@/components/dialog/CreateProjectDialog.vue";
import { IdObject } from "@/util/types";

type Project = ClientReturnType<"getProjectList">["projects"]["nodes"][0];

const client = useClient();
const router = useRouter();

const sortFields = {
    Name: ProjectOrderField.Name,
    "[Default]": ProjectOrderField.Id
};

const itemManager: ItemManager<Project, keyof typeof sortFields> = {
    fetchItems: async function (
        filter: string | undefined,
        sortField: keyof typeof sortFields,
        sortAscending: boolean,
        count: number,
        page: number
    ): Promise<[Project[], number]> {
        if (filter == undefined) {
            const res = await client.getProjectList({
                orderBy: {
                    field: sortFields[sortField],
                    direction: sortAscending ? OrderDirection.Asc : OrderDirection.Desc
                },
                count,
                skip: page * count
            });
            return [res.projects.nodes, res.projects.totalCount];
        } else {
            const res = await client.getFilteredProjectList({
                query: filter,
                count
            });
            return [res.searchProjects, res.searchProjects.length];
        }
    }
};

function selectProject(project: IdObject) {
    router.push(projectRoute(project));
}

function projectRoute(project: IdObject): RouteLocationRaw {
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
