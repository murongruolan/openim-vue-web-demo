<template>
  <a-modal
    :open="open"
    :footer="null"
    :closable="false"
    :width="332"
    centered
    destroy-on-close
    class="no-padding-modal"
    :mask="false"
    :mask-style="{ opacity: 0, transition: 'none' }"
    @cancel="closeModal"
    @after-close="keyword = ''"
  >
    <div class="flex h-12 items-center justify-between bg-[var(--gap-text)] px-5.5">
      <div>{{ isSearchGroup ? t("placeholder.addGroup") : t("placeholder.addFriends") }}</div>
      <CloseOutlined class="cursor-pointer text-[var(--sub-text)]" @click="closeModal" />
    </div>
    <div>
      <div class="border-b border-[var(--gap-text)] px-5.5 py-6">
        <a-input-search
          v-model:value="keyword"
          class="no-addon-search"
          :placeholder="t('placeholder.pleaseEnter')"
          :spellcheck="false"
          @search="searchData"
        />
      </div>
      <div class="flex justify-end px-5.5 py-2.5">
        <a-button
          class="px-6"
          type="primary"
          :loading="loading"
          :disabled="!keyword"
          @click="searchData"
        >
          {{ t("confirm") }}
        </a-button>
        <a-button class="ml-3 border-0 bg-[var(--chat-bubble)] px-6" @click="closeModal">
          {{ t("cancel") }}
        </a-button>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { CloseOutlined } from "@ant-design/icons-vue";
import type { GroupItem, WSEvent } from "@openim/wasm-client-sdk";
import { message } from "ant-design-vue";
import { ref, watch } from "vue";

import { searchBusinessUserInfo } from "@/api/login";
import { IMSDK } from "@/im/sdk";
import { ts as t } from "@/i18n";
import { useContactStore } from "@/stores/contact";

import type { CardInfo } from "./types";

const props = defineProps<{
  open: boolean;
  isSearchGroup: boolean;
}>();

const emit = defineEmits<{
  "update:open": [open: boolean];
  openUserCardWithData: [data: CardInfo];
  openGroupCardWithData: [data: GroupItem];
}>();

const contactStore = useContactStore();
const keyword = ref("");
const loading = ref(false);

const closeModal = () => {
  emit("update:open", false);
};

const searchData = async () => {
  if (!keyword.value) return;
  loading.value = true;
  if (props.isSearchGroup) {
    try {
      const { data } = await IMSDK.getSpecifiedGroupsInfo([keyword.value]);
      const groupInfo = data[0];
      if (!groupInfo) {
        message.warning(t("empty.noSearchResults"));
        return;
      }
      emit("openGroupCardWithData", groupInfo);
    } catch (error) {
      if ((error as WSEvent).errCode === 1004) {
        message.warning(t("empty.noSearchResults"));
      } else {
        message.error((error as WSEvent).errMsg ?? String(error));
      }
    } finally {
      loading.value = false;
    }
    return;
  }

  try {
    const {
      data: { total, users },
    } = await searchBusinessUserInfo(keyword.value);
    if (
      !total ||
      !users[0] ||
      (users[0].userID !== keyword.value && users[0].phoneNumber !== keyword.value)
    ) {
      message.warning(t("empty.noSearchResults"));
      return;
    }

    const friendInfo = contactStore.friendList.find(
      (friend) => friend.userID === users[0].userID,
    );
    emit("openUserCardWithData", {
      ...(friendInfo ?? {}),
      ...users[0],
    });
  } catch (error) {
    if ((error as WSEvent).errCode === 1004) {
      message.warning(t("empty.noSearchResults"));
      return;
    }
    message.error((error as WSEvent).errMsg ?? String(error));
  } finally {
    loading.value = false;
  }
};

watch(
  () => props.open,
  (open) => {
    if (!open) {
      keyword.value = "";
    }
  },
);
</script>
