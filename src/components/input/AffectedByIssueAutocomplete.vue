<template>
    <FetchingAutocomplete
        mode="add-context"
        :fetch="searchAffected"
        :context-fetch="searchTrackables"
        placeholder="Search component/project"
        :item-title="(item: any) => item.name ?? item.title"
        item-value="id"
        :initial-context="initialContext"
    >
        <template #item="{ props, item }">
            <v-list-item
                v-bind="props"
                :title="affectedByIssueName(item.raw)"
                :subtitle="affectedByIssueDescription(item.raw)"
            >
                <template #prepend>
                    <v-icon color="primary" class="opacity-100 mr-2" :icon="affectedByIssueIcon(item.raw.__typename)" />
                </template>
            </v-list-item>
        </template>
        <template #context-item="{ props, item }">
            <v-list-item v-bind="props" :title="item.raw.name" :subtitle="item.raw.description">
                <template #prepend>
                    <v-icon color="primary" class="opacity-100 mr-2" :icon="affectedByIssueIcon(item.raw.__typename)" />
                </template>
            </v-list-item>
        </template>
    </FetchingAutocomplete>
</template>
<script setup lang="ts">
import { ClientReturnType, NodeReturnType, useClient } from "@/graphql/client";
import { DefaultAffectedByIssueInfoFragment, DefaultTrackableInfoFragment } from "@/graphql/generated";
import { withErrorMessage } from "@/util/withErrorMessage";
import FetchingAutocomplete from "./FetchingAutocomplete.vue";
import { transformSearchQuery } from "@/util/searchQueryTransformer";
import { PropType } from "vue";
import { affectedByIssueDescription, affectedByIssueIcon, affectedByIssueName } from "@/util/affectedByIssueUtils";

const props = defineProps({
    initialContext: {
        type: Object as PropType<Readonly<DefaultTrackableInfoFragment>>,
        required: false
    },
    ignore: {
        type: Array as PropType<string[]>,
        required: false,
        default: () => []
    }
});

const client = useClient();

async function searchAffected(
    filter: string,
    count: number,
    context?: DefaultTrackableInfoFragment
): Promise<DefaultAffectedByIssueInfoFragment[]> {
    const searchRes = await withErrorMessage(async () => {
        const query = transformSearchQuery(filter);
        if (query != undefined) {
            const res = await client.searchAffectedByIssues({
                query,
                count,
                trackable: context!.id,
                sublistCount: 100
            });
            return expandSearchResult(res.searchAffectedByIssues);
        } else if (context!.__typename == "Component") {
            const res = (await client.firstComponentVersions({ component: context!.id, count: count - 1 }))
                .node as NodeReturnType<"firstComponentVersions", "Component">;
            return [context!, ...res.versions.nodes];
        } else {
            return [context!];
        }
    }, "Error searching affectable entities");
    const ignoredIds = new Set(props.ignore);
    return searchRes.filter((item) => !ignoredIds.has(item.id));
}

function expandSearchResult(
    items: ClientReturnType<"searchAffectedByIssues">["searchAffectedByIssues"]
): DefaultAffectedByIssueInfoFragment[] {
    const lookup = new Map<string, DefaultAffectedByIssueInfoFragment>();
    for (const item of items) {
        lookup.set(item.id, item);
        if (item.__typename == "Component") {
            for (const version of item.versions.nodes) {
                lookup.set(version.id, {
                    ...version,
                    __typename: "ComponentVersion",
                    component: item
                });
            }
        }
        if (item.__typename == "InterfaceSpecification") {
            for (const version of item.versions.nodes) {
                const mappedVersion = {
                    ...version,
                    __typename: "InterfaceSpecificationVersion",
                    interfaceSpecification: item
                } as const;
                lookup.set(version.id, mappedVersion);
                for (const definition of version.interfaceDefinitions.nodes) {
                    if (definition.visibleInterface != undefined) {
                        lookup.set(definition.visibleInterface.id, {
                            id: definition.visibleInterface.id,
                            __typename: "Interface",
                            interfaceDefinition: {
                                interfaceSpecificationVersion: mappedVersion
                            }
                        });
                    }
                }
            }
        }
        if (item.__typename == "InterfaceSpecificationVersion") {
            for (const definition of item.interfaceDefinitions.nodes) {
                if (definition.visibleInterface != undefined) {
                    lookup.set(definition.visibleInterface.id, {
                        id: definition.visibleInterface.id,
                        __typename: "Interface",
                        interfaceDefinition: {
                            interfaceSpecificationVersion: item
                        }
                    });
                }
            }
        }
    }
    return [...lookup.values()];
}

async function searchTrackables(filter: string, count: number): Promise<DefaultTrackableInfoFragment[]> {
    return await withErrorMessage(async () => {
        const query = transformSearchQuery(filter);
        if (query != undefined) {
            const res = await client.searchTrackables({ query, count });
            return res.searchTrackables;
        } else {
            const res = await client.firstTrackables({ count });
            return res.trackables.nodes;
        }
    }, "Error searching trackables");
}
</script>
