<template>
    <div class="markdown-editor-viewer">
        <task-lists
            sortable
            :disabled="!editable"
            @task-lists-check="handleTaskListsCheck($event.detail)"
            @task-lists-move="handleTaskListsMove($event.detail)"
        >
            <Viewer v-if="!editMode" :value="valueWrapper" :plugins="plugins"></Viewer>
            <Editor
                v-else
                :key="theme.current.value.dark"
                :value="valueWrapper"
                :plugins="plugins"
                :editor-config="editorConfig"
                @change="handleChange"
            ></Editor>
        </task-lists>
    </div>
</template>
<script setup lang="ts">
import gfm from "@bytemd/plugin-gfm";
import { Editor, Viewer } from "@bytemd/vue-next";
import { ref, watch } from "vue";
import "codemirror/theme/midnight.css";
import { useTheme } from "vuetify/lib/framework.mjs";
import { computed } from "vue";
import "bytemd/dist/index.css";
import "@github/task-lists-element";
import { BytemdPlugin } from "bytemd";
import type { Position, Point } from "unist";
import { Plugin } from "unified";
import type { Root } from "mdast";
import { SKIP, visit } from "unist-util-visit";
import { shallowRef } from "vue";
import { useAppStore } from "@/store/app";

interface RequiredPosition {
    start: Required<Point>;
    end: Required<Point>;
}

interface ListItemInformation {
    pos: RequiredPosition | undefined;
    checked: boolean | null | undefined;
}

type ListItemPos = [number, number];

const props = defineProps({
    editMode: {
        type: Boolean,
        default: false
    },
    editable: {
        type: Boolean,
        required: true
    }
});

const model = defineModel({
    type: String,
    required: false,
    default: ""
});

const theme = useTheme();
const valueWrapper = ref(model.value);
const store = useAppStore();

const editorConfig = computed(() => {
    return {
        theme: theme.current.value.dark ? "midnight" : "default"
    };
});

const listInformation = shallowRef<ListItemInformation[][]>([]);

function handleChange(text: string) {
    valueWrapper.value = text;
    model.value = text;
}

function handleTaskListsCheck({ position, checked }: { position: [number, number]; checked: boolean }) {
    try {
        const newValue = checkItem(position, checked, valueWrapper.value);
        handleChange(newValue);
    } catch (e) {
        store.pushError("Failed to check item");
        console.error(e);
    }
}

function handleTaskListsMove({ src, dst }: { src: [number, number]; dst: [number, number] }) {
    try {
        const newValue = moveItem(src, dst, valueWrapper.value);
        handleChange(newValue);
    } catch (e) {
        store.pushError("Failed to move item");
        console.error(e);
    }
}

watch(model, (value) => {
    valueWrapper.value = value;
});

const listInformationPlugin: Plugin<void[], Root> = () => {
    return (tree: Root) => {
        const newListInformation: ListItemInformation[][] = [];
        visit(tree, "list", (node) => {
            newListInformation.push(
                node.children.map((child) => {
                    return {
                        pos: validatePosition(child.position),
                        checked: child.checked
                    };
                })
            );
        });
        listInformation.value = newListInformation;
    };
};

const plugins: BytemdPlugin[] = [
    gfm(),
    {
        viewerEffect(context) {
            const element = context.markdownBody;
            element.querySelectorAll("ul.contains-task-list > li > input").forEach((input) => {
                input.classList.add("task-list-item-checkbox");
                input.removeAttribute("disabled");
            });
        },
        remark: (processor) => processor.use(listInformationPlugin)
    }
];

function validatePosition(pos: Position | undefined): RequiredPosition | undefined {
    if (pos?.start?.offset == undefined || pos?.end?.offset == undefined) {
        return undefined;
    }
    return pos as RequiredPosition;
}

function checkItem(position: ListItemPos, checked: boolean, source: string): string {
    const [list, index] = position;
    const itemInformation = listInformation.value[list]?.[index];
    const start = itemInformation?.pos?.start?.offset;
    if (start == undefined) {
        throw new Error("Item not found");
    }
    const bracketsPos = source.indexOf("[", start);
    if (bracketsPos === -1) {
        throw new Error("Square brackets not found");
    }
    const newContent = checked ? "x" : " ";
    return source.slice(0, bracketsPos + 1) + newContent + source.slice(bracketsPos + 2);
}

function moveItem(src: ListItemPos, dest: ListItemPos, source: string): string {
    const srcInfo = listInformation.value[src[0]]?.[src[1]];
    const destList = listInformation.value[dest[0]];
    if (srcInfo?.pos == undefined || destList == undefined) {
        throw new Error("Src or target not found");
    }
    const destFirstPos = destList[0]?.pos;
    if (destFirstPos == undefined) {
        throw new Error("Target list is empty or position is not available");
    }
    const srcIndentation = calculateIndentation(srcInfo.pos, source);
    let destIndentation = calculateIndentation(destFirstPos, source);
    const [srcText, srcPos] = extractListItem(srcInfo.pos, source);
    const indentedSrcText = changeIndentation(srcText, destIndentation - srcIndentation);
    let destLinePos = calculateDestLinePos(dest, destList, source);
    const transformedText = transformText(source, indentedSrcText, srcPos, srcText.length, destLinePos);
    if (transformedText.endsWith("\n") && !source.endsWith("\n")) {
        return transformedText.slice(0, -1);
    } else {
        return transformedText;
    }
}

