<template>
  <main class="chat-pending-page">
    <a-spin :spinning="showLockLoading" :tip="loadingTip">
      <a-result
        :status="resultStatus"
        :title="resultTitle"
        sub-title="6.3 阶段已接入 SDK 登录、全局事件与 initStore；主聊天布局将在 6.4 迁移。"
      >
        <template #extra>
          <div class="status-panel">
            <div>用户ID：{{ userStore.userID || "-" }}</div>
            <div>连接状态：{{ userStore.connectState }}</div>
            <div>同步状态：{{ userStore.syncState }}</div>
            <div>同步进度：{{ userStore.progress }}%</div>
            <div>未读数：{{ conversationStore.unReadCount }}</div>
            <div>会话数：{{ conversationStore.conversationList.length }}</div>
            <div>好友数：{{ contactStore.friendList.length }}</div>
            <div>群组数：{{ contactStore.groupList.length }}</div>
          </div>
        </template>
      </a-result>
    </a-spin>
  </main>
</template>

<script setup lang="ts">
import { computed, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";

import { registerGlobalEvents, tryLoginIM } from "@/im/events";
import { useContactStore } from "@/stores/contact";
import { useConversationStore } from "@/stores/conversation";
import { useUserStore } from "@/stores/user";
import { clearIMProfile, getChatToken, getIMToken, getIMUserID } from "@/utils/storage";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const conversationStore = useConversationStore();
const contactStore = useContactStore();

const showLockLoading = computed(
  () => userStore.isLogining || (userStore.reinstall && userStore.syncState === "loading"),
);
const loadingTip = computed(() =>
  userStore.isLogining ? "加载中" : `${userStore.progress}%`,
);
const resultStatus = computed(() =>
  userStore.connectState === "failed" || userStore.syncState === "failed" ? "error" : "success",
);
const resultTitle = computed(() =>
  userStore.connectState === "success" ? "SDK 已登录" : "SDK 登录中",
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
.chat-pending-page {
  height: 100%;
  overflow: auto;
  background: #f7f8fa;

  :deep(.ant-spin-nested-loading),
  :deep(.ant-spin-container) {
    min-height: 100%;
  }
}

.status-panel {
  display: inline-grid;
  min-width: 260px;
  grid-template-columns: 1fr;
  gap: 8px;
  padding: 16px 20px;
  text-align: left;
  color: #4b5563;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}
</style>
