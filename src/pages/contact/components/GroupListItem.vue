<template>
  <div
    class="flex flex-row rounded-md px-3.5 py-3 transition-colors hover:bg-[var(--primary-active)]"
    @click="$emit('showGroupCard', source)"
  >
    <OIMAvatar :src="source.faceURL" isgroup />
    <div class="ml-3">
      <p class="text-base">{{ source.groupName }}</p>
      <p class="text-xs text-[#8E9AB0FF]">{{ source.memberCount }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GroupItem } from "@openim/wasm-client-sdk";

import OIMAvatar from "@/components/OIMAvatar.vue";

defineProps<{
  source: GroupItem;
}>();

defineEmits<{
  showGroupCard: [source: GroupItem];
}>();
</script>
