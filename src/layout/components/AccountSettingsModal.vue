<template>
  <a-modal
    :open="open"
    :footer="null"
    :closable="false"
    :width="360"
    centered
    destroy-on-close
    class="no-padding-modal max-w-[70vw]"
    :mask="false"
    @cancel="closeModal"
  >
    <div class="flex flex-col bg-[var(--chat-bubble)]">
      <BlackListModal v-model:open="blackListOpen" />
      <div class="flex items-center justify-between bg-[var(--gap-text)] p-5">
        <span class="text-base font-medium">{{ t("placeholder.accountSetting") }}</span>
        <CloseOutlined class="cursor-pointer text-[#8e9aaf]" @click="closeModal" />
      </div>
      <div class="flex-1 overflow-y-auto">
        <div class="px-6">
          <div class="pb-5 pt-4 text-base font-medium">
            {{ t("placeholder.personalSetting") }}
          </div>
          <div class="pb-8 pl-1">
            <div class="pb-3 font-medium">{{ t("placeholder.chooseLanguage") }}</div>
            <div>
              <a-checkbox
                :checked="localeStr === 'zh-CN'"
                class="mr-4"
                @change="localeChange($event, 'zh-CN')"
              >
                简体中文
              </a-checkbox>
              <a-checkbox
                :checked="localeStr === 'en-US'"
                @change="localeChange($event, 'en-US')"
              >
                English
              </a-checkbox>
            </div>
          </div>
        </div>
        <a-divider class="m-0 border-4 border-[var(--gap-text)]" />
        <div
          class="flex cursor-pointer items-center justify-between px-6 py-4"
          @click="blackListOpen = true"
        >
          <div class="text-base font-medium">{{ t("placeholder.blackList") }}</div>
          <RightOutlined />
        </div>
        <a-divider class="m-0 border-4 border-[var(--gap-text)]" />
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { CloseOutlined, RightOutlined } from "@ant-design/icons-vue";
import { computed, ref } from "vue";

import { ts as t } from "@/i18n";
import { useUserStore } from "@/stores/user";

import BlackListModal from "./BlackListModal.vue";

type CheckboxChangeEvent = {
  target: {
    checked: boolean;
  };
};

defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  "update:open": [open: boolean];
}>();

const userStore = useUserStore();
const blackListOpen = ref(false);
const localeStr = computed(() => userStore.appSettings.locale);

const closeModal = () => {
  emit("update:open", false);
};

const localeChange = (event: CheckboxChangeEvent, locale: string) => {
  if (!event.target.checked) return;
  userStore.updateAppSettings({ locale });
};
</script>
