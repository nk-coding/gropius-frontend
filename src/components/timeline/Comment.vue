<template>
    <TimelineItemBase>
        <div
            class="d-flex align-start"
            :class="{
                'mb-5': !newComment
            }"
        >
            <User v-if="item.createdBy" :user="item.createdBy" :show-name="false" size="x-large"></User>
            <v-icon
                v-else
                icon="mdi-account"
                color="background"
                size="x-large"
                class="backup-icon rounded-circle"
            ></v-icon>
            <v-hover>
                <template #default="{ isHovering, props }">
                    <v-sheet
                        :border="selected ? 'primary-container md medium-emphasis' : true"
                        class="flex-1-1 ml-2 overflow-hidden pa-3"
                        rounded="lger"
                        v-bind="props"
                    >
                        <v-sheet
                            v-if="!newComment"
                            class="d-flex align-center mx-n3 mt-n3 px-3 py-1 comment-top-bar"
                            :color="selected ? 'primary-container' : 'surface-container'"
                            rounded="lg"
                        >
                            <div
                                class="text-subtitle text-medium-emphasis flex-1-1"
                                :class="{
                                    'text-on-primary-container': selected,
                                    'text-decoration-line-through': isDeleted
                                }"
                            >
                                <User v-if="item.createdBy != undefined" :user="item.createdBy" :show-avatar="false" />
                                commented
                                <RelativeTimeWrapper :time="item.createdAt" />
                            </div>
                            <v-spacer />
                            <v-fade-transition>
                                <div v-show="issue?.comment && (isHovering || menuOpen)" class="flex-shrink-0">
                                    <IconButton :disabled="isDeleted || !issue?.comment" @click="reply">
                                        <v-icon icon="mdi-reply" />
                                        <v-tooltip activator="parent" location="top"> Reply </v-tooltip>
                                    </IconButton>
                                    <IconButton>
                                        <v-icon icon="mdi-dots-vertical" />
                                        <v-menu
                                            activator="parent"
                                            location="bottom end"
                                            @update:model-value="(isOpen) => (menuOpen = isOpen)"
                                        >
                                            <v-list>
                                                <v-list-item
                                                    :disabled="!canCurrentlyModify || editMode"
                                                    @click="activateEditMode"
                                                >
                                                    <v-list-item-title>Edit</v-list-item-title>
                                                    <template #prepend>
                                                        <v-icon icon="mdi-pencil" />
                                                    </template>
                                                </v-list-item>
                                                <v-list-item
                                                    :disabled="
                                                        !canCurrentlyModify ||
                                                        item.__typename === 'Body' ||
                                                        editMode ||
                                                        submitDisabled
                                                    "
                                                    @click=""
                                                >
                                                    <v-list-item-title>Delete</v-list-item-title>
                                                    <template #prepend>
                                                        <v-icon icon="mdi-delete" />
                                                    </template>
                                                    <ConfirmationDialog
                                                        title="Delete comment?"
                                                        message="Are you sure you want to delete this comment?"
                                                        confirm-text="Delete"
                                                        @confirm="deleteComment"
                                                    />
                                                </v-list-item>
                                            </v-list>
                                        </v-menu>
                                    </IconButton>
                                </div>
                            </v-fade-transition>
                        </v-sheet>
                        <v-expand-transition>
                            <div v-if="answers">
                                <v-card
                                    color="surface-container"
                                    rounded="lg"
                                    elevation="1"
                                    class="answer-card pa-3 d-flex align-center"
                                    :class="{
                                        'mt-3': !newComment
                                    }"
                                    @click="selectAnswers"
                                >
                                    <div class="flex-1-1 answer-wrapper">
                                        <div
                                            class="text-medium-emphasis text-subtitle flex-1-1"
                                            :class="{
                                                'text-decoration-line-through': isItemDeleted(answers)
                                            }"
                                        >
                                            <User v-if="answers.createdBy != undefined" :user="answers.createdBy" />
                                            commented
                                            <RelativeTimeWrapper :time="answers.createdAt" />
                                        </div>
                                        <div v-if="!isItemDeleted(answers)" class="text-ellipsis">
                                            {{ markdownToText(answers.body) }}
                                        </div>
                                        <div v-else class="text-medium-emphasis font-italic text-ellipsis">
                                            {{ deletedText }}
                                        </div>
                                    </div>
                                    <v-btn
                                        v-if="newComment"
                                        icon
                                        variant="plain"
                                        size="x-large"
                                        density="compact"
                                        class="mr-n3"
                                        color="error"
                                        @click="resetAnswers"
                                    >
                                        <v-icon icon="mdi-close-circle-outline" />
                                    </v-btn>
                                </v-card>
                            </div>
                        </v-expand-transition>
                        <Markdown
                            v-if="!isDeleted && (!!itemBody || editMode)"
                            v-model="itemBody"
                            :edit-mode="editMode"
                            :editable="canCurrentlyModify"
                            class="mt-2 ml-1"
                            @update:model-value="updatedItemBody($event)"
                        />
                        <div v-else class="mt-2 ml-1 text-medium-emphasis font-italic">
                            {{ isDeleted ? deletedText : noDescriptionText }}
                        </div>
                        <div v-if="editMode" class="mx-n3">
                            <v-divider />
                            <div class="d-flex justify-end mt-2">
                                <template v-if="!newComment">
                                    <DefaultButton
                                        variant="outlined"
                                        color="error"
                                        @click="!hasChanged && cancelComment()"
                                    >
                                        Cancel
                                        <ConfirmationDialog
                                            v-if="hasChanged"
                                            title="Discard changes?"
                                            message="Are you sure you want to discard your changes?"
                                            confirm-text="Discard"
                                            @confirm="cancelComment"
                                        />
                                    </DefaultButton>
                                    <DefaultButton
                                        color="primary"
                                        class="mx-3"
                                        :disabled="submitDisabled"
                                        @click="saveComment(itemBody)"
                                        >Save</DefaultButton
                                    >
                                </template>
                                <DefaultButton
                                    v-else
                                    color="primary"
                                    class="mx-3"
                                    :disabled="submitDisabled"
                                    @click="createComment"
                                >
                                    Comment
                                </DefaultButton>
                            </div>
                        </div>
                    </v-sheet>
                </template>
            </v-hover>
        </div>
    </TimelineItemBase>
