<template>
  <a-layout class="chat-layout flex-row">
    <ConversationSider />
    <RouterView />
  </a-layout>
</template>

<script setup lang="ts">
import ConversationSider from "./components/ConversationSider.vue";
</script>

<style scoped lang="scss">
.chat-layout {
  height: 100%;
  min-width: 0;
  min-height: 0;
  flex: 1;
  overflow: hidden;
}
</style>
