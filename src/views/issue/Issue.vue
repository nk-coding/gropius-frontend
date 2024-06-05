<template>
    <IssueDialogs />
    <div v-if="issue" class="pl-3 pt-3 full-height d-flex flex-column">
        <div class="mb-5">
            <div class="d-flex">
                <IssueIcon :issue="issue" height="50px" class="mr-3"></IssueIcon>
                <div>
                    <div class="d-flex align-center">
                        <v-text-field v-if="editTitle" v-model="editTitleText" hide-details autofocus class="mr-3" />
                        <div v-else class="text-h4 mr-3">{{ issue.title }}</div>
                        <IconButton v-if="!!issue.manageIssues && !editTitle" @click="startEditTitle">
                            <v-icon icon="mdi-pencil" />
                            <v-tooltip activator="parent"> Edit title </v-tooltip>
                        </IconButton>
                        <template v-if="editTitle">
                            <DefaultButton variant="outlined" color="error" @click="cancelEditTitle">
                                Cancel
                            </DefaultButton>
                            <DefaultButton color="primary" class="mx-3" :disabled="disableSaveTitle" @click="saveTitle"
                                >Save</DefaultButton
                            >
                        </template>
                    </div>
                    <div class="text-medium-emphasis text-subtitle-1">
                        Opened by <User :user="issue.createdBy" /> <RelativeTimeWrapper :time="issue.createdAt" /> ·
                        last updated <RelativeTimeWrapper :time="issue.lastUpdatedAt" />
                    </div>
                </div>
            </div>
        </div>
        <div class="content d-flex flex-fill">
            <div class="timeline">
                <TimelineItem
                    v-for="item in timeline"
                    :ref="(el: any) => registerItemElement(item.id, el)"
                    :item="item"
                    :selected="item.id == selectedItem"
                    :is-moderator="issue.moderator"
                    @replyTo="replyToComment"
                    @updateItem="updateItem"
                />
                <TimelineBreak />
                <Comment
                    v-if="issue.comment"
                    ref="newComment"
                    :item="newCommentItem"
                    new-comment
                    is-moderator
                    class="mt-3"
                    @addItem="addComment"
                    @resetAnswers="resetAnswers"
                />
                <div class="pt-3" />
            </div>
            <v-sheet class="sidebar ml-8 mr-3 mb-3 pa-2" color="surface-container" rounded="xl">
                <EditableCompartment
                    name="Type"
                    :editable="!!issue.manageIssues"
                    close-on-value-change
                    :model-value="issue.type"
                >
                    <template #display>
                        <IssueType :type="issue.type" />
                    </template>
                    <template #edit>
                        <IssueTypeAutocomplete
                            class="mb-2"
                            autofocus
                            menu-mode="initial"
                            hide-details
                            :template="issue.template.id"
                            :initial-items="[issue.type]"
                            :model-value="issue.type.id"
                            @update:model-value="updateIssueType"
                        />
                    </template>
                </EditableCompartment>
                <v-divider class="mx-2" />
                <EditableCompartment
                    name="State"
                    :editable="!!issue.manageIssues"
                    close-on-value-change
                    :model-value="issue.state"
                >
                    <template #display>
                        <IssueState :state="issue.state" />
                    </template>
                    <template #edit>
                        <IssueStateAutocomplete
                            class="mb-2"
                            autofocus
                            hide-details
                            menu-mode="initial"
                            :template="issue.template.id"
                            :initial-items="[issue.state]"
                            :model-value="issue.state.id"
                            @update:model-value="updateIssueState"
                        />
                    </template>
                </EditableCompartment>
                <v-divider class="mx-2" />
                <EditableCompartment
                    name="Components & Projects"
                    :editable="!!issue.manageIssues"
                    close-on-value-change
                    :model-value="issue.state"
                >
                    <template #display>
                        <div class="d-flex flex-wrap ga-1">
                            <AffectedByIssue v-for="onTrackable in trackables" :affected-entity="onTrackable" />
                        </div>
                    </template>
                    <template #edit>
                        <div v-for="onTrackable in trackables">
                            <v-list-item
                                class="px-0 py-2"
                                :title="onTrackable.name"
                                :subtitle="onTrackable.description || 'No description provided'"
                            >
                                <template #title>
                                    <v-list-item-title class="mb-1">{{ onTrackable.name }}</v-list-item-title>
                                </template>
                                <template #prepend>
                                    <v-icon
                                        color="primary"
                                        class="mr-2 full-opacity"
                                        :icon="mapAffectedByIssueTypeToIcon(onTrackable.__typename)"
                                    />
                                </template>
                                <template #append>
                                    <IconButton
                                        @click="removeFromTrackable(onTrackable.id)"
                                        :disabled="onTrackable.id == trackable?.id"
                                    >
                                        <v-icon icon="mdi-close" />
                                        <v-tooltip activator="parent"> Remove from trackable </v-tooltip>
                                    </IconButton>
                                </template>
                            </v-list-item>
                            <v-divider />
                        </div>
                        <TrackableAutocomplete
                            :ignore="trackables.map((trackable) => trackable.id)"
                            :dependency="[trackables]"
                            :disabled="!issue.exportIssues"
                            :menu-mode="!!issue.exportIssues ? 'repeating' : undefined"
                            hide-details
                            class="mt-3 mb-2"
                            label="Add to trackable"
                            autofocus
                            auto-select-first
                            @selected-item="addToTrackable"
                        />
                    </template>
                </EditableCompartment>
                <v-divider class="mx-2" />
                <EditableCompartment name="Labels" :editable="!!issue.manageIssues">
                    <template #display>
                        <div class="d-flex flex-wrap ga-1">
                            <Label v-for="label in labels" :label="label" />
                        </div>
                    </template>
                    <template #edit>
                        <div v-for="label in labels">
                            <v-list-item
                                class="px-0 py-2"
                                :title="label.name"
                                :subtitle="label.description || 'No description provided'"
                            >
                                <template #title>
                                    <v-list-item-title class="mb-1">{{ label.name }}</v-list-item-title>
                                </template>
                                <template #prepend>
                                    <v-icon :color="label.color" class="mr-2 full-opacity" icon="mdi-circle " />
                                </template>
                                <template #append>
                                    <IconButton @click="removeLabel(label.id)">
                                        <v-icon icon="mdi-close" />
                                        <v-tooltip activator="parent"> Remove label </v-tooltip>
                                    </IconButton>
                                </template>
                            </v-list-item>
                            <v-divider />
                        </div>
                        <LabelAutocomplete
                            :issue="issueId"
                            :ignore="labels.map((label) => label.id)"
                            :dependency="[labels]"
                            menu-mode="repeating"
                            hide-details
                            class="mt-3 mb-2"
                            label="Add label"
                            autofocus
                            auto-select-first
                            @selected-item="addLabel"
                        />
                    </template>
                </EditableCompartment>
                <v-divider class="mx-2" />
                <TypedEditableCompartment
                    name="Assignments"
                    name-inline="assignment"
                    :editable="!!issue.manageIssues"
                    :items="assignments"
                    :edited-types="editedAssignmentTypes"
                    :type-name="(type) => type.name"
                    @remove-item="removeAssignment"
                    @toggle-type-edit="editedAssignmentTypes[$event] = !editedAssignmentTypes[$event]"
                >
                    <template #ItemInfo="{ item }">
                        <User :user="item.user" class="d-block my-2 ml-2" />
                    </template>
                    <template #EditedItemInfo="{ item }">
                        <User :user="item.user" class="d-block mb-2" />
                    </template>
                    <template #TypeAutocomplete="{ item }">
                        <AssignmentTypeAutocomplete
                            density="compact"
                            hide-details
                            autofocus
                            menu-mode="initial"
                            clearable
                            persistent-clear
                            class="mt-1 mb-3"
                            :template="issue.template.id"
                            :initial-items="item.type ? [item.type] : []"
                            :model-value="item.type?.id"
                            @update:model-value="updateAssignmentType(item, $event)"
                            @click:clear="removeAssignmentType(item)"
                        />
                    </template>
                    <template #ItemAutocomplete>
                        <GropiusUserAutocomplete
                            :filter="assignmentUserFilter"
                            label="Assign user"
                            class="mb-2"
                            hide-details
                            autofocus
                            @selected-item="assignUser"
                        />
                    </template>
                </TypedEditableCompartment>
                <v-divider class="mx-2" />
                <EditableCompartment
                    name="Priority"
                    :editable="!!issue.manageIssues"
                    close-on-value-change
                    :model-value="issue.priority"
                >
                    <template #display>
                        <IssuePriority v-if="issue.priority != undefined" :priority="issue.priority" />
                    </template>
                    <template #edit>
                        <IssuePriorityAutocomplete
                            class="mb-2"
                            autofocus
                            hide-details
                            menu-mode="initial"
                            :template="issue.template.id"
                            :initial-items="[issue.priority]"
                            :model-value="issue.priority?.id"
                            @update:model-value="updateIssuePriority"
                        />
                    </template>
                </EditableCompartment>
                <v-divider class="mx-2" />
                <TypedEditableCompartment
                    name="Outgoing Relations"
                    name-inline="relation"
                    :editable="!!issue.manageIssues"
                    :items="outgoingRelations"
                    :edited-types="editedRelationTypes"
                    :type-name="(type) => type.name"
                    @remove-item="removeOutgoingRelation"
                    @toggle-type-edit="editedRelationTypes[$event] = !editedRelationTypes[$event]"
                >
                    <template #ItemInfo="{ item }">
                        <IssueInfo
                            v-if="item.relatedIssue != undefined"
                            :issue="item.relatedIssue!"
                            class="d-block my-2 ml-2"
                        />
                    </template>
                    <template #EditedItemInfo="{ item }">
                        <IssueInfo
                            v-if="item.relatedIssue != undefined"
                            :issue="item.relatedIssue!"
                            class="d-block mb-2"
                        />
                    </template>
                    <template #TypeAutocomplete="{ item }">
                        <IssueRelationTypeAutocomplete
                            density="compact"
                            hide-details
                            autofocus
                            menu-mode="initial"
                            clearable
                            persistent-clear
                            class="mt-1 mb-3"
                            :template="issue.template.id"
                            :initial-items="item.type ? [item.type] : []"
                            :model-value="item.type?.id"
                            @update:model-value="updateRelationType(item, $event)"
                            @click:clear="removeRelationType(item)"
                        />
                    </template>
                    <template #ItemAutocomplete>
                        <ExternalIssueAutocomplete
                            label="Add related issue"
                            class="mb-2"
                            hide-details
                            autofocus
                            menu-mode="initial"
                            :initial-context="trackable ?? undefined"
                            @selected-item="addOutgoingRelation"
                        />
                    </template>
                </TypedEditableCompartment>
                <v-divider class="mx-2" />
                <TypedEditableCompartment
                    name="Incoming Relations"
                    name-inline="relation"
                    :editable="false"
                    :items="issue.incomingRelations.nodes"
                    :type-name="(type) => type.inverseName"
                >
                    <template #ItemInfo="{ item }">
                        <IssueInfo v-if="item.issue != undefined" :issue="item.issue!" class="d-block my-2 ml-2" />
                    </template>
                </TypedEditableCompartment>
                <v-divider class="mx-2" />
                <EditableCompartment name="Affects" :editable="!!issue.manageIssues">
                    <template #display>
                        <div v-for="itemGroup in groupedAffectedEntities">
                            <span class="text-subtitle-2">
                                {{ itemGroup?.type }}
                            </span>
                            <div>
                                <AffectedByIssue v-for="item in itemGroup.items" :affected-entity="item" class="mr-1" />
                            </div>
                        </div>
                    </template>
                    <template #edit>
                        <div v-for="affectedEntity in affectedEntities">
                            <v-list-item
                                class="px-0 py-2"
                                :subtitle="affectedEntity.description || 'No description provided'"
                            >
                                <template #title>
                                    <v-list-item-title class="mb-1">{{ affectedEntity.name }}</v-list-item-title>
                                </template>
                                <template #prepend>
                                    <v-icon
                                        color="primary"
                                        class="mr-2 full-opacity"
                                        :icon="mapAffectedByIssueTypeToIcon(affectedEntity.__typename)"
                                    />
                                </template>
                                <template #append>
                                    <IconButton @click="removeAffectedEntity(affectedEntity.id)">
                                        <v-icon icon="mdi-close" />
                                        <v-tooltip activator="parent"> Remove affected entity </v-tooltip>
                                    </IconButton>
                                </template>
                            </v-list-item>
                            <v-divider />
                        </div>
                        <AffectedByIssueAutocomplete
                            :dependency="[affectedEntities]"
                            :initial-context="trackable ?? undefined"
                            :ignore="affectedEntities.map((entity) => entity.id)"
                            menu-mode="repeating"
                            hide-details
                            class="mt-3 mb-2"
                            label="Add affected entity"
                            autofocus
                            auto-select-first
                            item-title="name"
                            item-value="id"
                            @selected-item="addAffectedEntity"
                        />
                    </template>
                </EditableCompartment>
                <template v-for="field in templatedFields" :key="field.name">
                    <v-divider class="mx-2" />
                    <TemplatedFieldEditableCompartment
                        :name="field.name"
                        :schema="field.schema"
                        :model-value="field.value"
                        :editable="!!issue.manageIssues"
                        @save="updateTemplatedField(field.name, $event)"
                    />
                </template>
            </v-sheet>
        </div>
    </div>
