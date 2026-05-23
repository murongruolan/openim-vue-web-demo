<template>
  <a-spin :spinning="loading">
    <div
      class="flex flex-row items-center justify-between p-3.5 transition-colors hover:bg-[var(--primary-active)]"
    >
      <div class="flex flex-row">
        <OIMAvatar
          :src="avatarUrl"
          :text="title"
          :isgroup="isGroup && !isRecv"
          @click="tryShowCard"
        />
        <div class="ml-3">
          <p class="text-sm">{{ title }}</p>
          <p class="pb-2.5 pt-[5px] text-xs">
            {{ applicationDesc }}
            <span
              v-if="isGroup || (!isGroup && !isRecv)"
              class="ml-1 text-xs text-[#0289FAFF]"
            >
              {{ source.groupName || source.toNickname }}
            </span>
          </p>
          <p class="text-xs text-[var(--sub-text)]">{{ t("application.information") }}:</p>
          <p class="text-xs text-[var(--sub-text)]">{{ source.reqMsg }}</p>
        </div>
      </div>

      <div v-if="showActionBtn" class="flex flex-row">
        <div class="mr-5.5 h-8 w-[60px]">
          <a-button
            block
            size="small"
            class="!h-full !rounded-md border-2 border-[#0089FF] text-[#0089FF]"
            @click="loadingWrap(false)"
          >
            {{ t("application.refuse") }}
          </a-button>
        </div>
        <div class="h-8 w-[60px]">
          <a-button
            block
            size="small"
            type="primary"
            class="!h-full !rounded-md bg-[#0289fa]"
            @click="loadingWrap(true)"
          >
            {{ t("application.agree") }}
          </a-button>
        </div>
      </div>

      <div v-else class="flex flex-row items-center">
        <img v-if="!isRecv" class="mr-2 h-4 w-4" :src="arrowIcon" alt="" />
        <p class="text-sm text-[var(--sub-text)]">{{ statusStr }}</p>
      </div>
    </div>
  </a-spin>
</template>

<script setup lang="ts">
import {
  ApplicationHandleResult,
  type FriendApplicationItem,
  type GroupApplicationItem,
} from "@openim/wasm-client-sdk";
import { computed, ref } from "vue";

import arrowIcon from "@/assets/images/contact/arrowTopRight.png";
import OIMAvatar from "@/components/OIMAvatar.vue";
import { IMSDK } from "@/im/sdk";
import { ts as t } from "@/i18n";
import { emit } from "@/utils/events";

type ApplicationItemSource = Partial<FriendApplicationItem & GroupApplicationItem>;

const props = defineProps<{
  source: ApplicationItemSource;
  currentUserId: string;
}>();

const emitEvent = defineEmits<{
  accept: [payload: { source: ApplicationItemSource; isRecv: boolean }];
  reject: [payload: { source: ApplicationItemSource; isRecv: boolean }];
}>();

const loading = ref(false);
const isRecv = computed(
  () =>
    props.source.userID !== props.currentUserId &&
    props.source.fromUserID !== props.currentUserId,
);
const isGroup = computed(() => Boolean(props.source.groupID));
const showActionBtn = computed(
  () => props.source.handleResult === ApplicationHandleResult.Unprocessed && isRecv.value,
);

const applicationDesc = computed(() => {
  if (isGroup.value) return t("application.applyToJoin");
  return isRecv.value ? t("application.applyToFriend") : t("application.applyToAdd");
});

const title = computed(() => {
  if (isGroup.value) {
    return isRecv.value ? props.source.nickname : props.source.groupName;
  }
  return isRecv.value ? props.source.fromNickname : props.source.toNickname;
});

const statusStr = computed(() => {
  if (props.source.handleResult === ApplicationHandleResult.Agree) {
    return t("application.agreed");
  }
  if (props.source.handleResult === ApplicationHandleResult.Reject) {
    return t("application.refused");
  }
  return t("application.pending");
});

const avatarUrl = computed(() => {
  if (isGroup.value) {
    return isRecv.value ? props.source.userFaceURL : props.source.groupFaceURL;
  }
  return isRecv.value ? props.source.fromFaceURL : props.source.toFaceURL;
});

const loadingWrap = async (isAgree: boolean) => {
  loading.value = true;
  try {
    const payload = {
      source: props.source,
      isRecv: isRecv.value,
    };
    if (isAgree) {
      emitEvent("accept", payload);
    } else {
      emitEvent("reject", payload);
    }
  } finally {
    loading.value = false;
  }
};

const tryShowCard = async () => {
  if (isGroup.value && props.source.groupID) {
    const { data } = await IMSDK.getSpecifiedGroupsInfo([props.source.groupID]);
    emit("OPEN_GROUP_CARD", data[0]);
    return;
  }
  emit("OPEN_USER_CARD", {
    userID: isRecv.value ? props.source.fromUserID : props.source.toUserID,
  });
};
</script>
