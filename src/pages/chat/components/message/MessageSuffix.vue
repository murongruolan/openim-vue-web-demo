<template>
  <div :class="['suffix', isSender ? 'suffix-sender' : '']">
    <a-spin
      v-if="showSending && message.status === MessageStatus.Sending"
      class="flex"
      :indicator="indicator"
    />
    <ExclamationCircleFilled
      v-if="message.status === MessageStatus.Failed"
      class="text-base text-[var(--warn-text)]"
    />
  </div>
</template>

<script setup lang="ts">
import { ExclamationCircleFilled, LoadingOutlined } from "@ant-design/icons-vue";
import { MessageStatus, type MessageItem } from "@openim/wasm-client-sdk";
import { h, onUnmounted, ref, watch } from "vue";

const props = defineProps<{
  message: MessageItem;
  isSender: boolean;
}>();

const showSending = ref(false);
const indicator = h(LoadingOutlined, {
  style: { fontSize: "16px" },
  spin: true,
});
let timer: number | undefined;

watch(
  () => props.message.status,
  (status) => {
    if (timer) {
      window.clearTimeout(timer);
      timer = undefined;
    }
    showSending.value = false;
    if (status !== MessageStatus.Sending) return;
    timer = window.setTimeout(() => {
      if (props.message.status === MessageStatus.Sending) {
        showSending.value = true;
      }
    }, 1000);
  },
  { immediate: true },
);

onUnmounted(() => {
  if (timer) {
    window.clearTimeout(timer);
  }
});
</script>

<style scoped lang="scss">
.suffix {
  margin-left: 0.75rem;
  display: flex;
  align-items: center;
}

.suffix-sender {
  margin-left: 0;
  margin-right: 0.75rem;
}
</style>
