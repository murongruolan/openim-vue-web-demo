<template>
  <a-drawer
    :open="open"
    :title="isPreviewMembers ? undefined : t('placeholder.setting')"
    placement="right"
    root-class-name="chat-drawer"
    :width="450"
    :get-container="getContainer"
    :mask="false"
    :mask-style="{ opacity: 0 }"
    destroy-on-close
    @close="closeDrawer"
  >
    <template v-if="isPreviewMembers" #title>
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <LeftOutlined class="mr-2 !text-[var(--base-black)]" @click="isPreviewMembers = false" />
          <div>{{ t("placeholder.memberList") }}</div>
        </div>
        <img class="cursor-pointer" width="20" :src="inviteHeader" alt="" @click="inviteMember" />
      </div>
    </template>

    <div v-if="!isPreviewMembers" class="flex h-full flex-col">
      <div class="flex items-center p-4">
        <label class="relative" :class="{ 'cursor-pointer': hasPermissions }">
          <OIMAvatar
            isgroup
            :src="currentGroupInfo?.faceURL"
            :text="currentGroupInfo?.groupName"
          />
          <img
            v-if="hasPermissions"
            class="absolute -bottom-1 -right-1"
            width="15"
            :src="editAvatar"
            alt="edit avatar"
          />
          <input
            v-if="hasPermissions"
            class="hidden"
            type="file"
            accept="image/*"
            @change="uploadGroupAvatar"
          />
        </label>
        <a-input
          v-if="editingName"
          v-model:value="groupNameDraft"
          class="ml-3 max-w-[240px]"
          size="small"
          @press-enter="updateGroupName"
          @blur="updateGroupName"
        />
        <div v-else class="ml-3 flex items-center">
          <span class="font-medium">{{ currentGroupInfo?.groupName }}</span>
          <img
            v-if="hasPermissions"
            class="ml-2 cursor-pointer"
            width="14"
            :src="editName"
            alt=""
            @click="startEditName"
          />
        </div>
      </div>

      <a-divider class="m-0 border-4 border-[#F4F5F7]" />
      <div v-if="currentGroupInfo && isJoinGroup" class="p-4">
        <div class="mb-3 font-medium">
          <span>{{ t("placeholder.groupMember") }}</span>
          <span class="ml-2">{{ currentGroupInfo.memberCount }}</span>
        </div>
        <div class="flex flex-wrap items-center">
          <div
            v-for="member in previewMembers"
            :key="member.userID"
            class="member-item"
            :title="member.nickname"
            @click="openMemberCard(member)"
          >
            <OIMAvatar :src="member.faceURL" :text="member.nickname" :size="36" />
            <div class="mt-2 min-h-[16px] max-w-full truncate text-xs">{{ member.nickname }}</div>
          </div>
          <div class="member-item cursor-pointer" @click.stop="inviteMember">
            <img width="36" :src="inviteIcon" alt="invite" />
            <div class="mt-2 max-w-full truncate text-xs text-[var(--sub-text)]">
              {{ t("placeholder.add") }}
            </div>
          </div>
          <div v-if="!isNormal" class="member-item cursor-pointer" @click.stop="kickMember">
            <img width="36" :src="kickIcon" alt="kick" />
            <div class="mt-2 max-w-full truncate text-xs text-[var(--sub-text)]">
              {{ t("placeholder.remove") }}
            </div>
          </div>
        </div>
        <div
          class="flex cursor-pointer items-center justify-center pt-2 text-xs text-[var(--primary)]"
          @click="isPreviewMembers = true"
        >
          {{ t("placeholder.viewMore") }}
        </div>
      </div>

      <a-divider class="m-0 border-4 border-[#F4F5F7]" />
      <div class="flex items-center justify-between px-4 py-3">
        <div>{{ `${t("placeholder.group")}ID` }}</div>
        <div class="flex items-center">
          <span class="mr-1 text-xs text-[var(--sub-text)]">{{ currentGroupInfo?.groupID }}</span>
          <img class="cursor-pointer" width="14" :src="copyIcon" alt="" @click="copyGroupID" />
        </div>
      </div>
      <div class="flex items-center justify-between px-4 py-3">
        <div>{{ t("placeholder.groupTppe") }}</div>
        <span class="text-xs text-[var(--sub-text)]">{{ t("placeholder.workGroup") }}</span>
      </div>

      <a-divider class="m-0 border-4 border-[#F4F5F7]" />
      <div
        v-if="isOwner"
        class="flex cursor-pointer items-center justify-between px-4 py-3"
        @click="transferGroup"
      >
        <div>{{ t("placeholder.transferGroup") }}</div>
        <RightOutlined />
      </div>
      <div class="flex-1" />
      <div v-if="isJoinGroup" class="flex w-full justify-center pb-3 pt-24">
        <a-button v-if="!isOwner" type="primary" danger ghost @click="tryQuitGroup">
          {{ t("placeholder.exitGroup") }}
        </a-button>
        <a-button v-else type="primary" danger @click="tryDismissGroup">
          {{ t("placeholder.disbandGroup") }}
        </a-button>
      </div>
    </div>

    <div v-else class="h-full px-2 py-2.5">
      <a-empty v-if="!memberList.length" class="flex h-full flex-col items-center justify-center" />
      <div v-else class="h-full overflow-y-auto overflow-x-hidden">
        <div v-for="member in memberList" :key="member.userID" class="list-member-item">
          <div class="flex items-center overflow-hidden" @click="openMemberCard(member)">
            <OIMAvatar :src="member.faceURL" :text="member.nickname" />
            <div class="ml-3 flex items-center">
              <div class="max-w-[120px] truncate">{{ member.nickname }}</div>
              <span
                v-if="member.roleLevel === GroupMemberRole.Owner"
                class="ml-2 rounded border border-[#FF9831] px-1 text-xs text-[#FF9831]"
              >
                {{ t("placeholder.groupOwner") }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </a-drawer>
</template>

<script setup lang="ts">
import { LeftOutlined, RightOutlined } from "@ant-design/icons-vue";
import {
  GroupMemberRole,
  type GroupItem,
  type GroupMemberItem,
  type WSEvent,
} from "@openim/wasm-client-sdk";
import { message, Modal } from "ant-design-vue";
import { computed, ref, watch } from "vue";

import copyIcon from "@/assets/images/chatSetting/copy.png";
import editAvatar from "@/assets/images/chatSetting/edit_avatar.png";
import editName from "@/assets/images/chatSetting/edit_name.png";
import inviteHeader from "@/assets/images/chatSetting/invite_header.png";
import inviteIcon from "@/assets/images/chatSetting/invite.png";
import kickIcon from "@/assets/images/chatSetting/kick.png";
import OIMAvatar from "@/components/OIMAvatar.vue";
import { IMSDK } from "@/im/sdk";
import { ts as t } from "@/i18n";
import { useConversationStore } from "@/stores/conversation";
import { useUserStore } from "@/stores/user";
import { emit as emitEvent } from "@/utils/events";
import { uploadFile } from "@/utils/imCommon";

const props = defineProps<{
  open: boolean;
}>();

const emit = defineEmits<{
  "update:open": [open: boolean];
}>();

const conversationStore = useConversationStore();
const userStore = useUserStore();
const memberList = ref<GroupMemberItem[]>([]);
const isPreviewMembers = ref(false);
const editingName = ref(false);
const groupNameDraft = ref("");

const currentGroupInfo = computed(() => conversationStore.currentGroupInfo);
const currentMemberInGroup = computed(() => conversationStore.currentMemberInGroup);
const isOwner = computed(() => currentMemberInGroup.value?.roleLevel === GroupMemberRole.Owner);
const isAdmin = computed(() => currentMemberInGroup.value?.roleLevel === GroupMemberRole.Admin);
const isNormal = computed(() => currentMemberInGroup.value?.roleLevel === GroupMemberRole.Normal);
const isJoinGroup = computed(() => Boolean(currentMemberInGroup.value?.userID));
const hasPermissions = computed(() => isOwner.value || isAdmin.value);
const previewMembers = computed(() => memberList.value.slice(0, isNormal.value ? 17 : 16));

const getContainer = () => document.querySelector("#chat-container") as HTMLElement;

const closeDrawer = () => {
  emit("update:open", false);
};

const getMemberData = async () => {
  if (!currentGroupInfo.value?.groupID) return;
  try {
    const { data } = await IMSDK.getGroupMemberList({
      groupID: currentGroupInfo.value.groupID,
      offset: 0,
      count: 500,
      filter: 0,
    });
    memberList.value = data;
  } catch (error) {
    message.error((error as WSEvent).errMsg ?? t("toast.getMemberListFailed"));
  }
};

const updateGroupInfo = async (value: Partial<GroupItem>) => {
  if (!currentGroupInfo.value) return;
  try {
    await IMSDK.setGroupInfo({
      ...value,
      groupID: currentGroupInfo.value.groupID,
    });
    conversationStore.updateCurrentGroupInfo({
      ...currentGroupInfo.value,
      ...value,
    });
  } catch (error) {
    message.error((error as WSEvent).errMsg ?? t("toast.updateGroupInfoFailed"));
  }
};

const startEditName = () => {
  if (!hasPermissions.value) return;
  groupNameDraft.value = currentGroupInfo.value?.groupName ?? "";
  editingName.value = true;
};

const updateGroupName = async () => {
  if (!editingName.value) return;
  editingName.value = false;
  if (!groupNameDraft.value.trim()) return;
  await updateGroupInfo({ groupName: groupNameDraft.value });
};

const uploadGroupAvatar = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  try {
    const {
      data: { url },
    } = await uploadFile(file);
    await updateGroupInfo({ faceURL: url });
  } catch (error) {
    message.error((error as WSEvent).errMsg ?? t("toast.updateAvatarFailed"));
  }
};

