<template>
  <a-layout-content class="relative flex overflow-hidden !bg-white" id="chat-main">
    <div
      v-if="loadState.initLoading"
      class="flex h-full w-full items-center justify-center bg-white pt-1"
    >
      <a-spin :spinning="true" />
    </div>
    <div
      v-else
      id="chat-list"
      ref="listRef"
      class="w-full overflow-x-hidden overflow-y-auto"
      @scroll="loadMoreMessage"
    >
      <div
        v-if="loadState.hasMoreOld"
        :class="[
          'flex justify-center py-2 opacity-0',
          moreOldLoading ? 'opacity-100' : '',
        ]"
      >
        <a-spin />
      </div>
      <template v-for="message in loadState.messageList" :key="message.clientMsgID">
        <NotificationMessage
          v-if="isSystemMessage(message)"
          :message="message"
        />
        <MessageItemComp
          v-else
          :message="message"
          :conversation-id="conversationID"
          :is-sender="selfUserID === message.sendID"
        />
      </template>
    </div>
  </a-layout-content>
</template>

<script setup lang="ts">
import { ViewType, type MessageItem } from "@openim/wasm-client-sdk";
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from "vue";
import { useRoute } from "vue-router";

import { SystemMessageTypes } from "@/constants/im";
import { IMSDK } from "@/im/sdk";
import { useUserStore } from "@/stores/user";
import emitter from "@/utils/events";

import MessageItemComp from "./MessageItem.vue";
import NotificationMessage from "./NotificationMessage.vue";

const START_INDEX = 10000;
const SPLIT_COUNT = 20;

const route = useRoute();
const userStore = useUserStore();
const listRef = ref<HTMLElement>();
const moreOldLoading = ref(false);
const conversationID = ref("");
const selfUserID = ref(userStore.selfInfo.userID ?? "");
let requestFlag = 0;

const loadState = reactive({
  initLoading: true,
  hasMoreOld: true,
  messageList: [] as MessageItem[],
  firstItemIndex: START_INDEX,
});

const isSystemMessage = (message: MessageItem) =>
  SystemMessageTypes.includes(message.contentType);

const canLoadHistory = computed(
  () => Boolean(userStore.userID && userStore.imToken) && !userStore.isLogining,
);

const resetLoadState = () => {
  loadState.initLoading = true;
  loadState.hasMoreOld = true;
  loadState.messageList = [];
  loadState.firstItemIndex = START_INDEX;
};

const scrollToBottom = async () => {
  await nextTick();
  const el = listRef.value;
  if (!el) return;
  el.scrollTop = el.scrollHeight;
};

const getMoreOldMessages = async (loadMore = true) => {
  const reqConversationID = conversationID.value;
  if (!reqConversationID || !canLoadHistory.value) return;

  const flag = ++requestFlag;
  const oldHeight = listRef.value?.scrollHeight ?? 0;

  if (loadMore) {
    moreOldLoading.value = true;
  }

  try {
    const { data } = await IMSDK.getAdvancedHistoryMessageList({
      count: SPLIT_COUNT,
      startClientMsgID: loadMore ? loadState.messageList[0]?.clientMsgID ?? "" : "",
      conversationID: reqConversationID,
      viewType: ViewType.History,
    });
    if (conversationID.value !== reqConversationID || flag !== requestFlag) return;

    loadState.initLoading = false;
    loadState.hasMoreOld = !data.isEnd;
    loadState.messageList = [
      ...data.messageList,
      ...(loadMore ? loadState.messageList : []),
    ];
    loadState.firstItemIndex -= data.messageList.length;

    await nextTick();
    if (loadMore) {
      const el = listRef.value;
      if (el) {
        el.scrollTop = el.scrollHeight - oldHeight;
      }
    } else {
      await scrollToBottom();
    }
  } catch (error) {
    console.error("getAdvancedHistoryMessageList", error);
    loadState.initLoading = false;
  } finally {
    moreOldLoading.value = false;
  }
};

const loadHistoryMessages = () => getMoreOldMessages(false);

const loadMoreMessage = () => {
  const el = listRef.value;
  if (!el || el.scrollTop > 12) return;
  if (!loadState.hasMoreOld || moreOldLoading.value) return;
  getMoreOldMessages(true);
};

const pushNewMessage = (message: MessageItem) => {
  if (loadState.messageList.find((item) => item.clientMsgID === message.clientMsgID)) {
    return;
  }
  loadState.messageList = [...loadState.messageList, message];
  scrollToBottom();
};

const updateOneMessage = (message: MessageItem) => {
  const idx = loadState.messageList.findIndex(
    (item) => item.clientMsgID === message.clientMsgID,
  );
  if (idx < 0) return;
  loadState.messageList[idx] = {
    ...loadState.messageList[idx],
    ...message,
  };
};

watch(
  () => [route.params.conversationID, canLoadHistory.value] as const,
  ([id, ready], oldValue) => {
    const [oldID, oldReady] = oldValue ?? [];
    const nextConversationID = (id as string | undefined) ?? "";
    if (conversationID.value !== nextConversationID) {
      conversationID.value = nextConversationID;
      resetLoadState();
    }
    if (
      conversationID.value &&
      ready &&
      (nextConversationID !== oldID || !oldReady)
    ) {
      loadHistoryMessages();
    }
  },
  { immediate: true },
);

watch(
  () => userStore.selfInfo.userID,
  (userID) => {
    selfUserID.value = userID ?? "";
  },
  { immediate: true },
);

onMounted(() => {
  emitter.on<MessageItem>("PUSH_NEW_MSG", pushNewMessage);
  emitter.on<MessageItem>("UPDATE_ONE_MSG", updateOneMessage);
  emitter.on("CHAT_LIST_SCROLL_TO_BOTTOM", scrollToBottom);
});

onUnmounted(() => {
  emitter.off<MessageItem>("PUSH_NEW_MSG", pushNewMessage);
  emitter.off<MessageItem>("UPDATE_ONE_MSG", updateOneMessage);
  emitter.off("CHAT_LIST_SCROLL_TO_BOTTOM", scrollToBottom);
});
</script>

<style scoped lang="scss">
#chat-main {
  min-height: 0;
  flex: 1 1 auto;
}

#chat-list {
  height: 100%;
}
</style>
