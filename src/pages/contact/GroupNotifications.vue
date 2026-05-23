<template>
  <div class="flex h-full w-full flex-col bg-white">
    <p class="m-5.5 text-base font-extrabold">
      {{ t("placeholder.groupNotification") }}
    </p>
    <div class="flex-1 overflow-y-auto pb-3">
      <ApplicationItem
        v-for="item in groupApplicationList"
        :key="`${item.userID}${item.reqTime}`"
        :source="item"
        :current-user-id="currentUserID"
        @accept="onAccept"
        @reject="onReject"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ApplicationHandleResult, type GroupApplicationItem } from "@openim/wasm-client-sdk";
import { computed } from "vue";

import { IMSDK } from "@/im/sdk";
import { ts as t } from "@/i18n";
import { useContactStore } from "@/stores/contact";
import { useUserStore } from "@/stores/user";

import ApplicationItem from "./components/ApplicationItem.vue";

const contactStore = useContactStore();
const userStore = useUserStore();
const currentUserID = computed(() => userStore.selfInfo.userID ?? "");

const groupApplicationList = computed(() =>
  [...contactStore.recvGroupApplicationList, ...contactStore.sendGroupApplicationList].sort(
    (a, b) => {
      if (a.handleResult === 0 && b.handleResult !== 0) return -1;
      if (b.handleResult === 0 && a.handleResult !== 0) return 1;
      return b.reqTime - a.reqTime;
    },
  ),
);

const onAccept = async (payload: { source: any; isRecv: boolean }) => {
  const application = payload.source as GroupApplicationItem;
  await IMSDK.acceptGroupApplication({
    groupID: application.groupID,
    fromUserID: application.userID,
    handleMsg: "",
  });
  const next = { ...application, handleResult: ApplicationHandleResult.Agree };
  if (payload.isRecv) {
    contactStore.updateRecvGroupApplication(next);
  } else {
    contactStore.updateSendGroupApplication(next);
  }
};

const onReject = async (payload: { source: any; isRecv: boolean }) => {
  const application = payload.source as GroupApplicationItem;
  await IMSDK.refuseGroupApplication({
    groupID: application.groupID,
    fromUserID: application.userID,
    handleMsg: "",
  });
  const next = { ...application, handleResult: ApplicationHandleResult.Reject };
  if (payload.isRecv) {
    contactStore.updateRecvGroupApplication(next);
  } else {
    contactStore.updateSendGroupApplication(next);
  }
};
</script>
