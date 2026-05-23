<template>
  <a-drawer
    :open="open"
    :title="t('placeholder.setting')"
    placement="right"
    root-class-name="chat-drawer"
    :width="450"
    :get-container="getContainer"
    :mask="false"
    :mask-style="{ opacity: 0 }"
    destroy-on-close
    @close="closeDrawer"
  >
    <div class="flex cursor-pointer items-center justify-between p-4" @click="openUserCard">
      <div class="flex items-center">
        <OIMAvatar :src="currentConversation?.faceURL" :text="currentConversation?.showName" />
        <div class="ml-3">{{ currentConversation?.showName }}</div>
      </div>
      <RightOutlined />
    </div>
    <a-divider class="m-0 border-4 border-[#F4F5F7]" />
    <div class="flex items-center justify-between px-4 py-3">
      <div>{{ t("placeholder.moveBlacklist") }}</div>
      <a-switch :checked="isBlack" @change="updateBlack" />
    </div>
    <a-divider class="m-0 border-4 border-[#F4F5F7]" />
    <div class="flex-1" />
    <div v-if="isFriend" class="flex w-full justify-center pb-3 pt-24">
      <a-button type="primary" danger @click="tryUnfriend">
        {{ t("placeholder.unfriend") }}
      </a-button>
    </div>
  </a-drawer>
</template>

<script setup lang="ts">
import { RightOutlined } from "@ant-design/icons-vue";
import type { WSEvent } from "@openim/wasm-client-sdk";
import { message, Modal } from "ant-design-vue";
import { computed } from "vue";

import OIMAvatar from "@/components/OIMAvatar.vue";
import { IMSDK } from "@/im/sdk";
import { ts as t } from "@/i18n";
import { useContactStore } from "@/stores/contact";
import { useConversationStore } from "@/stores/conversation";
import { emit as emitEvent } from "@/utils/events";

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  "update:open": [open: boolean];
}>();

const contactStore = useContactStore();
const conversationStore = useConversationStore();

const currentConversation = computed(() => conversationStore.currentConversation);
const isBlack = computed(() =>
  contactStore.blackList.some((black) => black.userID === currentConversation.value?.userID),
);
const isFriend = computed(() =>
  contactStore.friendList.some((friend) => friend.userID === currentConversation.value?.userID),
);

const getContainer = () => document.querySelector("#chat-container") as HTMLElement;

const closeDrawer = () => {
  emit("update:open", false);
};

const openUserCard = () => {
  emitEvent("OPEN_USER_CARD", { userID: currentConversation.value?.userID });
};

const updateBlack = async () => {
  if (!currentConversation.value?.userID) return;
  const execFunc = async () => {
    try {
      if (isBlack.value) {
        await IMSDK.removeBlack(currentConversation.value!.userID);
      } else {
        await IMSDK.addBlack({ toUserID: currentConversation.value!.userID });
      }
      contactStore.getBlackListByReq();
    } catch (error) {
      message.error((error as WSEvent).errMsg ?? t("toast.updateBlackStateFailed"));
    }
  };
  if (!isBlack.value) {
    Modal.confirm({
      title: t("placeholder.moveBlacklist"),
      content: `${t("toast.confirmMoveBlacklist")} ${t("placeholder.willFilterThisUserMessage")}`,
      onOk: execFunc,
    });
    return;
  }
  await execFunc();
};

const tryUnfriend = () => {
  if (!currentConversation.value?.userID) return;
  Modal.confirm({
    title: t("placeholder.unfriend"),
    content: t("toast.confirmUnfriend"),
    onOk: async () => {
      try {
        await IMSDK.deleteFriend(currentConversation.value!.userID);
      } catch (error) {
        message.error((error as WSEvent).errMsg ?? t("toast.unfriendFailed"));
      }
    },
  });
};
</script>
