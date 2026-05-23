<template>
  <div :id="`chat_${message.clientMsgID}`" class="relative">
    <div
      class="mx-6 py-3 text-center text-xs text-[var(--sub-text)]"
      v-html="notificationMessageFormat(message)"
    />
  </div>
</template>

<script setup lang="ts">
import type { MessageItem } from "@openim/wasm-client-sdk";

import { notificationMessageFormat } from "@/utils/imCommon";

defineProps<{
  message: MessageItem;
}>();
</script>