</template>
<script setup lang="ts">
import { NodeReturnType, useClient } from "@/graphql/client";
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { computedAsync } from "@vueuse/core";
import TimelineItem from "@/components/timeline/TimelineItem";
import IssueIcon from "@/components/IssueIcon.vue";
import User from "@/components/info/User.vue";
import RelativeTimeWrapper from "@/components/RelativeTimeWrapper.vue";
import { provide } from "vue";
import { useBlockingWithErrorMessage, withErrorMessage } from "@/util/withErrorMessage";
import TimelineBreak from "@/components/timeline/TimelineBreak.vue";
import { useAppStore } from "@/store/app";
import Comment, { Comment as CommentType } from "@/components/timeline/Comment.vue";
import { TimelineItemType } from "@/components/timeline/TimelineItemBase.vue";
import { nextTick } from "vue";
import EditableCompartment from "@/components/EditableCompartment.vue";
import Label from "@/components/info/Label.vue";
import IssueState from "@/components/info/IssueState.vue";
import IssueType from "@/components/info/IssueType.vue";
import IssuePriority from "@/components/info/IssuePriority.vue";
import {
    AssignmentTimelineInfoFragment,
    DefaultAffectedByIssueInfoFragment,
    DefaultIssueInfoFragment,
    DefaultLabelInfoFragment,
    DefaultTrackableInfoFragment,
    DefaultUserInfoFragment,
    GropiusUserFilterInput,
    OutgoingRelationTimelineInfoFragment
} from "@/graphql/generated";
import { issueKey, trackableKey } from "@/util/keys";
import IssueTypeAutocomplete from "@/components/input/IssueTypeAutocomplete.vue";
import IssueStateAutocomplete from "@/components/input/IssueStateAutocomplete.vue";
import IssuePriorityAutocomplete from "@/components/input/IssuePriorityAutocomplete.vue";
import IssueInfo from "@/components/info/Issue.vue";
import IssueRelationTypeAutocomplete from "@/components/input/IssueRelationTypeAutocomplete.vue";
import ExternalIssueAutocomplete from "@/components/input/ExternalIssueAutocomplete.vue";
import TypedEditableCompartment from "@/components/TypedEditableCompartment.vue";
import AssignmentTypeAutocomplete from "@/components/input/AssignmentTypeAutocomplete.vue";
import GropiusUserAutocomplete from "@/components/input/GropiusUserAutocomplete.vue";
import { inject } from "vue";
import AffectedByIssueAutocomplete from "@/components/input/AffectedByIssueAutocomplete.vue";
import LabelAutocomplete from "@/components/input/LabelAutocomplete.vue";
import AffectedByIssue from "@/components/info/AffectedByIssue.vue";
import TemplatedFieldEditableCompartment from "@/components/TemplatedFieldEditableCompartment.vue";
import { mapAffectedByIssueTypeToIcon } from "@/util/mapAffectedByIssueTypeToIcon";
import TrackableAutocomplete from "@/components/input/TrackableAutocomplete.vue";
import IssueDialogs from "@/components/IssueDialogs.vue";

