<template>
  <FlexibleSider :need-hidden="true">
    <div class="h-full bg-white">
      <div class="pb-3 pl-5.5 pt-5.5 text-base font-extrabold">
        {{ t("placeholder.contact") }}
      </div>
      <ul>
        <li
          v-for="(item, index) in links"
          :key="item.path"
          :class="[
            'mx-2 flex cursor-pointer items-center rounded-md p-3 text-sm hover:bg-[var(--primary-active)]',
            route.path === item.path ? 'bg-[#f3f8fe]' : '',
          ]"
          @click="router.push(item.path)"
        >
          <a-badge size="small" :count="getBadge(index)">
            <img :alt="item.label" :src="item.icon" class="mr-3 h-10.5 w-10.5 rounded-md" />
          </a-badge>
          <div class="text-sm">{{ item.label }}</div>
        </li>
      </ul>
    </div>
  </FlexibleSider>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute, useRouter } from "vue-router";

import groupNotifications from "@/assets/images/contact/group_notifications.png";
import myFriends from "@/assets/images/contact/my_friends.png";
import myGroups from "@/assets/images/contact/my_groups.png";
import newFriends from "@/assets/images/contact/new_friends.png";
import FlexibleSider from "@/components/FlexibleSider.vue";
import { ts as t } from "@/i18n";
import { useContactStore } from "@/stores/contact";

const route = useRoute();
const router = useRouter();
const contactStore = useContactStore();

const links = computed(() => [
  {
    label: t("placeholder.newFriends"),
    icon: newFriends,
    path: "/contact/newFriends",
  },
  {
    label: t("placeholder.groupNotification"),
    icon: groupNotifications,
    path: "/contact/groupNotifications",
  },
  {
    label: t("placeholder.myFriend"),
    icon: myFriends,
    path: "/contact",
  },
  {
    label: t("placeholder.myGroup"),
    icon: myGroups,
    path: "/contact/myGroups",
  },
]);

const getBadge = (index: number) => {
  if (index === 0) return contactStore.unHandleFriendApplicationCount;
  if (index === 1) return contactStore.unHandleGroupApplicationCount;
  return 0;
};
</script>
