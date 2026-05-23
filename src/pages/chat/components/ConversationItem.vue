<template>
  <div
    :class="[
      'conversation-item border border-transparent',
      isActive ? 'bg-[var(--primary-active)]' : '',
    ]"
    @click="toSpecifiedConversation"
  >
    <a-badge size="small" :count="conversation.unreadCount">
      <OIMAvatar
        :src="conversation.faceURL"
        :isgroup="Boolean(conversation.groupID)"
        :text="conversation.showName"
      />
    </a-badge>

    <div class="ml-3 flex h-11 flex-1 flex-col justify-between overflow-hidden">
      <div class="flex items-center justify-between">
        <div class="flex-1 truncate font-medium">{{ conversation.showName }}</div>
        <div class="ml-2 text-xs text-[var(--sub-text)]">{{ latestMessageTime }}</div>
      </div>

      <div class="flex items-center">
        <div class="flex min-h-[16px] flex-1 items-center overflow-hidden text-xs">
          <div
            class="truncate text-[rgba(81,94,112,0.5)]"
            v-html="latestMessageContent"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { ConversationItem, MessageItem } from "@openim/wasm-client-sdk";
import { computed } from "vue";
import { useRouter } from "vue-router";

import OIMAvatar from "@/components/OIMAvatar.vue";
import { ts as t } from "@/i18n";
import { useConversationStore } from "@/stores/conversation";
import { formatConversionTime, getConversationContent } from "@/utils/imCommon";

const props = defineProps<{
  isActive: boolean;
  conversation: ConversationItem;
}>();

const router = useRouter();
const conversationStore = useConversationStore();

const latestMessageContent = computed(() => {
  if (!props.conversation.latestMsg) return "";
  try {
    return getConversationContent(JSON.parse(props.conversation.latestMsg) as MessageItem);
  } catch (error) {
    return t("messageDescription.catchMessage");
  }
});

const latestMessageTime = computed(() =>
  formatConversionTime(props.conversation.latestMsgSendTime),
);

const toSpecifiedConversation = async () => {
  if (props.isActive) return;
  await conversationStore.updateCurrentConversation({ ...props.conversation });
  router.push(`/chat/${props.conversation.conversationID}`);
};
</script>

<style scoped lang="scss">
.conversation-item {
  position: relative;
  margin-top: 0.25rem;
  margin-bottom: 0.25rem;
  display: flex;
  align-items: center;
  border-radius: 0.375rem;
  padding: 0.5rem;
  cursor: pointer;

  &:hover {
    background: var(--primary-active);
  }

  :deep(.emojione) {
    width: 16px;
    height: 16px;
  }
}
</style>
