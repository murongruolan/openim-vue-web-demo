<template>
  <div class="flex h-full w-full flex-col bg-white">
    <div class="m-5.5 flex flex-row justify-between">
      <p class="text-base font-extrabold">{{ t("placeholder.myGroup") }}</p>
      <a-select
        v-model:value="selectGroup"
        popup-class-name="p-0"
        style="width: 200px"
        :options="groupTypeOptions"
      />
    </div>
    <div class="box-border flex-1 overflow-y-auto px-2 pb-3">
      <GroupListItem
        v-for="group in filterGroup"
        :key="group.groupID"
        :source="group"
        @show-group-card="showGroupCard"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GroupItem } from "@openim/wasm-client-sdk";
import { computed, ref } from "vue";

import { ts as t } from "@/i18n";
import { useContactStore } from "@/stores/contact";
import { useUserStore } from "@/stores/user";
import { emit } from "@/utils/events";

import GroupListItem from "./components/GroupListItem.vue";

enum GroupTypeEnum {
  JoinedGroup,
  CreatedGroup,
}

const contactStore = useContactStore();
const userStore = useUserStore();
const selectGroup = ref(String(GroupTypeEnum.CreatedGroup));

const groupTypeOptions = computed(() => [
  { value: String(GroupTypeEnum.CreatedGroup), label: t("placeholder.myCreated") },
  { value: String(GroupTypeEnum.JoinedGroup), label: t("placeholder.myJoined") },
]);

const filterGroup = computed(() =>
  contactStore.groupList.filter((group) => {
    if (Number(selectGroup.value) === GroupTypeEnum.JoinedGroup) {
      return group.creatorUserID !== userStore.selfInfo.userID;
    }
    return group.creatorUserID === userStore.selfInfo.userID;
  }),
);

const showGroupCard = (group: GroupItem) => {
  emit("OPEN_GROUP_CARD", group);
};
</script>
