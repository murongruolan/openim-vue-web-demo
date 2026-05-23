<template>
  <template v-if="!userStore.reinstall">
    <div
      v-if="showLoading"
      class="flex h-6 items-center justify-center bg-[#0089FF] bg-opacity-10"
    >
      <img :src="syncIcon" alt="sync" class="loading-icon mr-1 h-3 w-3" />
      <span class="text-xs text-[#0089FF]">{{ loadingTip }}</span>
    </div>
    <div
      v-if="showFailed"
      class="flex h-6 items-center justify-center bg-[#FF381F] bg-opacity-15"
    >
      <img :src="syncErrorIcon" alt="sync" class="mr-1 h-3 w-3" />
      <span class="text-xs text-[#FF381F]">{{ errorTip }}</span>
    </div>
  </template>
</template>

<script setup lang="ts">
import { computed } from "vue";

import syncIcon from "@/assets/images/common/sync.png";
import syncErrorIcon from "@/assets/images/common/sync_error.png";
import { ts as t } from "@/i18n";
import { useUserStore } from "@/stores/user";

const userStore = useUserStore();

const showLoading = computed(
  () => userStore.syncState === "loading" || userStore.connectState === "loading",
);
const showFailed = computed(
  () => userStore.syncState === "failed" || userStore.connectState === "failed",
);
const loadingTip = computed(() =>
  userStore.syncState === "loading" ? t("connect.syncing") : t("connect.connecting"),
);
const errorTip = computed(() =>
  userStore.syncState === "failed" ? t("connect.syncFailed") : t("connect.connectFailed"),
);
</script>

<style scoped lang="scss">
.loading-icon {
  animation: loading 1s linear infinite;
}

@keyframes loading {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
