<template>
  <div class="bubble" v-html="content" />
</template>

<script setup lang="ts">
import type { MessageItem } from "@openim/wasm-client-sdk";
import { computed } from "vue";

import { parseBr } from "@/utils/imCommon";

const props = defineProps<{
  message: MessageItem;
}>();

const content = computed(() => parseBr(props.message.textElem?.content ?? ""));
</script>

<style scoped lang="scss">
.bubble {
  width: fit-content;
  border-radius: 0.375rem;
  padding: 0.625rem;
  word-break: break-word;
  white-space: pre-wrap;
  background-color: var(--chat-bubble);
}
</style>
