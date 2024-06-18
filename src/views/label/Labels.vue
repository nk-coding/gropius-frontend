<template>
    <PaginatedList
        name="labels"
        :item-manager="itemManager"
        :sort-fields="sortFields"
        :to="() => undefined"
        :dependencies="modifiedLabels"
        query-param-prefix=""
    >
        <template #item="{ item }">
            <ListItem
                :title="item.name"
                :subtitle="item.description || 'No description provided'"
                :italic-subtitle="!item.description"
            >
                <template #prepend>
                    <v-icon :color="item.color" class="mr-2" icon="mdi-circle" />
                </template>
                <template #append>
                    <IconButton
                        :disabled="!(trackable?.manageLabels ?? false)"
                        @click="labelToUpdate = item"
                        class="mr-2"
                    >
                        <v-icon icon="mdi-pencil" />
                        <v-tooltip activator="parent" location="bottom">Edit label</v-tooltip>
                    </IconButton>
                    <IconButton :disabled="!(trackable?.manageLabels ?? false)">
                        <v-icon icon="mdi-close" />
                        <ConfirmationDialog
                            :title="`Remove label from ${nodeName}?`"
                            :message="`Are you sure you want to remove the label from this ${nodeName}?`"
                            confirm-text="Remove"
                            @confirm="removeLabel(item.id)"
                        />
                        <v-tooltip activator="parent" location="bottom">Remove label from {{ nodeName }}</v-tooltip>
                    </IconButton>
                </template>
            </ListItem>
        </template>
        <CreateLabelDialog :trackable="trackableId" @created-label="modifiedLabels.push($event.id)" />
        <UpdateLabelDialog
            :trackable="trackableId"
            v-model="labelToUpdate"
            @updated-label="modifiedLabels.push($event.id)"
        />
        <ImportLabelDialog :trackable="trackableId" @imported-label="modifiedLabels.push($event.id)" />
    </PaginatedList>
</template>
<script lang="ts" setup>
import ListItem from "@/components/ListItem.vue";
import PaginatedList, { ItemManager } from "@/components/PaginatedList.vue";
import ConfirmationDialog from "@/components/dialog/ConfirmationDialog.vue";
import CreateLabelDialog from "@/components/dialog/CreateLabelDialog.vue";
import ImportLabelDialog from "@/components/dialog/ImportLabelDialog.vue";
import UpdateLabelDialog from "@/components/dialog/UpdateLabelDialog.vue";
import { NodeReturnType, useClient } from "@/graphql/client";
import { LabelOrder, LabelOrderField } from "@/graphql/generated";
import { trackableKey } from "@/util/keys";
import { withErrorMessage } from "@/util/withErrorMessage";
import { inject } from "vue";
import { computed, ref } from "vue";
import { useRoute } from "vue-router";

type Trackable = NodeReturnType<"getLabelList", "Component">;
type Label = Trackable["labels"]["nodes"][0];

const client = useClient();
const route = useRoute();

const trackableId = computed(() => route.params.trackable as string);
const trackable = inject(trackableKey);
const modifiedLabels = ref<string[]>([]);
const labelToUpdate = ref<Label | undefined>();

const nodeName = computed(() => {
    if (route.name?.toString().startsWith("component")) {
        return "component";
    } else {
        return "project";
    }
});

const sortFields = {
    Name: LabelOrderField.Name,
    Color: LabelOrderField.Color
};

const itemManager: ItemManager<Label, LabelOrderField> = {
    fetchItems: async function (
        filter: string | undefined,
        orderBy: LabelOrder[],
        count: number,
        page: number
    ): Promise<[Label[], number]> {
        if (filter == undefined) {
            const res = await client.getLabelList({
                orderBy,
                count,
                skip: page * count,
                trackable: trackableId.value
            });
            const labels = (res.node as Trackable).labels;
            return [labels.nodes, labels.totalCount];
        } else {
            const res = await client.getFilteredLabelList({
                query: filter,
                count,
                trackable: trackableId.value
            });
            return [res.searchLabels, res.searchLabels.length];
        }
    }
};

async function removeLabel(labelId: string) {
    await withErrorMessage(async () => {
        await client.removeLabelFromTrackable({
            label: labelId,
            trackable: trackableId.value
        });
    }, "Error removing label from trackable");
    modifiedLabels.value.push(labelId);
}
</script>
