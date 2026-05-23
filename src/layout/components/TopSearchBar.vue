<template>
  <div
    class="no-mobile app-drag flex h-10 min-h-[40px] items-center bg-[var(--top-search-bar)] dark:bg-[#141414]"
  >
    <div class="flex w-full items-center justify-center">
      <div
        class="app-no-drag flex h-[26px] w-1/3 items-center justify-center rounded-md bg-[rgba(255,255,255,0.2)]"
      />
    <a-popover
        v-model:open="actionVisible"
        :arrow="false"
        trigger="click"
        placement="bottom"
      >
        <template #content>
          <div class="p-1">
            <div
              v-for="action in actionMenuList"
              :key="action.idx"
              class="flex cursor-pointer items-center rounded px-3 py-2 text-xs hover:bg-[var(--primary-active)]"
              @click="actionClick(action.idx)"
            >
              <img width="20" :src="action.icon" alt="" />
              <div class="ml-3">{{ action.title }}</div>
            </div>
          </div>
        </template>
        <img class="app-no-drag ml-8 cursor-pointer" width="20" :src="showMore" alt="" />
      </a-popover>
    </div>

    <SearchUserOrGroup
      v-model:open="searchModalOpen"
      :is-search-group="isSearchGroup"
      @open-user-card-with-data="openUserCardWithData"
      @open-group-card-with-data="openGroupCardWithData"
    />
    <ChooseModal
      v-model:open="chooseModalOpen"
      :state="chooseModalState"
    />
    <UserCardModal
      v-model:open="userCardOpen"
      v-bind="userCardState"
    />
    <GroupCardModal
      v-model:open="groupCardOpen"
      :group-data="groupCardData"
    />
    <RtcCallModal
      v-model:open="rtcModalOpen"
      :invite-data="inviteData"
    />
  </div>
</template>

<script setup lang="ts">
import { CbEvents, MessageType, type GroupItem, type MessageItem, type RtcInvite, type WSEvent } from "@openim/wasm-client-sdk";
import { computed, onMounted, onUnmounted, ref } from "vue";

import { getBusinessUserInfo } from "@/api/login";
import addFriend from "@/assets/images/topSearchBar/add_friend.png";
import addGroup from "@/assets/images/topSearchBar/add_group.png";
import createGroup from "@/assets/images/topSearchBar/create_group.png";
import showMore from "@/assets/images/topSearchBar/show_more.png";
import { CustomType } from "@/constants/im";
import { IMSDK } from "@/im/sdk";
import { ts as t } from "@/i18n";
import ChooseModal from "@/pages/common/ChooseModal.vue";
import GroupCardModal from "@/pages/common/GroupCardModal.vue";
import RtcCallModal from "@/pages/common/RtcCallModal.vue";
import SearchUserOrGroup from "@/pages/common/SearchUserOrGroup.vue";
import type { CardInfo, ChooseModalState, InviteData, OpenUserCardParams } from "@/pages/common/types";
import UserCardModal from "@/pages/common/UserCardModal.vue";
import { useContactStore } from "@/stores/contact";
import { useUserStore } from "@/stores/user";
import emitter from "@/utils/events";

const contactStore = useContactStore();
const userStore = useUserStore();
const actionVisible = ref(false);
const searchModalOpen = ref(false);
const chooseModalOpen = ref(false);
const userCardOpen = ref(false);
const groupCardOpen = ref(false);
const rtcModalOpen = ref(false);
const isSearchGroup = ref(false);
const chooseModalState = ref<ChooseModalState>({ type: "CRATE_GROUP" });
const userCardState = ref<OpenUserCardParams>({});
const groupCardData = ref<(GroupItem & { inGroup?: boolean }) | undefined>();
const inviteData = ref<InviteData>({});

const actionMenuList = computed(() => [
  { idx: 0, title: t("placeholder.addFriends"), icon: addFriend },
  { idx: 1, title: t("placeholder.addGroup"), icon: addGroup },
  { idx: 2, title: t("placeholder.createGroup"), icon: createGroup },
]);

const actionClick = (idx: number) => {
  switch (idx) {
    case 0:
    case 1:
      isSearchGroup.value = Boolean(idx);
      searchModalOpen.value = true;
      break;
    case 2:
      chooseModalState.value = { type: "CRATE_GROUP" };
      chooseModalOpen.value = true;
      break;
    default:
      break;
  }
  actionVisible.value = false;
};

const openChooseModal = (state?: ChooseModalState) => {
  chooseModalState.value = state ? { ...state } : { type: "CRATE_GROUP" };
  chooseModalOpen.value = true;
};

const openUserCard = (params?: OpenUserCardParams) => {
  userCardState.value = params ? { ...params } : {};
  userCardOpen.value = true;
};

const openGroupCardWithData = (group: GroupItem) => {
  searchModalOpen.value = false;
  const inGroup = contactStore.groupList.some((g) => g.groupID === group.groupID);
  groupCardData.value = { ...group, inGroup };
  groupCardOpen.value = true;
};

const openUserCardWithData = (cardInfo: CardInfo) => {
  searchModalOpen.value = false;
  userCardState.value = {
    userID: cardInfo.userID,
    cardInfo,
    isSelf: cardInfo.userID === userStore.selfInfo.userID,
  };
  userCardOpen.value = true;
};

const openGroupCard = (group?: GroupItem) => {
  if (!group) return;
  openGroupCardWithData(group);
};

const openRtcModal = (data?: InviteData) => {
  if (rtcModalOpen.value) return;
  inviteData.value = data ?? {};
  rtcModalOpen.value = true;
};

const newMessageHandler = ({ data }: WSEvent<MessageItem[]>) => {
  if (rtcModalOpen.value) return;
  let rtcInvite: RtcInvite | undefined;
  data.forEach((message) => {
    if (message.contentType !== MessageType.CustomMessage || !message.customElem?.data) {
      return;
    }
    const customData = JSON.parse(message.customElem.data) as {
      customType: CustomType;
      data: RtcInvite;
    };
    if (customData.customType === CustomType.CallingInvite) {
      rtcInvite = customData.data;
    }
  });
  if (!rtcInvite) return;
  getBusinessUserInfo([rtcInvite.inviterUserID]).then(({ data: { users } }) => {
    if (!users.length || !rtcInvite) return;
    inviteData.value = {
      invitation: rtcInvite,
      participant: {
        userInfo: {
          nickname: users[0].nickname,
          faceURL: users[0].faceURL,
          userID: users[0].userID,
          ex: "",
        },
      },
    };
    rtcModalOpen.value = true;
  });
};

onMounted(() => {
  emitter.on("OPEN_CHOOSE_MODAL", openChooseModal);
  emitter.on("OPEN_USER_CARD", openUserCard);
  emitter.on("OPEN_GROUP_CARD", openGroupCard);
  emitter.on("OPEN_RTC_MODAL", openRtcModal);
  IMSDK.on(CbEvents.OnRecvNewMessages, newMessageHandler);
});

onUnmounted(() => {
  emitter.off("OPEN_CHOOSE_MODAL", openChooseModal);
  emitter.off("OPEN_USER_CARD", openUserCard);
  emitter.off("OPEN_GROUP_CARD", openGroupCard);
  emitter.off("OPEN_RTC_MODAL", openRtcModal);
  IMSDK.off(CbEvents.OnRecvNewMessages, newMessageHandler);
});
</script>
