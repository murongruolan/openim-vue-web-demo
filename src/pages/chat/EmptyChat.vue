<template>
  <a-layout class="empty-chat no-mobile flex w-full items-center justify-center bg-white">
    <div>
      <div class="mb-12 flex flex-col items-center">
        <div class="mb-3 text-xl font-medium">{{ t("placeholder.createGroup") }}</div>
        <div class="text-[var(--sub-text)]">
          {{ t("placeholder.createGroupToast") }}
        </div>
      </div>
      <img :src="emptyChatBg" alt="" width="320" />

      <div class="mt-28 flex justify-center">
        <a-button class="px-8" type="primary" @click="createNow">
          {{ t("placeholder.createNow") }}
        </a-button>
      </div>
    </div>
  </a-layout>
</template>

<script setup lang="ts">
import emptyChatBg from "@/assets/images/empty_chat_bg.png";
import { ts as t } from "@/i18n";
import { emit } from "@/utils/events";

const createNow = () => {
  emit("OPEN_CHOOSE_MODAL", {
    type: "CRATE_GROUP",
  });
};
</script>

<style scoped lang="scss">
.empty-chat {
  height: calc(100vh - var(--searchbar-height));
  flex: 1 1 auto;
  min-height: 0;
}
</style>