export type Issue = NodeReturnType<"getIssue", "Issue">;

const client = useClient();
const route = useRoute();
const store = useAppStore();
const issueId = computed(() => route.params.issue as string);
const selectedItem = computed(() => route.query.item as string | undefined);
const trackable = inject(trackableKey);

const evaluating = ref(false);
const isReady = computed(() => !evaluating.value && issue.value != null);
const issueReloadDependency = ref(0);
const issue = computedAsync(
    async () => {
        if (!issueId.value) {
            return null;
        }
        const dependency = issueReloadDependency.value;
        const res = await withErrorMessage(
            () => client.getIssue({ id: issueId.value }),
            `Error loading issue: (${dependency})`
        );
        const issue = res.node as Issue;
        const timeline = issue.timelineItems.nodes;
        const body = timeline.find((item) => item.__typename == "Body")!;
        issue.timelineItems.nodes = [body, ...timeline.filter((item) => item.__typename != "Body")];
        return issue;
    },
    null,
    {
        evaluating,
        shallow: false
    }
);

const answers = ref<string | null>(null);
const newCommentItem = computed(() => {
    return {
        __typename: "IssueComment",
        body: "",
        createdBy: store.user,
        answers: answers.value ? { id: answers.value } : undefined
    } as CommentType;
});
const newComment = ref<InstanceType<typeof Comment> | null>(null);

