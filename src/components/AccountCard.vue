<template>
    <v-card color="surface-elevated-3" rounded="lger" class="mt-2 pa-3 account-card" elevation="4">
        <v-window v-model="windowPage">
            <v-window-item :value="1">
                <div class="d-flex flex-column align-center">
                    <img :src="user.avatar" class="large-avatar rounded-circle mb-2" />
                    <p class="text-h5 text-on-surface text-ellipsis max-width-100">Hi {{ user.displayName }}</p>
                    <p class="text-medium-emphasis">
                        {{ user.username }}
                    </p>
                    <p v-if="user.email" class="text-medium-emphasis text-ellipsis">
                        {{ user.email }}
                    </p>
                    <DefaultButton variant="outlined" class="mt-3 w-100" @click="showAccounts"
                        >Manage linked accounts</DefaultButton
                    >
                    <DefaultButton variant="tonal" class="mt-3 w-100" @click="logout">Logout</DefaultButton>
                </div>
            </v-window-item>
            <v-window-item :value="2">
                <div>
                    <div class="d-flex align-center">
                        <IconButton @click="windowPage = 1">
                            <v-icon icon="mdi-arrow-left" />
                            <v-tooltip activator="parent" location="top">Back</v-tooltip>
                        </IconButton>
                        <span class="text-h6">Linked accounts</span>
                        <v-spacer />
                        <User :user="user" :show-tooltip="false" :show-name="false" size="large" />
                    </div>
                    <v-sheet
                        v-for="account in accounts"
                        :key="account.id"
                        rounded="lger"
                        color="surface-container-low"
                        class="py-2 my-3 d-flex align-center"
                    >
                        <v-list-item
                            :title="account.strategyInstance.name"
                            :subtitle="account.description"
                            lines="one"
                            class="w-100 pr-1 pl-3"
                        >
                            <template #append>
                                <IconButton>
                                    <v-icon icon="mdi-cog" />
                                    <v-tooltip activator="parent">Settings</v-tooltip>
                                </IconButton>
                            </template>
                        </v-list-item>
                    </v-sheet>
                    <DefaultButton variant="tonal" class="w-100" :href="oauthUrl">Add account</DefaultButton>
                </div>
            </v-window-item>
        </v-window>
    </v-card>
</template>
<script setup lang="ts">
import { ClientReturnType } from "@/graphql/client";
import { useAppStore } from "@/store/app";
import axios from "axios";
import { PropType, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import User from "./info/User.vue";
import { buildOAuthUrl } from "@/util/oauth";
import { TokenScope } from "@/util/oauth";
import { computedAsync } from "@vueuse/core";

interface Account {
    id: string;
    strategyInstance: {
        id: string;
        name: string;
        type: string;
    };
    description: string;
}

defineProps({
    user: {
        type: Object as PropType<ClientReturnType<"getCurrentUser">["currentUser"] & object>,
        required: true
    }
});

const store = useAppStore();
const route = useRoute();
const router = useRouter();

const windowPage = ref(1);
const accounts = ref<Account[]>([]);

const oauthUrl = computedAsync(async () => {
    return buildOAuthUrl([TokenScope.LOGIN_SERVICE_REGISTER], route.fullPath);
}, undefined);

function logout() {
    store.setNewTokenPair("", "");
    router.push({
        name: "home",
        force: true
    });
}

async function showAccounts() {
    accounts.value = (
        await axios.get("/auth/api/login/user/self/loginData", {
            headers: {
                Authorization: `Bearer ${await store.getAccessToken()}`
            }
        })
    ).data;
    windowPage.value = 2;
}
</script>
<style scoped>
.large-avatar {
    width: 80px;
    height: 80px;
}

.account-card {
    width: 300px;
    overflow: hidden !important;
}

.max-width-100 {
    max-width: 100%;
}
</style>
