<template>
    <BaseLayout>
        <template #content>
            <GropiusCard class="logout-container mt-5">
                <p class="text-center text-body-1 my-2">Logged in as {{ me?.displayName }} ({{ me?.username }})</p>
                <DefaultButton class="w-100" @click="logout"> Logout </DefaultButton>
            </GropiusCard>
        </template>
    </BaseLayout>
</template>
<script setup lang="ts">
import BaseLayout from "@/components/BaseLayout.vue";
import GropiusCard from "@/components/GropiusCard.vue";
import { useClient } from "@/graphql/client";
import { useAppStore } from "@/store/app";
import { withErrorMessage } from "@/util/withErrorMessage";
import { computedAsync } from "@vueuse/core";
import { Ref } from "vue";
import { useRouter } from "vue-router";

const store = useAppStore();
const client = useClient();
const router = useRouter();

function logout() {
    store.setNewTokenPair("", "");
    router.push({ name: "login" });
}

const me: Ref<any> = computedAsync(
    async () => {
        if (!(await store.isLoggedIn())) {
            return undefined;
        }
        const meResponse = await withErrorMessage(() => client.getCurrentUser(), "Could not load user data");
        return meResponse.currentUser;
    },
    undefined,
    { shallow: false }
);
</script>
<style scoped>
.logout-container {
    max-width: 500px;
    margin: 0 auto;
}

.text-middle {
    vertical-align: middle;
}
</style>