const itemElementLookup = new Map<string, any>();

provide(issueKey, issue);

const timeline = computed(() => issue.value!.timelineItems.nodes);
const labels = computed(() => issue.value!.labels.nodes);
const trackables = computed(() => issue.value!.trackables.nodes);
const outgoingRelations = computed(() => issue.value!.outgoingRelations.nodes);
const assignments = computed(() => issue.value!.assignments.nodes);
const affectedEntities = computed(() => issue.value!.affects.nodes);

function addComment(comment: TimelineItemType<"IssueComment">) {
    timeline.value.push(comment);
    answers.value = null;
}

async function replyToComment(id: string) {
    answers.value = id;
    await nextTick();
    newComment.value?.$el?.scrollIntoView({ behavior: "smooth", block: "end" });
}

function resetAnswers() {
    answers.value = null;
}

function registerItemElement(id: string, element: any) {
    itemElementLookup.set(id, element);
}

watch([isReady, selectedItem], async ([newIsReady], [oldIsReady]) => {
    await nextTick();
    if (isReady.value && selectedItem.value) {
        const behavior = oldIsReady ? "smooth" : "auto";
        itemElementLookup.get(selectedItem.value)?.scrollIntoView({ behavior });
    }
});

function updateItem(item: TimelineItemType<any>) {
    const index = timeline.value.findIndex((i) => i.id == item.id);
    if (index != -1) {
        timeline.value.splice(index, 1, item);
    }
}