function calculateDestLinePos(dest: ListItemPos, destList: ListItemInformation[], source: string) {
    let destLinePos = -1;
    let destListIndex = dest[1];
    if (destListIndex < destList.length) {
        const destInfo = destList[destListIndex].pos;
        if (destInfo == undefined) {
            throw new Error("Target position not found");
        }
        destLinePos = destInfo.start.offset;
    } else {
        const destInfo = destList[destList.length - 1].pos;
        if (destInfo == undefined) {
            throw new Error("Target position not found");
        }
        const insertPos = source.indexOf("\n", destInfo.end.offset);
        if (insertPos > -1) {
            destLinePos = insertPos;
        }
    }
    return destLinePos;
}

function transformText(source: string, text: string, srcPos: number, srcLength: number, destLinePos: number) {
    const srcRemovedText = source.slice(0, srcPos) + source.slice(srcPos + srcLength);
    if (destLinePos == -1) {
        return srcRemovedText + "\n" + text;
    } else {
        const lineStartPos = source.lastIndexOf("\n", destLinePos);
        const transformedLineStartPos = destLinePos > srcPos ? lineStartPos - srcLength : lineStartPos;
        let transformedText = text;
        return (
            srcRemovedText.slice(0, transformedLineStartPos + 1) +
            transformedText +
            srcRemovedText.slice(transformedLineStartPos + 1)
        );
    }
}

function calculateIndentation(itemStartPos: RequiredPosition, source: string): number {
    const length = itemStartPos.start.column - 1;
    const lineStart = itemStartPos.start.offset - length;
    let indentation = 0;
    for (let i = 0; i < length; i++) {
        const char = source[lineStart + i];
        if (char === "\t") {
            indentation += 4;
        } else if (char === " ") {
            indentation++;
        }
    }
    return indentation;
}

function extractListItem(pos: RequiredPosition, source: string): [string, number] {
    const start = pos.start.offset - pos.start.column + 1;
    const end = pos.end.offset;
    const endLineEndPos = source.indexOf("\n", end);
    let text: string;
    if (endLineEndPos == -1) {
        text = source.slice(start);
    } else {
        text = source.slice(start, endLineEndPos + 1);
    }
    if (!text.endsWith("\n")) {
        text += "\n";
    }
    return [text, start];
}

function changeIndentation(text: string, indentationDiff: number): string {
    const lines = text.split("\n");
    if (indentationDiff >= 0) {
        return lines
            .map((line) => {
                if (line == "") {
                    return "";
                }
                return " ".repeat(indentationDiff) + line;
            })
            .join("\n");
    } else {
        return removeIndentation(lines, -indentationDiff);
    }
}

function removeIndentation(lines: string[], diff: number): string {
    return lines
        .map((line) => {
            let currentIndentation = 0;
            let startPos = 0;
            for (let i = 0; i < line.length; i++) {
                let additionalIndentation = 0;
                if (line[i] === " ") {
                    additionalIndentation = 1;
                } else if (line[i] === "\t") {
                    additionalIndentation = 4;
                } else {
                    break;
                }
                if (currentIndentation + additionalIndentation <= diff) {
                    currentIndentation += additionalIndentation;
                    startPos++;
                } else {
                    break;
                }
            }
            return line.slice(startPos);
        })
        .join("\n");
}
</script>
<style lang="scss">
.v-theme--light {
    .markdown-editor-viewer {
        @import "github-markdown-css/github-markdown-light";
    }
}
.v-theme--dark {
    .markdown-editor-viewer {
        @import "github-markdown-css/github-markdown-dark";
    }
}

.markdown-body {
    background: none !important;
    font-family: "Roboto", sans-serif !important;

    h1 {
        font-weight: 400 !important;
    }
    h2 {
        font-weight: 450 !important;
    }
    h3,
    h4,
    h5,
    h6 {
        font-weight: 500 !important;
    }

    .contains-task-list {
        padding: 0 !important;

        .task-list-item {
            padding: 2px 15px 2px 42px;
            margin-right: -15px;
            margin-left: -15px;

            &.hovered .handle {
                display: block;
                float: left;
                width: 20px;
                padding: 2px 0 0 2px;
                margin-left: -43px;

                .drag-handle {
                    fill: rgb(var(--v-theme-on-surface-container));
                }
            }
        }
        li:not(.task-list-item) {
            margin-left: 24px;
        }
    }
}

.bytemd {
    height: max(300px, 30vh);
    border: none;
    background-color: unset;
    color: rgb(var(--v-theme-on-surface-container));

    .CodeMirror {
        background: none !important;
    }

    .bytemd-toolbar {
        background: none !important;
    }

    .bytemd-toolbar-right [bytemd-tippy-path="4"] {
        display: none;
    }

    .bytemd-toolbar-right [bytemd-tippy-path="5"] {
        display: none;
    }

    & > * {
        border-color: rgba(var(--v-border-color), var(--v-border-opacity)) !important;
    }
}

.bytemd-body > * {
    border-color: rgba(var(--v-border-color), var(--v-border-opacity)) !important;
}
</style>
<style></style>
