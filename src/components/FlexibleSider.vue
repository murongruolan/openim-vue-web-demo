<template>
  <aside :class="asideClass">
    <div :class="['absolute bottom-0 left-0 right-1 top-0 z-10 overflow-hidden', wrapClassName]">
      <slot />
    </div>
    <div class="sider-resize" />
    <div class="sider-bar" />
  </aside>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  needHidden: boolean;
  wrapClassName?: string;
}>();

const asideClass = computed(() => [
  "relative h-full bg-white dark:text-white",
  props.needHidden ? "max-[600px]:hidden" : "max-[600px]:!max-w-none max-[600px]:!basis-full",
]);
</script>

<style scoped lang="scss">
.sider-resize {
  width: 300px;
  min-width: 240px;
  max-width: 45vw;
  resize: horizontal;
  overflow: scroll;
  height: 100%;
  opacity: 0;

  &::-webkit-scrollbar {
    height: calc(100vh - 40px);
  }
}

.sider-bar {
  position: absolute;
  right: 0;
  top: 0;
  bottom: 0;
  border-left: 1px solid #e8eaef;
  pointer-events: none;
}
</style>
