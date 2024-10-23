<template>
    <v-autocomplete
        v-model:search="search"
        v-model:menu="menu"
        v-model="<any>proxiedModel"
        :items="items"
        :multiple="contextMode"
        :chips="contextMode"
        item-value="id"
        :filter-keys="['id']"
        :custom-filter="(_value, _query, item) => item?.value != context?.id"
        :menu-props="{ maxWidth: 0 }"
        @update:focused="resetFromFocus"
    >
        <template #item="{ props, item }">
            <v-list-item v-if="item.value == 'new'" v-bind="props" title="Create new" append-icon="mdi-plus" />
            <slot
                v-else-if="!contextSearchMode && item.value != context?.id"
                name="item"
                :props="props"
                :item="<ListItem<T>>item"
            ></slot>
            <slot v-else-if="contextSearchMode" name="context-item" :props="props" :item="<ListItem<C>>item"></slot>
            <div v-else class="placeholder-item" />
        </template>
        <template v-if="$slots.chip" #chip="{ props, item }">
            <slot name="chip" v-bind="props" :item="<ListItem<T | C>>item" />
        </template>
    </v-autocomplete>
</template>
<script setup lang="ts" generic="T extends IdObject, C extends IdObject">
import { IdObject } from "@/util/types";
import { onMounted, Ref, watch, ref, PropType, computed, nextTick } from "vue";

export interface ListItem<T> {
    raw: T;
    value: string;
    title: string;
}

interface NewItem {
    id: "new";
}

const props = defineProps({
    mode: {
        type: String as PropType<"model" | "add" | "add-context">,
        required: true
    },
    menuMode: {
        type: String as PropType<"initial" | "repeating">,
        required: false
    },
    menuDelay: {
        type: Number as PropType<number>,
        required: false,
        default: 0
    },
    fetch: {
        type: Function as PropType<(filter: string, count: number, context?: C) => Promise<T[]>>,
        required: true
    },
    contextFetch: {
        type: Function as PropType<(filter: string, count: number) => Promise<C[]>>,
        required: false
    },
    dependency: {
        type: [String, Number, Array, Object],
        required: false,
        default: () => []
    },
    initialItems: {
        type: Array as PropType<T[]>,
        required: false,
        default: () => []
    },
    initialContext: {
        type: Object as PropType<C>,
        required: false
    },
    createNew: {
        type: Boolean,
        default: false
    },
    createNewContext: {
        type: Boolean,
        default: false
    }
});

const model = defineModel({
    type: String as PropType<string | undefined>,
    required: false
});

const emit = defineEmits<{
    (event: "selected-item", value: T): void;
    (event: "create-new", value: string, context: C | undefined): void;
    (event: "create-new-context", value: string): void;
}>();

const context = ref(props.initialContext ? transformToContextItem(props.initialContext as C) : undefined) as Ref<
    C | undefined
>;
const contextMode = computed(() => props.mode == "add-context");
const contextSearchMode = computed(() => {
    return contextMode.value && context.value == undefined;
});
const createNewItem = computed<[NewItem] | []>(() => {
    if (props.mode == "model") {
        return [];
    }
    if ((contextSearchMode.value && props.createNewContext) || (!contextSearchMode.value && props.createNew)) {
        return [{ id: "new" }];
    }
    return [];
});
const initialContextModel = computed(() => {
    if (contextMode.value) {
        if (context.value != undefined) {
            return [context.value];
        } else {
            return [];
        }
    } else {
        return [];
    }
});
const initialItems = computed(() => {
    const items = [];
    items.push(...createNewItem.value);
    if (contextMode.value) {
        items.push(...initialContextModel.value);
    } else {
        items.push(...props.initialItems);
    }
    return [...props.initialItems, ...createNewItem.value];
});
const items = ref(contextMode.value ? initialContextModel.value : props.initialItems) as Ref<(T | C | NewItem)[]>;
const search = ref<undefined | string>("");
const menu = ref<boolean>(!!props.menuMode && !props.menuDelay);
const updatedModelValue = ref(false);

