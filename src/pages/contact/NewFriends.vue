<template>
  <div class="flex h-full w-full flex-col bg-white">
    <p class="m-5.5 text-base font-extrabold">{{ t("placeholder.newFriends") }}</p>
    <div class="flex-1 overflow-y-auto pb-3">
      <ApplicationItem
        v-for="item in friendApplicationList"
        :key="`${currentUserID === item.fromUserID ? item.toUserID : item.fromUserID}${item.createTime}`"
        :source="item"
        :current-user-id="currentUserID"
        @accept="onAccept"
        @reject="onReject"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ApplicationHandleResult, type FriendApplicationItem } from "@openim/wasm-client-sdk";
import { computed } from "vue";

import { IMSDK } from "@/im/sdk";
import { ts as t } from "@/i18n";
import { useContactStore } from "@/stores/contact";
import { useUserStore } from "@/stores/user";

import ApplicationItem from "./components/ApplicationItem.vue";

const contactStore = useContactStore();
const userStore = useUserStore();
const currentUserID = computed(() => userStore.selfInfo.userID ?? "");

const friendApplicationList = computed(() =>
  [...contactStore.recvFriendApplicationList, ...contactStore.sendFriendApplicationList].sort(
    (a, b) => {
      if (a.handleResult === 0 && b.handleResult !== 0) return -1;
      if (b.handleResult === 0 && a.handleResult !== 0) return 1;
      return b.createTime - a.createTime;
    },
  ),
);

const onAccept = async (payload: { source: any; isRecv: boolean }) => {
  const application = payload.source as FriendApplicationItem;
  await IMSDK.acceptFriendApplication({
    toUserID: application.fromUserID,
    handleMsg: "",
  });
  const next = { ...application, handleResult: ApplicationHandleResult.Agree };
  if (payload.isRecv) {
    contactStore.updateRecvFriendApplication(next);
  } else {
    contactStore.updateSendFriendApplication(next);
  }
};

const onReject = async (payload: { source: any; isRecv: boolean }) => {
  const application = payload.source as FriendApplicationItem;
  await IMSDK.refuseFriendApplication({
    toUserID: application.fromUserID,
    handleMsg: "",
  });
  const next = { ...application, handleResult: ApplicationHandleResult.Reject };
  if (payload.isRecv) {
    contactStore.updateRecvFriendApplication(next);
  } else {
    contactStore.updateSendFriendApplication(next);
  }
};
</script>
