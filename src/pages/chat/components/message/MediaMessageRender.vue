<template>
  <a-spin :spinning="isSending">
    <div class="relative max-w-[200px]" :style="minStyle">
      <a-image
        root-class-name="message-image cursor-pointer"
        class="max-w-[200px] rounded-md"
        :src="sourceUrl"
        :preview="true"
      >
        <template #placeholder>
          <div :style="minStyle" class="flex items-center justify-center">
            <a-spin />
          </div>
        </template>
      </a-image>
    </div>
  </a-spin>
</template>

<script setup lang="ts">
import { MessageStatus, type MessageItem } from "@openim/wasm-client-sdk";
import { computed } from "vue";

const props = defineProps<{
  message: MessageItem;
}>();

const min = (a: number, b: number) => (a > b ? b : a);

const imageHeight = computed(() => props.message.pictureElem?.sourcePicture.height ?? 0);
const imageWidth = computed(() => props.message.pictureElem?.sourcePicture.width ?? 0);
const snapshotMaxHeight = computed(
  () => props.message.pictureElem?.snapshotPicture?.height ?? imageHeight.value,
);
const minHeight = computed(() =>
  imageWidth.value ? min(200, imageWidth.value) * (imageHeight.value / imageWidth.value) + 2 : 0,
);
const adaptedHeight = computed(() => min(minHeight.value, snapshotMaxHeight.value) + 10);
const adaptedWidth = computed(() => min(imageWidth.value, 200) + 10);
const sourceUrl = computed(
  () =>
    props.message.pictureElem?.snapshotPicture?.url ||
    props.message.pictureElem?.sourcePicture.url ||
    "",
);
const isSending = computed(() => props.message.status === MessageStatus.Sending);
const minStyle = computed(() => ({
  minHeight: `${adaptedHeight.value}px`,
  minWidth: `${adaptedWidth.value}px`,
}));
</script>