const proxiedModel = ref(contextMode.value ? initialContextModel.value.map((it) => it.id) : model.value);
watch(model, (model) => {
    proxiedModel.value = model;
});
watch(
    () => proxiedModel.value,
    (newModel) => {
        if (newModel != model.value) {
            selectedElement(newModel);
        }
    }
);
watch(
    () => props.initialItems,
    (initialItems) => {
        if (!contextMode.value) {
            items.value.push(...initialItems.filter((item) => !items.value.some((it) => it.id == item.id)));
        }
    }
);

const hasSelection = computed(() => {
    return props.mode == "model" && proxiedModel.value != undefined;
});

watch(search, async (search) => {
    if (!updatedModelValue.value) {
        await updateSearch(search ?? "");
    } else {
        updatedModelValue.value = false;
    }
});

watch(
    () => props.dependency,
    async () => {
        await updateSearch(search.value ?? "");
    }
);

async function updateSearch(search: string) {
    let newItems: (T | C)[];
    if (contextSearchMode.value) {
        newItems = (await props.contextFetch!(search, 10)).map((item) => transformToContextItem(item));
    } else {
        const untransformedContext =
            context.value != undefined ? untransformContextItem(context.value as C) : undefined;
        newItems = await props.fetch(search, 10, untransformedContext);
    }
    if (props.mode == "model" && proxiedModel.value != undefined) {
        if (!newItems.some((item) => item.id == proxiedModel.value)) {
            const currentModelItem = items.value.find((item) => item.id == proxiedModel.value);
            if (currentModelItem != undefined) {
                newItems.push(currentModelItem as T);
            }
        }
    }

    if (contextMode.value && !contextSearchMode.value) {
        items.value = [...createNewItem.value, context.value as C, ...newItems];
    } else {
        items.value = [...createNewItem.value, ...newItems];
    }
}

function resetFromFocus(focused: boolean) {
    if (focused && hasSelection.value) {
        resetSearch();
    }
}

async function resetSearch() {
    updatedModelValue.value = true;
    updateSearch("");
}

function selectedElement(value: any) {
    let id: string | undefined;
    const reopenMenu =
        props.menuMode == "repeating" ||
        (props.menuMode == "initial" && props.mode == "add-context" && value.length == 1);
    if (typeof value === "string") {
        id = value;
    } else if (Array.isArray(value)) {
        id = value.at(-1);
    } else {
        id = undefined;
    }
    const item = items.value.find((item) => item.id == id);
    if (props.mode == "model") {
        model.value = id;
        if (item != undefined) {
            emit("selected-item", item as T);
        }
        resetSearch();
    } else if (props.mode == "add") {
        if (item != undefined) {
            if (item.id == "new") {
                emit("create-new", search.value ?? "", undefined);
            } else {
                emit("selected-item", item as T);
            }
        }
        proxiedModel.value = undefined;
        search.value = "";
    } else {
        if (value.length == 0) {
            context.value = undefined;
        } else if (value.length == 1) {
            if (id == "new") {
                emit("create-new-context", search.value ?? "");
                (proxiedModel.value as string[]).pop();
            } else {
                context.value = item as C;
                items.value = [context.value as C, ...createNewItem.value];
            }
        } else {
            if (id == "new") {
                emit("create-new", search.value ?? "", untransformContextItem(context.value as C));
            } else if (item != undefined) {
                emit("selected-item", item as T);
            }
            (proxiedModel.value as string[]).pop();
        }
        search.value = "";
        menu.value = false;
    }

    if (reopenMenu) {
        nextTick(() => {
            setTimeout(() => {
                updateSearch("");
                menu.value = true;
            }, 10);
        });
    }
}

function transformToContextItem(item: C): C {
    return {
        ...item,
        id: `context-${item.id}`
    };
}

function untransformContextItem(item: C): C {
    return {
        ...item,
        id: item.id.replace("context-", "")
    };
}

onMounted(async () => {
    if (!!props.menuMode && props.menuDelay > 0) {
        setTimeout(() => {
            menu.value = true;
        }, props.menuDelay);
    }
    await updateSearch("");
});
</script>
<style scoped>
.placeholder-item {
    height: 1px;
    pointer-events: none;
}
</style>
