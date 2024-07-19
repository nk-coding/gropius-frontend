import { readonly, ref, Ref, watch } from "vue";

export function useCachedRef<T>(baseRef: Ref<T>) {
    const cache = ref(baseRef.value) as Ref<T>;
    watch(baseRef, (value) => {
        if (value != undefined) {
            cache.value = value;
        }
    });
    return readonly(cache);
}