function addTimelineItem(item: TimelineItemType<any> | undefined | null) {
    if (item != undefined) {
        timeline.value.push(item);
    }
}

function reloadIssue() {
    issueReloadDependency.value++;
}

async function updateIssueType(type: string | null) {
    if (!type) {
        return;
    }
    const event = await withErrorMessage(async () => {
        const res = await client.changeIssueType({ issue: issueId.value, type });
        return res.changeIssueType.typeChangedEvent;
    }, "Error updating issue type");
    addTimelineItem(event);
    if (event != undefined) {
        issue.value!.type = event.newIssueType;
    } else {
        reloadIssue();
    }
}

async function updateIssueState(state: string | null) {
    if (!state) {
        return;
    }
    const event = await withErrorMessage(async () => {
        const res = await client.changeIssueState({ issue: issueId.value, state });
        return res.changeIssueState.stateChangedEvent;
    }, "Error updating issue state");
    addTimelineItem(event);
    if (event != undefined) {
        issue.value!.state = event.newState;
    } else {
        reloadIssue();
    }
}

async function updateIssuePriority(priority: string | null) {
    if (!priority) {
        return;
    }
    const event = await withErrorMessage(async () => {
        const res = await client.changeIssuePriority({ issue: issueId.value, priority: priority });
        return res.changeIssuePriority.priorityChangedEvent;
    }, "Error updating issue priority");
    addTimelineItem(event);
    if (event != undefined) {
        issue.value!.priority = event.newPriority;
    } else {
        reloadIssue();
    }
}

