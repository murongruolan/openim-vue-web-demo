<template>
  <div class="flex h-full w-full flex-col overflow-hidden bg-white">
    <div class="m-5.5 text-base font-extrabold">{{ t("placeholder.myFriend") }}</div>
    <a-spin v-if="loading" />
    <a-empty v-else-if="!sections.length" class="mt-[30%]" :image="simpleEmptyImage" />
    <div v-else class="ml-4 mt-4 flex-1 overflow-auto pr-4">
      <div v-for="section in sections" :key="section.index">
        <div class="bg-white px-3.5 pb-1 text-sm text-[#8E9AB0FF]">
          {{ section.index }}
        </div>
        <div class="mx-3.5 mb-3 h-px w-full bg-[#E8EAEFFF]" />
        <FriendListItem
          v-for="friend in section.list"
          :key="friend.userID"
          :friend="friend"
          @show-user-card="showUserCard"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FriendUserItem } from "@openim/wasm-client-sdk";
import { Empty } from "ant-design-vue";
import { computed, ref, watchEffect } from "vue";

import { ts as t } from "@/i18n";
import { useContactStore } from "@/stores/contact";
import { emit } from "@/utils/events";

import FriendListItem from "./components/FriendListItem.vue";

const contactStore = useContactStore();
const loading = ref(false);
const simpleEmptyImage = Empty.PRESENTED_IMAGE_SIMPLE;

const getInitial = (name: string) => {
  const first = name.trim().charAt(0);
  if (!first) return "#";
  if (/^[A-Za-z]$/.test(first)) return first.toUpperCase();
  if (first === "测") return "C";
  return "#";
};

const sections = computed(() => {
  const groups = new Map<string, FriendUserItem[]>();
  contactStore.friendList.forEach((friend) => {
    const name = friend.remark || friend.nickname || friend.userID;
    const initial = getInitial(name);
    groups.set(initial, [...(groups.get(initial) ?? []), friend]);
  });
  return [...groups.entries()]
    .sort(([a], [b]) => (a === "#" ? 1 : b === "#" ? -1 : a.localeCompare(b)))
    .map(([index, list]) => ({
      index,
      list: list.sort((a, b) =>
        (a.remark || a.nickname || a.userID).localeCompare(
          b.remark || b.nickname || b.userID,
          "zh-Hans-CN",
        ),
      ),
    }));
});

const showUserCard = (userID: string) => {
  emit("OPEN_USER_CARD", { userID });
};

watchEffect(() => {
  loading.value = false;
});
</script>
