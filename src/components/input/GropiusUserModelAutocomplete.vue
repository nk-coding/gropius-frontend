<template>
    <FetchingAutocomplete mode="model" :fetch="searchGropiusUsers" :label="label" item-title="displayName" chips>
        <template #item="{ props, item }">
            <v-list-item :title="item.raw.displayName" :subtitle="item.raw.username ?? ''" v-bind="props">
                <template #prepend>
                    <User :user="item.raw" :show-name="false" class="mr-2" />
                </template>
            </v-list-item>
        </template>
        <template #chip="{ item }">
            <User :user="<DefaultUserInfoFragment>item.raw" :show-tooltip="false" />
        </template>
    </FetchingAutocomplete>
</template>
<script setup lang="ts">
import { DefaultUserInfoFragment, GropiusUserFilterInput } from "@/graphql/generated";
import FetchingAutocomplete from "./FetchingAutocomplete.vue";
import User from "../info/User.vue";
import { PropType } from "vue";
import { transformSearchQuery } from "@/util/searchQueryTransformer";
import { withErrorMessage } from "@/util/withErrorMessage";
import { useClient } from "@/graphql/client";

const props = defineProps({
    label: {
        type: String,
        required: false,
        default: "User"
    },
    filter: {
        type: Object as PropType<GropiusUserFilterInput>,
        required: false
    }
});

const client = useClient();

async function searchGropiusUsers(filter: string, count: number): Promise<DefaultUserInfoFragment[]> {
    return await withErrorMessage(async () => {
        const query = transformSearchQuery(filter);
        if (query != undefined) {
            const res = await client.searchGropiusUsers({ query, count, filter: props.filter });
            return res.searchGropiusUsers;
        } else {
            return [];
        }
    }, "Error searching users");
}
</script>