async function addLabel(label: DefaultLabelInfoFragment) {
    const labelId = label.id;
    const event = await withErrorMessage(async () => {
        const res = await client.addLabelToIssue({ issue: issueId.value, label: labelId });
        return res.addLabelToIssue.addedLabelEvent;
    }, "Error adding label to issue");
    addTimelineItem(event);
    if (event != undefined) {
        labels.value.push(event.addedLabel!);
    } else {
        reloadIssue();
    }
}

async function removeLabel(labelId: string) {
    const event = await withErrorMessage(async () => {
        const res = await client.removeLabelFromIssue({ issue: issueId.value, label: labelId });
        return res.removeLabelFromIssue.removedLabelEvent;
    }, "Error removing label from issue");
    addTimelineItem(event);
    const index = labels.value.findIndex((label) => label.id == labelId);
    if (index != -1) {
        labels.value.splice(index, 1);
    }
}

const editedAssignmentTypes = ref<Record<string, boolean>>({});

async function removeAssignment(relationId: string) {
    const event = await withErrorMessage(async () => {
        const res = await client.removeAssignment({ id: relationId });
        return res.removeAssignment.removedAssignmentEvent;
    }, "Error removing assignment from issue");
    addTimelineItem(event);
    const index = assignments.value.findIndex((relation) => relation.id == relationId);
    if (index != -1) {
        assignments.value.splice(index, 1);
    }
}

async function updateAssignmentType(assignment: AssignmentTimelineInfoFragment, type: string | null) {
    if (type == undefined) {
        return;
    }
    const event = await withErrorMessage(async () => {
        const res = await client.changeAssignmentType({ assignment: assignment.id, type });
        return res.changeAssignmentType.assignmentTypeChangedEvent;
    }, "Error updating assignment type");
    addTimelineItem(event);
    if (event != undefined) {
        assignment.type = event.newAssignmentType;
        editedAssignmentTypes.value[assignment.id] = false;
    } else {
        reloadIssue();
    }
}

async function removeAssignmentType(assignment: AssignmentTimelineInfoFragment) {
    const event = await withErrorMessage(async () => {
        const res = await client.changeAssignmentType({ assignment: assignment.id, type: null });
        return res.changeAssignmentType.assignmentTypeChangedEvent;
    }, "Error updating assignment type");
    addTimelineItem(event);
    assignment.type = undefined;
    editedAssignmentTypes.value[assignment.id] = false;
}

