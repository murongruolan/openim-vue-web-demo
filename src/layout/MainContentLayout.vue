<template>
  <a-spin :spinning="showLockLoading" :tip="loadingTip" class="main-spin">
    <a-layout class="main-layout">
      <TopSearchBar />
      <a-layout class="main-body">
        <LeftNavBar />
        <RouterView />
      </a-layout>
    </a-layout>
  </a-spin>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";

import { registerGlobalEvents, tryLoginIM } from "@/im/events";
import { useUserStore } from "@/stores/user";
import { clearIMProfile, getChatToken, getIMToken, getIMUserID } from "@/utils/storage";

import LeftNavBar from "./components/LeftNavBar.vue";
import TopSearchBar from "./components/TopSearchBar.vue";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();

const showLockLoading = computed(
  () => userStore.isLogining || (userStore.reinstall && userStore.syncState === "loading"),
);
const loadingTip = computed(() =>
  userStore.isLogining ? "登录中..." : `${userStore.progress}%`,
);

onMounted(async () => {
  const metaProfile = route.meta.imProfile as
    | { imToken: string; userID: string; chatToken: string }
    | undefined;
  const [imToken, userID, chatToken] = metaProfile
    ? [metaProfile.imToken, metaProfile.userID, metaProfile.chatToken]
    : await Promise.all([getIMToken(), getIMUserID(), getChatToken()]);

  if (!imToken || !userID) {
    await clearIMProfile();
    router.push("/login");
    return;
  }

  userStore.imToken = imToken;
  userStore.userID = userID;
  userStore.chatToken = chatToken ?? "";

  registerGlobalEvents();
  await tryLoginIM();
});
</script>

<style scoped lang="scss">
.main-spin {
  height: 100%;

  :deep(.ant-spin-container) {
    height: 100%;
  }
}

.main-layout {
  height: 100%;
  overflow: hidden;
}

.main-body {
  min-height: 0;
  flex: 1;
}
</style>
