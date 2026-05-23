<template>
  <a-layout id="chat-container" class="relative overflow-hidden">
    <a-layout-header class="chat-header relative border-b border-b-[var(--gap-text)] !bg-white !px-3">
      <div class="flex h-full items-center leading-none">
        <div class="flex flex-1 items-center overflow-hidden">
          <OIMAvatar
            :src="currentConversation?.faceURL"
            :text="currentConversation?.showName"
            :isgroup="Boolean(currentConversation?.groupID)"
          />
          <div class="ml-3 flex !h-10.5 flex-1 flex-col justify-between overflow-hidden">
            <div class="truncate text-base font-semibold">
              {{ currentConversation?.showName }}
            </div>
            <div
              v-if="isGroupSession && currentUserIsInGroup"
              class="flex items-center text-xs text-[var(--sub-text)]"
            >
              <img width="20" :src="groupMemberIcon" alt="member" />
              <span>{{ currentGroupInfo?.memberCount }}</span>
            </div>
          </div>
        </div>
        <div class="mr-5 flex">
          <a-tooltip v-if="isSingleSession" :title="t('placeholder.createGroup')">
            <img
              class="ml-5 cursor-pointer"
              width="20"
              :src="launchGroupIcon"
              alt=""
              @click="emitChooseModal"
            />
          </a-tooltip>
          <a-tooltip v-if="isGroupSession && inGroup" :title="t('placeholder.invitation')">
            <img
              class="ml-5 cursor-pointer"
              width="20"
              :src="launchGroupIcon"
              alt=""
              @click="emitChooseModal"
            />
          </a-tooltip>
          <a-tooltip :title="t('placeholder.setting')">
            <img
              class="ml-5 cursor-pointer"
              width="20"
              :src="settingsIcon"
              alt=""
              @click="openSetting"
            />
          </a-tooltip>
        </div>
      </div>
    </a-layout-header>

    <ChatContent />

    <footer id="chat-footer" class="relative bg-white py-px">
      <div class="flex h-full flex-col border-t border-t-[var(--gap-text)]">
        <div class="flex items-center px-4.5 pt-2">
          <label class="mr-5 flex cursor-pointer">
            <input
              class="hidden"
              type="file"
              accept="image/*"
              multiple
              @change="sendImageMessage"
            />
            <img width="20" :src="imageIcon" alt="" />
          </label>
          <a-popover
            v-if="isSingleSession"
            v-model:open="rtcPopoverOpen"
            :arrow="false"
            trigger="click"
            placement="top"
          >
            <template #content>
              <div class="p-1">
                <div
                  v-for="item in callList"
                  :key="item.idx"
                  class="flex cursor-pointer items-center rounded px-3 py-2 text-xs hover:bg-[var(--primary-active)]"
                  @click="prepareCall(item.idx)"
                >
                  <img width="20" :src="item.icon" alt="call" />
                  <div class="ml-3 text-[#515E70]">{{ item.title }}</div>
                </div>
              </div>
            </template>
            <img class="cursor-pointer" width="20" :src="rtcIcon" alt="" />
          </a-popover>
        </div>
        <div class="relative flex flex-1 flex-col overflow-hidden">
          <textarea
            v-model="editorValue"
            class="message-editor"
            @keydown="handleEditorKeydown"
          />
          <div class="flex items-center justify-end py-2 pr-3">
            <a-button class="w-fit px-6 py-1" type="primary" @click="enterToSend">
              {{ t("placeholder.send") }}
            </a-button>
          </div>
        </div>
      </div>
    </footer>

    <SingleSettingDrawer v-model:open="singleSettingOpen" />
    <GroupSettingDrawer v-model:open="groupSettingOpen" />
  </a-layout>
</template>

