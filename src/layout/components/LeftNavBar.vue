<template>
  <a-layout-sider
    class="no-mobile border-r border-gray-200 !bg-[#F4F4F4] dark:border-gray-800 dark:!bg-[#141414]"
    :width="60"
    theme="light"
  >
    <div class="mt-6 flex flex-col items-center">
      <a-popover
        v-model:open="showProfile"
        trigger="click"
        placement="rightBottom"
        overlay-class-name="profile-popover"
        :arrow="false"
      >
        <template #content>
          <div class="w-72 px-2.5 pb-3 pt-5.5">
            <div class="mb-4.5 ml-3 flex items-center">
              <div class="avatar-wrapper">
                <OIMAvatar :src="selfInfo.faceURL" :text="selfInfo.nickname" />
              </div>
              <div class="flex-1 overflow-hidden">
                <div class="mb-1 truncate text-base font-medium">
                  {{ selfInfo.nickname }}
                </div>
              </div>
            </div>

            <template v-for="menu in profileMenuList" :key="menu.idx">
              <div
                class="flex cursor-pointer items-center justify-between rounded-md px-3 py-4 hover:bg-[var(--primary-active)]"
                @click="profileMenuClick(menu.idx)"
              >
                <div>{{ menu.title }}</div>
                <RightOutlined />
              </div>
              <div v-if="menu.gap" class="px-3">
                <a-divider class="my-1.5 border-[var(--gap-text)]" />
              </div>
            </template>
          </div>
        </template>

        <OIMAvatar
          class="mb-6 cursor-pointer"
          :src="selfInfo.faceURL"
          :text="selfInfo.nickname"
        />
      </a-popover>

      <a-badge
        v-for="nav in navList"
        :key="nav.path"
        size="small"
        :count="getBadge(nav.path)"
      >
        <div
          :class="[
            'mb-3 flex h-[52px] w-12 cursor-pointer flex-col items-center justify-center rounded-md',
            isActive(nav.path) ? 'bg-[#e9e9eb]' : '',
          ]"
          @click="tryNavigate(nav.path)"
        >
          <img width="20" :src="isActive(nav.path) ? nav.iconActive : nav.icon" alt="" />
          <div class="mt-1 text-xs text-gray-500">{{ nav.title }}</div>
        </div>
      </a-badge>
    </div>

    <AccountSettingsModal v-model:open="accountSettingOpen" />
    <AboutModal v-model:open="aboutOpen" />
  </a-layout-sider>
</template>

<script setup lang="ts">
import { RightOutlined } from "@ant-design/icons-vue";
import { Modal } from "ant-design-vue";
import { computed, ref } from "vue";
import { useRoute, useRouter } from "vue-router";

import contactIcon from "@/assets/images/nav/nav_bar_contact.png";
import contactIconActive from "@/assets/images/nav/nav_bar_contact_active.png";
import messageIcon from "@/assets/images/nav/nav_bar_message.png";
import messageIconActive from "@/assets/images/nav/nav_bar_message_active.png";
import OIMAvatar from "@/components/OIMAvatar.vue";
import { ts as t } from "@/i18n";
import { useContactStore } from "@/stores/contact";
import { useConversationStore } from "@/stores/conversation";
import { useUserStore } from "@/stores/user";
import { emit } from "@/utils/events";

import AboutModal from "./AboutModal.vue";
import AccountSettingsModal from "./AccountSettingsModal.vue";

const route = useRoute();
const router = useRouter();
const userStore = useUserStore();
const conversationStore = useConversationStore();
const contactStore = useContactStore();
const showProfile = ref(false);
const accountSettingOpen = ref(false);
const aboutOpen = ref(false);

const selfInfo = computed(() => userStore.selfInfo);
const navList = computed(() => [
  {
    icon: messageIcon,
    iconActive: messageIconActive,
    title: t("placeholder.chat"),
    path: "/chat",
  },
  {
    icon: contactIcon,
    iconActive: contactIconActive,
    title: t("placeholder.contact"),
    path: "/contact",
  },
]);

const profileMenuList = computed(() => [
  { title: t("placeholder.myInfo"), gap: true, idx: 0 },
  { title: t("placeholder.accountSetting"), gap: true, idx: 1 },
  { title: t("placeholder.about"), gap: false, idx: 2 },
  { title: t("placeholder.logOut"), gap: false, idx: 3 },
]);

const isActive = (path: string) =>
  route.path === path || (route.path.startsWith(path) && route.path.charAt(path.length) === "/");

const getBadge = (path: string) => {
  if (path === "/chat") return conversationStore.unReadCount;
  if (path === "/contact") {
    return (
      contactStore.unHandleFriendApplicationCount +
      contactStore.unHandleGroupApplicationCount
    );
  }
  return 0;
};

const tryNavigate = (path: string) => {
  if (isActive(path)) return;
  router.push(path);
};

const profileMenuClick = (idx: number) => {
  switch (idx) {
    case 0:
      emit("OPEN_USER_CARD", {
        isSelf: true,
        userID: userStore.selfInfo.userID,
      });
      break;
    case 1:
      accountSettingOpen.value = true;
      break;
    case 2:
      aboutOpen.value = true;
      break;
    case 3:
      Modal.confirm({
        title: t("placeholder.logOut"),
        content: t("toast.confirmlogOut"),
        onOk: async () => {
          await userStore.userLogout();
        },
      });
      break;
    default:
      break;
  }
  showProfile.value = false;
};
</script>

<style scoped lang="scss">
.avatar-wrapper {
  margin-right: 16px;
}
</style>
