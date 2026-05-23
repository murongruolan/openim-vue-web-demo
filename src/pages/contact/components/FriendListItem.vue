<template>
  <div
    class="flex items-center rounded-md px-3.5 pb-3 pt-2.5 transition-colors hover:bg-[var(--primary-active)]"
    @click="$emit('showUserCard', friend.userID)"
  >
    <OIMAvatar :src="friend.faceURL" :text="friend.remark || friend.nickname" />
    <div class="ml-3 truncate text-sm">{{ friend.remark || friend.nickname }}</div>
  </div>
</template>

<script setup lang="ts">
import type { FriendUserItem } from "@openim/wasm-client-sdk";

import OIMAvatar from "@/components/OIMAvatar.vue";

defineProps<{
  friend: FriendUserItem;
}>();

defineEmits<{
  showUserCard: [userID: string];
}>();
</script>