const assignmentUserFilter = computed(
    () => ({ hasNodePermission: { node: issueId.value, permission: "MANAGE_ISSUES" } }) as GropiusUserFilterInput
);

async function assignUser(user: DefaultUserInfoFragment) {
    const event = await withErrorMessage(async () => {
        const res = await client.createAssignment({ issue: issueId.value, user: user.id });
        return res.createAssignment.assignment;
    }, "Error creating assignment");
    addTimelineItem(event);
    if (event != undefined) {
        assignments.value.push(event);
        editedAssignmentTypes.value[event.id] = true;
    } else {
        reloadIssue();
    }
}

const editedRelationTypes = ref<Record<string, boolean>>({});

async function removeOutgoingRelation(relationId: string) {
    const event = await withErrorMessage(async () => {
        const res = await client.removeIssueRelation({ id: relationId });
        return res.removeIssueRelation.removedOutgoingRelationEvent;
    }, "Error removing outgoing relation from issue");
    addTimelineItem(event);
    const index = outgoingRelations.value.findIndex((relation) => relation.id == relationId);
    if (index != -1) {
        outgoingRelations.value.splice(index, 1);
    }
}

async function updateRelationType(relation: OutgoingRelationTimelineInfoFragment, type: string | null) {
    if (type == undefined) {
        return;
    }
    const event = await withErrorMessage(async () => {
        const res = await client.changeIssueRelationType({ issueRelation: relation.id, type });
        return res.changeIssueRelationType.outgoingRelationTypeChangedEvent;
    }, "Error updating issue relation type");
    addTimelineItem(event);
    if (event != undefined) {
        relation.type = event.newRelationType;
        editedRelationTypes.value[relation.id] = false;
    } else {
        reloadIssue();
    }
}

async function removeRelationType(relation: OutgoingRelationTimelineInfoFragment) {
    const event = await withErrorMessage(async () => {
        const res = await client.changeIssueRelationType({ issueRelation: relation.id, type: null });
        return res.changeIssueRelationType.outgoingRelationTypeChangedEvent;
    }, "Error updating issue relation type");
    addTimelineItem(event);
    relation.type = undefined;
    editedRelationTypes.value[relation.id] = false;
}

async function addOutgoingRelation(relatedIssue: DefaultIssueInfoFragment) {
    const event = await withErrorMessage(async () => {
        const res = await client.createIssueRelation({ issue: issueId.value, relatedIssue: relatedIssue.id });
        return res.createIssueRelation.issueRelation;
    }, "Error creating issue relation");
    addTimelineItem(event);
    if (event != undefined) {
        outgoingRelations.value.push(event);
        editedRelationTypes.value[event.id] = true;
    } else {
        reloadIssue();
    }
}

const editTitle = ref(false);
const editTitleText = ref("");
const [titleBlockWithErrorMessage, disableSaveTitle] = useBlockingWithErrorMessage();

function startEditTitle() {
    editTitleText.value = issue.value!.title;
    editTitle.value = true;
}

function cancelEditTitle() {
    editTitle.value = false;
}

async function saveTitle() {
    const event = await titleBlockWithErrorMessage(async () => {
        const res = await client.changeIssueTitle({ id: issueId.value, title: editTitleText.value });
        return res.changeIssueTitle.titleChangedEvent;
    }, "Error updating issue title");
    addTimelineItem(event);
    if (event != undefined) {
        issue.value!.title = event.newTitle;
        editTitle.value = false;
    } else {
        reloadIssue();
    }
}

const groupedAffectedEntities = computed(() => {
    const types = [
        "Project",
        "Component",
        "ComponentVersion",
        "Interface",
        "InterfaceSpecification",
        "InterfaceSpecificationVersion",
        "InterfacePart"
    ] as const;
    type Group = { type: (typeof types)[number]; items: DefaultAffectedByIssueInfoFragment[] };
    const groups = new Map<(typeof types)[number], Group>();
    for (const item of affectedEntities.value) {
        const group = groups.get(item.__typename);
        if (group) {
            group.items.push(item);
        } else {
            groups.set(item.__typename, {
                type: item.__typename,
                items: [item]
            });
        }
    }
    return types.map((type) => groups.get(type)).filter((group): group is Group => group != undefined);
});

