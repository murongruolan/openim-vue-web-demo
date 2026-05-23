<template>
  <div class="h-full">
    <ConnectBar />
    <FlexibleSider
      :need-hidden="Boolean(conversationID)"
      wrap-class-name="left-2 right-2 top-1.5 flex flex-col"
    >
      <div class="flex-1 overflow-y-auto" @scroll="endReached">
        <ConversationItem
          v-for="conversation in conversationStore.conversationList"
          :key="conversation.conversationID"
          :conversation="conversation"
          :is-active="conversationID === conversation.conversationID"
        />
      </div>
    </FlexibleSider>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute } from "vue-router";

import FlexibleSider from "@/components/FlexibleSider.vue";
import { useConversationStore } from "@/stores/conversation";

import ConnectBar from "./ConnectBar.vue";
import ConversationItem from "./ConversationItem.vue";

const route = useRoute();
const conversationStore = useConversationStore();
const hasMore = ref(true);
const loading = ref(false);

const conversationID = computed(() => route.params.conversationID as string | undefined);

const endReached = async (event: Event) => {
  const el = event.target as HTMLElement;
  if (el.scrollTop + el.clientHeight < el.scrollHeight - 40) return;
  if (!hasMore.value || loading.value) return;

  loading.value = true;
  hasMore.value = await conversationStore.getConversationListByReq(true);
  loading.value = false;
};
</script>