</template>
<script setup lang="ts">
import { PropType, inject, ref, computed } from "vue";
import TimelineItemBase, { TimelineItemType } from "./TimelineItemBase.vue";
import User from "@/components/info/User.vue";
import RelativeTimeWrapper from "../RelativeTimeWrapper.vue";
import Markdown from "@/components/Markdown.vue";
import { useClient } from "@/graphql/client";
import { useBlockingWithErrorMessage, withErrorMessage } from "@/util/withErrorMessage";
import ConfirmationDialog from "@/components/dialog/ConfirmationDialog.vue";
import { markdownToText } from "@/util/markdownToText";
import { useRouter } from "vue-router";
import { issueKey } from "@/util/keys";
import { CommentTimelineInfoFragment } from "@/graphql/generated";

export type Comment = (
    | Omit<TimelineItemType<"IssueComment">, "createdBy">
    | Omit<TimelineItemType<"Body">, "createdBy">
) &
    Partial<Pick<TimelineItemType<"IssueComment">, "createdBy">>;

const props = defineProps({
    item: {
        type: Object as PropType<Comment>,
        required: true
    },
    newComment: {
        type: Boolean,
        default: false
    },
    selected: {
        type: Boolean,
        default: false
    },
    isModerator: {
        type: Boolean,
        required: true
    }
});
const emit = defineEmits<{
    (event: "updateItem", value: Comment): void;
    (event: "addItem", value: TimelineItemType<"IssueComment">): void;
    (event: "replyTo", value: string): void;
    (event: "resetAnswers"): void;
}>();

const issue = inject(issueKey);
const menuOpen = ref(false);
const editMode = ref(props.newComment);
const itemBody = ref(props.item.body);
const hasChanged = ref(false);
const client = useClient();
const router = useRouter();
const [blockWithErrorMessage, submitDisabled] = useBlockingWithErrorMessage();

const deletedText = "This comment has been deleted";
const noDescriptionText = "No description provided";

const answersId = computed(() => {
    const item = props.item;
    if (item.__typename === "IssueComment" && issue != undefined && item.answers?.id != undefined) {
        return item.answers?.id;
    }
    return null;
});

const answers = computed(() => {
    const id = answersId.value;
    if (id != undefined) {
        return issue?.value?.timelineItems?.nodes?.find((c) => c.id === id) as Comment;
    }
    return null;
});

const isDeleted = computed(() => {
    const item = props.item;
    return isItemDeleted(item);
});

const canCurrentlyModify = computed(() => {
    return props.isModerator && !isDeleted.value;
});

function isItemDeleted(item: Comment) {
    return item.__typename === "IssueComment" && item.isDeleted;
}

function activateEditMode() {
    editMode.value = true;
}

async function updatedItemBody(value: string) {
    hasChanged.value = true;
    if (canCurrentlyModify.value && !editMode.value) {
        saveComment(value);
    }
}

async function saveComment(newContent: string) {
    let newItem: CommentTimelineInfoFragment;
    if (props.item.__typename === "Body") {
        const newBody = await blockWithErrorMessage(
            () => client.updateBody({ id: props.item.id, body: newContent }),
            "Error updating body"
        );
        newItem = newBody.updateBody.body;
    } else {
        const newComment = await blockWithErrorMessage(
            () => client.updateIssueComment({ id: props.item.id, body: newContent }),
            "Error updating comment"
        );
        newItem = newComment.updateIssueComment.issueComment!;
    }
    props.item.bodyLastEditedAt = newItem.bodyLastEditedAt;
    props.item.bodyLastEditedBy = newItem.bodyLastEditedBy;
    props.item.body = newItem.body;
    editMode.value = false;
    hasChanged.value = false;
}

async function createComment() {
    const newComment = await blockWithErrorMessage(
        () => client.createIssueComment({ issue: issue?.value?.id!, body: itemBody.value, answers: answersId.value }),
        "Error creating comment"
    );
    emit("addItem", newComment.createIssueComment.issueComment!);
    itemBody.value = "";
}

function cancelComment() {
    itemBody.value = props.item.body;
    editMode.value = false;
}

function reply() {
    emit("replyTo", props.item.id);
}

function resetAnswers() {
    emit("resetAnswers");
}

function selectAnswers() {
    router.replace({
        query: {
            item: answersId.value
        }
    });
}

async function deleteComment() {
    const newItem = await blockWithErrorMessage(
        () => client.deleteIssueComment({ id: props.item.id }),
        "Error deleting comment"
    );
    emit("updateItem", newItem.deleteIssueComment.issueComment);
}
</script>
<style scoped>
.comment-top-bar {
    min-height: 45px;
}

.answer-card {
    border-left: solid 5px rgb(var(--v-theme-tertiary));
}

.answer-wrapper {
    min-width: 0;
}

.backup-icon {
    background: rgb(var(--v-theme-secondary));
}
</style>