async function addAffectedEntity(affectedEntity: DefaultAffectedByIssueInfoFragment) {
    const affectedEntityId = affectedEntity.id;
    const event = await withErrorMessage(async () => {
        const res = await client.addAffectedEntityToIssue({ issue: issueId.value, affectedEntity: affectedEntityId });
        return res.addAffectedEntityToIssue.addedAffectedEntityEvent;
    }, "Error adding affectedentity to issue");
    addTimelineItem(event);
    if (event != undefined) {
        affectedEntities.value.push(event.addedAffectedEntity!);
    } else {
        reloadIssue();
    }
}

async function removeAffectedEntity(affectedEntityId: string) {
    const event = await withErrorMessage(async () => {
        const res = await client.removeAffectedEntityFromIssue({
            issue: issueId.value,
            affectedEntity: affectedEntityId
        });
        return res.removeAffectedEntityFromIssue.removedAffectedEntityEvent;
    }, "Error removing affectedentity from issue");
    addTimelineItem(event);
    const index = affectedEntities.value.findIndex((affectedentity) => affectedentity.id == affectedEntityId);
    if (index != -1) {
        affectedEntities.value.splice(index, 1);
    }
}

const templatedFields = computed(() => {
    if (issue.value == undefined) {
        return [];
    }
    const templatedFieldsValues = new Map<string, any>();
    for (const field of issue.value.templatedFields) {
        templatedFieldsValues.set(field.name, field.value);
    }
    return issue.value.template.templateFieldSpecifications.map((field) => ({
        name: field.name,
        schema: field.value,
        value: templatedFieldsValues.get(field.name)
    }));
});

async function updateTemplatedField(name: string, value: any) {
    const event = await withErrorMessage(async () => {
        const res = await client.changeIssueTemplatedField({ input: { issue: issueId.value, name, value } });
        return res.changeIssueTemplatedField.templatedFieldChangedEvent;
    }, "Error updating templated field");
    addTimelineItem(event);
    const fields = issue.value!.templatedFields;
    for (const field of fields) {
        if (field.name == name) {
            field.value = event?.newValue ?? value;
            break;
        }
    }
}

async function addToTrackable(trackable: DefaultTrackableInfoFragment) {
    const trackableId = trackable.id;
    const event = await withErrorMessage(async () => {
        const res = await client.addIssueToTrackable({ issue: issueId.value, trackable: trackableId });
        return res.addIssueToTrackable.addedToTrackableEvent;
    }, "Error adding issue to component or project");
    addTimelineItem(event);
    if (event != undefined) {
        trackables.value.push(event.addedToTrackable!);
    } else {
        reloadIssue();
    }
}

async function removeFromTrackable(trackableId: string) {
    const event = await withErrorMessage(async () => {
        const res = await client.removeIssueFromTrackable({ issue: issueId.value, trackable: trackableId });
        return res.removeIssueFromTrackable.removedFromTrackableEvent;
    }, "Error removing issue from component or project");
    addTimelineItem(event);
    const index = trackables.value.findIndex((trackable) => trackable.id == trackableId);
    if (index != -1) {
        trackables.value.splice(index, 1);
    }
}
</script>
<style scoped lang="scss">
@use "@/styles/settings.scss";
@use "sass:map";

.type-icon {
    width: map.get(settings.$avatar-sizes, "large");
    height: map.get(settings.$avatar-sizes, "large");
}

.content {
    position: relative;
    overflow: auto;
}

.timeline {
    flex: 1 1;
    min-width: 0;
}

.sidebar {
    position: sticky;
    top: 0;
    right: 0;
    width: min(40%, 400px);
    max-height: calc(100% - 12px);
    height: fit-content;
    overflow-y: auto;
}
</style>