const inviteMember = () => {
  emitEvent("OPEN_CHOOSE_MODAL", {
    type: "INVITE_TO_GROUP",
    extraData: currentGroupInfo.value?.groupID,
  });
};

const kickMember = () => {
  emitEvent("OPEN_CHOOSE_MODAL", {
    type: "KICK_FORM_GROUP",
    extraData: currentGroupInfo.value?.groupID,
  });
};

const transferGroup = () => {
  emitEvent("OPEN_CHOOSE_MODAL", {
    type: "TRANSFER_IN_GROUP",
    extraData: currentGroupInfo.value?.groupID,
  });
};

const openMemberCard = (member: GroupMemberItem) => {
  emitEvent("OPEN_USER_CARD", {
    userID: member.userID,
    groupID: member.groupID,
    isSelf: member.userID === userStore.selfInfo.userID,
    notAdd: false,
  });
};

const copyGroupID = async () => {
  await navigator.clipboard?.writeText(currentGroupInfo.value?.groupID ?? "");
  message.success(t("toast.copySuccess"));
};

const tryDismissGroup = () => {
  if (!currentGroupInfo.value) return;
  Modal.confirm({
    title: t("placeholder.disbandGroup"),
    content: `${t("toast.confirmDisbandGroup")} ${t("placeholder.disbandGroupToast")}`,
    onOk: async () => {
      await IMSDK.dismissGroup(currentGroupInfo.value!.groupID);
      closeDrawer();
    },
  });
};

const tryQuitGroup = () => {
  if (!currentGroupInfo.value) return;
  Modal.confirm({
    title: t("placeholder.exitGroup"),
    content: `${t("toast.confirmExitGroup")} ${t("placeholder.exitGroupToast")}`,
    onOk: async () => {
      await IMSDK.quitGroup(currentGroupInfo.value!.groupID);
      closeDrawer();
    },
  });
};

watch(
  () => props.open,
  (open) => {
    if (open) {
      isPreviewMembers.value = false;
      getMemberData();
    } else {
      memberList.value = [];
      editingName.value = false;
    }
  },
);

watch(
  () => currentGroupInfo.value?.groupID,
  () => {
    if (props.open) {
      getMemberData();
    }
  },
);
</script>

<style scoped lang="scss">
.member-item {
  width: 56px;
  margin-right: 15px;
  margin-bottom: 12px;
  text-align: center;
  cursor: pointer;
}

.list-member-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-radius: 6px;

  &:hover {
    background: var(--primary-active);
  }
}
</style>