<script setup lang="ts">
import { SessionType } from "@openim/wasm-client-sdk";
import { computed, onUnmounted, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { v4 as uuidV4 } from "uuid";

import imageIcon from "@/assets/images/chatFooter/image.png";
import callAudioIcon from "@/assets/images/chatFooter/call_audio.png";
import callVideoIcon from "@/assets/images/chatFooter/call_video.png";
import rtcIcon from "@/assets/images/chatFooter/rtc.png";
import groupMemberIcon from "@/assets/images/chatHeader/group_member.png";
import launchGroupIcon from "@/assets/images/chatHeader/launch_group.png";
import settingsIcon from "@/assets/images/chatHeader/settings.png";
import OIMAvatar from "@/components/OIMAvatar.vue";
import { IMSDK } from "@/im/sdk";
import { getImageMessage, sendMessage } from "@/im/message";
import { ts as t } from "@/i18n";
import GroupSettingDrawer from "@/pages/common/GroupSettingDrawer.vue";
import SingleSettingDrawer from "@/pages/common/SingleSettingDrawer.vue";
import { useConversationStore } from "@/stores/conversation";
import { useUserStore } from "@/stores/user";
import { getCleanText } from "@/utils/editor";
import { emit } from "@/utils/events";

import ChatContent from "./components/ChatContent.vue";

const route = useRoute();
const conversationStore = useConversationStore();
const userStore = useUserStore();
const editorValue = ref("");
const singleSettingOpen = ref(false);
const groupSettingOpen = ref(false);
const rtcPopoverOpen = ref(false);

const currentConversation = computed(() => conversationStore.currentConversation);
const currentGroupInfo = computed(() => conversationStore.currentGroupInfo);
const currentUserIsInGroup = computed(() =>
  Boolean(conversationStore.currentMemberInGroup?.userID),
);
const inGroup = computed(() => Boolean(conversationStore.currentMemberInGroup?.groupID));
const isSingleSession = computed(
  () => currentConversation.value?.conversationType === SessionType.Single,
);
const isGroupSession = computed(
  () => currentConversation.value?.conversationType === SessionType.Group,
);
let readTimer: number | undefined;

const callList = computed(() => [
  { idx: 0, title: t("placeholder.videoCall"), icon: callVideoIcon },
  { idx: 1, title: t("placeholder.voiceCall"), icon: callAudioIcon },
]);

const syncCurrentConversation = async () => {
  const conversationID = route.params.conversationID as string | undefined;
  if (!conversationID) return;
  const conversation = conversationStore.conversationList.find(
    (item) => item.conversationID === conversationID,
  );
  if (conversation) {
    await conversationStore.updateCurrentConversation({ ...conversation });
  }
};

const emitChooseModal = () => {
  emit("OPEN_CHOOSE_MODAL", {
    type: isSingleSession.value ? "CRATE_GROUP" : "INVITE_TO_GROUP",
    extraData: isSingleSession.value
      ? currentConversation.value
        ? [{ ...currentConversation.value }]
        : []
      : currentConversation.value?.groupID,
  });
};

const openSetting = () => {
  if (isGroupSession.value) {
    groupSettingOpen.value = true;
    return;
  }
  singleSettingOpen.value = true;
};

const prepareCall = (idx: number) => {
  const conversation = currentConversation.value;
  if (!conversation?.userID) return;
  const mediaType = idx ? "audio" : "video";
  emit("OPEN_RTC_MODAL", {
    invitation: {
      inviterUserID: userStore.selfInfo.userID,
      inviteeUserIDList: [conversation.userID],
      groupID: "",
      roomID: uuidV4(),
      timeout: 60,
      mediaType,
      sessionType: SessionType.Single,
      platformID: 5,
    },
    participant: {
      userInfo: {
        nickname: conversation.showName,
        userID: conversation.userID,
        faceURL: conversation.faceURL,
        ex: "",
      },
    },
  });
  rtcPopoverOpen.value = false;
};

// Source: src/pages/chat/queryChat/ChatFooter/index.tsx
// Contract: docs/web-sdk-interface.md#6.1-创建文本消息
const enterToSend = async () => {
  const html = editorValue.value
    .split("\n")
    .map((line) => `<p>${line || "<br>"}</p>`)
    .join("");
  const cleanText = getCleanText(html);
  editorValue.value = "";
  if (!cleanText) return;
  const { data: message } = await IMSDK.createTextMessage(cleanText);
  sendMessage({ message });
};

const handleEditorKeydown = (event: KeyboardEvent) => {
  if (event.key !== "Enter" || event.shiftKey) return;
  event.preventDefault();
  enterToSend();
};

const sendImageMessage = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const files = Array.from(input.files ?? []);
  input.value = "";
  for (const file of files) {
    const message = await getImageMessage(file);
    sendMessage({ message });
  }
};

watch(
  () => [route.params.conversationID, conversationStore.conversationList.length],
  syncCurrentConversation,
  { immediate: true },
);

watch(
  () => [
    currentConversation.value?.conversationID,
    currentConversation.value?.unreadCount,
    useConversationStore().currentConversation?.conversationID,
  ],
  () => {
    if (readTimer) {
      window.clearTimeout(readTimer);
    }
    readTimer = window.setTimeout(() => {
      if (
        currentConversation.value &&
        currentConversation.value.unreadCount > 0 &&
        useConversationStore().currentConversation?.conversationID ===
          currentConversation.value.conversationID
      ) {
        IMSDK.markConversationMessageAsRead(currentConversation.value.conversationID);
      }
    }, 2000);
  },
  { immediate: true },
);

onUnmounted(() => {
  if (readTimer) {
    window.clearTimeout(readTimer);
  }
  conversationStore.updateCurrentConversation();
});
</script>

<style scoped lang="scss">
#chat-container {
  height: auto;
  min-width: 0;
  min-height: 0;
  flex: 1;
  align-self: stretch;
  background: #fff;
}

.chat-header {
  height: 64px;
  line-height: normal;
}

#chat-main {
  min-height: 0;
  flex: 1 1 auto;
}

#chat-footer {
  flex: 0 0 25%;
  min-height: 200px;
  max-height: 60%;
}

.message-editor {
  flex: 1;
  width: 100%;
  resize: none;
  outline: none;
  border: none;
  padding: 4px 18px;
  font-size: 14px;
  line-height: 22px;
  background: #fff;
}
</style>
