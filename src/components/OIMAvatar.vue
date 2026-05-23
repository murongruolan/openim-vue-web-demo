<template>
  <a-avatar
    :src="errorHolder || avatarUrl"
    shape="square"
    :size="size"
    :class="['oim-avatar', { 'cursor-pointer': Boolean($attrs.onClick) }]"
    :style="avatarStyle"
    @error="handleError"
  >
    {{ text }}
  </a-avatar>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";

import defaultGroup from "@/assets/images/contact/group.png";
import { avatarList, getDefaultAvatar } from "@/utils/avatar";

const props = withDefaults(
  defineProps<{
    src?: string;
    text?: string;
    color?: string;
    bgColor?: string;
    isgroup?: boolean;
    isnotification?: boolean;
    size?: number;
  }>(),
  {
    color: "#fff",
    bgColor: "#0289FA",
    isgroup: false,
    isnotification: false,
    size: 42,
  },
);

const defaultAvatarNames = avatarList.map((item) => item.name);
const errorHolder = ref("");

const avatarUrl = computed(() => {
  if (props.src) {
    return defaultAvatarNames.includes(props.src) ? getDefaultAvatar(props.src) : props.src;
  }
  return props.isgroup ? defaultGroup : undefined;
});

const avatarStyle = computed(() => ({
  backgroundColor: props.bgColor,
  minWidth: `${props.size}px`,
  minHeight: `${props.size}px`,
  lineHeight: `${props.size - 2}px`,
  color: props.color,
}));

watch(
  () => props.isgroup,
  (isGroup) => {
    if (!isGroup) {
      errorHolder.value = "";
    }
  },
);

const handleError = () => {
  if (props.isgroup) {
    errorHolder.value = defaultGroup;
  }
  return false;
};
</script>
