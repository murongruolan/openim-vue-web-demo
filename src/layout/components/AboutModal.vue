<template>
  <a-modal
    :open="open"
    :footer="null"
    :closable="false"
    :width="360"
    centered
    class="no-padding-modal"
    :mask="false"
    @cancel="closeModal"
  >
    <div class="bg-[var(--chat-bubble)]">
      <div class="flex items-center justify-between bg-[var(--gap-text)] p-5">
        <span class="text-base font-medium">{{ t("placeholder.about") }}</span>
        <CloseOutlined class="cursor-pointer text-[#8e9aaf]" @click="closeModal" />
      </div>
      <div class="flex flex-col items-center justify-center">
        <img class="mb-2 mt-7" width="56" :src="logo" alt="" />
        <div class="mb-5 flex cursor-pointer flex-col items-center" @click="copyVersion">
          <div>{{ `${APP_NAME} ${APP_VERSION}` }}</div>
          <div>{{ SDK_VERSION }}</div>
        </div>
      </div>
      <a-divider class="border-1 m-0 border-[var(--gap-text)]" />
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { CloseOutlined } from "@ant-design/icons-vue";
import { message } from "ant-design-vue";

import logo from "@/assets/images/profile/logo.png";
import { APP_NAME, APP_VERSION, SDK_VERSION } from "@/config";
import { ts as t } from "@/i18n";

defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  "update:open": [open: boolean];
}>();

const closeModal = () => {
  emit("update:open", false);
};

const copyVersion = async () => {
  await navigator.clipboard?.writeText(`${APP_NAME} ${APP_VERSION}/${SDK_VERSION}`);
  message.success(t("toast.copySuccess"));
};
</script>
