<template>
  <a-modal
    :open="open"
    :footer="null"
    :closable="false"
    :width="484"
    destroy-on-close
    class="no-padding-modal"
    :mask="false"
    :mask-style="{ opacity: 0, transition: 'none' }"
    @cancel="closeModal"
    @after-close="resetState"
  >
    <div>
      <div v-if="!isSendRequest" class="flex justify-end px-5.5 pt-4">
        <CloseOutlined class="cursor-pointer text-[var(--sub-text)]" @click="closeModal" />
      </div>
      <div
        v-if="isSendRequest"
        class="flex w-fit cursor-pointer items-center pl-5.5 pt-5.5"
        @click="isSendRequest = false"
      >
        <LeftOutlined />
        <div class="ml-1 font-medium">{{ t("placeholder.groupVerification") }}</div>
      </div>
      <div class="flex p-5.5">
        <OIMAvatar :size="60" :src="groupData?.faceURL" isgroup />
        <div class="ml-3">
          <div class="mb-3 max-w-[120px] truncate text-base font-medium">
            {{ groupData?.groupName }}
          </div>
          <div class="flex items-center">
            <div class="text-xs text-[var(--sub-text)]">ID：{{ groupData?.groupID }}</div>
            <div class="ml-4 flex items-center">
              <img :src="clock" width="10" alt="" />
              <div class="text-xs text-[var(--sub-text)]">{{ createTimeStr }}</div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="isSendRequest" class="mx-5.5">
        <div class="text-xs text-[var(--sub-text)]">{{ t("application.information") }}</div>
        <div class="mt-3">
          <a-textarea
            v-model:value="reqMsg"
            show-count
            :maxlength="50"
            :bordered="false"
            :spellcheck="false"
            :placeholder="t('placeholder.pleaseEnter')"
            class="bg-[var(--chat-bubble)] hover:bg-[var(--chat-bubble)]"
            style="padding: 8px 6px"
            :auto-size="{ minRows: 4, maxRows: 4 }"
          />
        </div>
        <div class="my-6 flex justify-center">
          <a-button class="w-[60%]" type="primary" :loading="loading" @click="sendApplication">
            {{ t("placeholder.send") }}
          </a-button>
        </div>
      </div>

      <div v-else class="bg-[#F2F8FF] p-5.5">
        <div class="mb-3">{{ `${t("placeholder.groupMember")}：${groupData?.memberCount ?? 0}` }}</div>
        <div class="flex items-center">
          <OIMAvatar
            v-for="member in renderList"
            :key="member.userID"
            class="mr-3"
            :src="member.faceURL"
            :text="member.nickname"
          />
          <OIMAvatar v-if="renderList.length === 7" :src="memberEtc" />
        </div>
        <div class="mt-28 flex justify-center">
          <a-button class="w-[60%]" type="primary" :loading="loading" @click="joinOrSendMessage">
            {{ groupData?.inGroup ? t("placeholder.sendMessage") : t("placeholder.addGroup") }}
          </a-button>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { CloseOutlined, LeftOutlined } from "@ant-design/icons-vue";
import { GroupJoinSource, SessionType, type GroupItem, type GroupMemberItem, type WSEvent } from "@openim/wasm-client-sdk";
import { message } from "ant-design-vue";
import dayjs from "dayjs";
import { computed, ref, watch } from "vue";

import clock from "@/assets/images/common/clock.png";
import memberEtc from "@/assets/images/common/member_etc.png";
import OIMAvatar from "@/components/OIMAvatar.vue";
import { toSpecifiedConversation } from "@/im/conversation";
import { IMSDK } from "@/im/sdk";
import { ts as t } from "@/i18n";

const props = defineProps<{
  open: boolean;
  groupData?: GroupItem & { inGroup?: boolean };
}>();

const emit = defineEmits<{
  "update:open": [open: boolean];
}>();

const reqMsg = ref("");
const isSendRequest = ref(false);
const loading = ref(false);
const memberList = ref<GroupMemberItem[]>([]);

const closeModal = () => {
  emit("update:open", false);
};

const createTimeStr = computed(() =>
  dayjs(props.groupData?.createTime ?? 0).format("YYYY/M/D"),
);
const sliceNum = computed(() => (props.groupData?.memberCount === 8 ? 8 : 7));
const renderList = computed(() => memberList.value.slice(0, sliceNum.value));

const getMemberData = async () => {
  if (!props.groupData?.groupID) return;
  try {
    const { data } = await IMSDK.getGroupMemberList({
      groupID: props.groupData.groupID,
      offset: 0,
      count: 500,
      filter: 0,
    });
    memberList.value = data;
  } catch (error) {
    console.error("getGroupMemberList", error);
  }
};

const joinOrSendMessage = async () => {
  if (!props.groupData) return;
  if (props.groupData.inGroup) {
    await toSpecifiedConversation({
      sourceID: props.groupData.groupID,
      sessionType: SessionType.WorkingGroup,
    });
    closeModal();
    return;
  }
  isSendRequest.value = true;
};

const sendApplication = async () => {
  if (!props.groupData?.groupID) return;
  loading.value = true;
  try {
    await IMSDK.joinGroup({
      groupID: props.groupData.groupID,
      reqMsg: reqMsg.value,
      joinSource: GroupJoinSource.Search,
    });
    message.success(t("toast.sendJoinGroupRequestSuccess"));
    isSendRequest.value = false;
  } catch (error) {
    message.error((error as WSEvent).errMsg ?? t("toast.sendApplicationFailed"));
  } finally {
    loading.value = false;
  }
};

const resetState = () => {
  reqMsg.value = "";
  isSendRequest.value = false;
  memberList.value = [];
};

watch(
  () => props.open,
  (open) => {
    if (open) {
      getMemberData();
    }
  },
);
</script>
