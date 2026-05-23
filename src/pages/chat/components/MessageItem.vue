<template>
  <div :id="`chat_${message.clientMsgID}`" class="relative flex select-text px-5 py-3">
    <div :class="['message-container', isSender ? 'message-container-sender' : '']">
      <OIMAvatar
        :size="36"
        :src="message.senderFaceUrl"
        :text="message.senderNickname"
      />

      <div class="message-wrap">
        <div class="message-profile">
          <div
            :title="message.senderNickname"
            :class="[
              'max-w-[30%] truncate text-[var(--sub-text)]',
              isSender ? 'ml-2' : 'mr-2',
            ]"
          >
            {{ message.senderNickname }}
          </div>
          <div class="text-[var(--sub-text)]">{{ formatMessageTime(message.sendTime) }}</div>
        </div>

        <div class="menu-wrap">
          <TextMessageRender v-if="message.contentType === MessageType.TextMessage" :message="message" />
          <MediaMessageRender
            v-else-if="message.contentType === MessageType.PictureMessage"
            :message="message"
          />
          <div v-else class="bubble">{{ t("messageDescription.catchMessage") }}</div>
          <MessageSuffix :message="message" :is-sender="isSender" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MessageType, type MessageItem } from "@openim/wasm-client-sdk";

import OIMAvatar from "@/components/OIMAvatar.vue";
import { ts as t } from "@/i18n";
import { formatMessageTime } from "@/utils/imCommon";

import MediaMessageRender from "./message/MediaMessageRender.vue";
import MessageSuffix from "./message/MessageSuffix.vue";
import TextMessageRender from "./message/TextMessageRender.vue";

defineProps<{
  message: MessageItem;
  isSender: boolean;
  conversationId?: string;
}>();
</script>

<style scoped lang="scss">
.message-container {
  display: flex;
  flex: 1 1 0%;
  overflow: hidden;

  .message-wrap {
    margin-left: 0.75rem;
    display: flex;
    flex: 1 1 0%;
    flex-direction: column;
    overflow: hidden;

    .message-profile {
      margin-bottom: 0.25rem;
      display: flex;
      width: 100%;
      font-size: 12px;
    }

    .bubble {
      width: fit-content;
      border-radius: 0.375rem;
      padding: 0.625rem;
      word-break: break-word;
      white-space: pre-wrap;
      background-color: var(--chat-bubble);
    }
  }

  .menu-wrap {
    display: flex;
    width: fit-content;
  }

  &-sender {
    flex-direction: row-reverse;

    .message-wrap {
      margin-left: 0;
      margin-right: 0.75rem;
      align-items: flex-end;

      .message-profile {
        flex-direction: row-reverse;
      }

    }

    .menu-wrap {
      flex-direction: row-reverse;
    }
  }
}

.message-container-sender.message-container .message-wrap :deep(.bubble) {
  background-color: var(--chat-bubble-sender);
}
</style>
