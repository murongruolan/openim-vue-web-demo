<template>
  <a-modal
    :open="open"
    :footer="null"
    :closable="false"
    :width="420"
    centered
    destroy-on-close
    class="no-padding-modal"
    :mask="false"
    @cancel="closeModal"
  >
    <div class="flex h-[468px] flex-col bg-[var(--chat-bubble)]">
      <div class="flex items-center justify-between bg-[var(--gap-text)] p-5">
        <span class="text-base font-medium">{{ t("placeholder.blackList") }}</span>
        <CloseOutlined class="cursor-pointer text-[#8e9aaf]" @click="closeModal" />
      </div>
      <div class="flex-1 overflow-y-auto">
        <template v-if="contactStore.blackList.length > 0">
          <div
            v-for="black in contactStore.blackList"
            :key="black.userID"
            class="flex items-center justify-between px-5 py-2.5"
          >
            <div class="flex items-center overflow-hidden">
              <OIMAvatar :src="black.faceURL" :text="black.nickname" />
              <div class="ml-3 truncate">{{ black.nickname || black.userID }}</div>
            </div>
            <a-button
              type="primary"
              ghost
              :loading="removingID === black.userID"
              @click="removeBlack(black.userID)"
            >
              {{ t("placeholder.remove") }}
            </a-button>
          </div>
        </template>
        <a-empty v-else class="flex h-full flex-col items-center justify-center" />
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { CloseOutlined } from "@ant-design/icons-vue";
import type { WSEvent } from "@openim/wasm-client-sdk";
import { message } from "ant-design-vue";
import { ref } from "vue";

import OIMAvatar from "@/components/OIMAvatar.vue";
import { IMSDK } from "@/im/sdk";
import { ts as t } from "@/i18n";
import { useContactStore } from "@/stores/contact";

defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  "update:open": [open: boolean];
}>();

const contactStore = useContactStore();
const removingID = ref("");

const closeModal = () => {
  emit("update:open", false);
};

const removeBlack = async (userID: string) => {
  removingID.value = userID;
  try {
    await IMSDK.removeBlack(userID);
    await contactStore.getBlackListByReq();
  } catch (error) {
    message.error((error as WSEvent).errMsg ?? t("toast.updateBlackStateFailed"));
  } finally {
    removingID.value = "";
  }
};
</script>
