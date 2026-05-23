<template>
  <a-modal
    :open="open"
    :footer="null"
    :closable="false"
    :width="332"
    centered
    destroy-on-close
    class="no-padding-modal"
    :mask="false"
    :mask-style="{ opacity: 0, transition: 'none' }"
    @cancel="closeModal"
    @after-close="resetState"
  >
    <a-spin :spinning="loading">
      <div
        v-if="isSendRequest"
        class="flex max-h-[520px] min-h-[484px] flex-col overflow-hidden px-5.5"
      >
        <div class="w-full">
          <div class="mb-8 mt-4.5 flex items-center">
            <LeftOutlined class="cursor-pointer text-[var(--sub-text)]" @click="backToCard" />
            <div class="ml-2 font-medium">{{ t("placeholder.friendVerification") }}</div>
          </div>
        </div>
        <div class="flex flex-1 flex-col">
          <div class="flex items-center">
            <OIMAvatar :size="60" :src="cardInfo?.faceURL" :text="cardInfo?.nickname" />
            <div class="ml-3 flex-1 overflow-hidden">
              <div class="mb-3 flex-1 truncate text-base font-medium" :title="cardInfo?.nickname">
                {{ cardInfo?.nickname }}
              </div>
              <div class="mr-3 text-xs text-[var(--sub-text)]">{{ cardInfo?.userID }}</div>
            </div>
          </div>
          <div class="mt-7">
            <div class="text-xs text-[var(--sub-text)]">{{ t("application.information") }}</div>
            <div class="mx-2 my-4">
              <a-textarea
                v-model:value="reqMsg"
                show-count
                :maxlength="50"
                :bordered="false"
                :placeholder="t('placeholder.pleaseEnter')"
                :spellcheck="false"
                class="bg-[var(--chat-bubble)] hover:bg-[var(--chat-bubble)]"
                :auto-size="{ minRows: 6, maxRows: 6 }"
                style="padding: 8px 6px"
              />
            </div>
          </div>
          <div class="mx-2 mb-6 flex flex-1 items-end">
            <a-button class="flex-1" type="primary" :loading="sendLoading" @click="sendApplication">
              {{ t("placeholder.send") }}
            </a-button>
          </div>
        </div>
      </div>

      <div
        v-else
        class="card-shell flex max-h-[520px] min-h-[484px] flex-col overflow-hidden px-5.5"
      >
        <div class="flex h-[104px] min-h-[104px] w-full justify-end pt-4">
          <CloseOutlined class="cursor-pointer text-white" @click="closeModal" />
        </div>
        <div class="flex flex-1 flex-col overflow-hidden">
          <div class="flex items-center">
            <OIMAvatar :size="60" :src="cardInfo?.faceURL" :text="cardInfo?.nickname" />
            <div class="ml-3 flex h-[60px] flex-1 flex-col justify-around overflow-hidden">
              <div class="flex w-fit max-w-[80%] items-baseline">
                <div class="flex-1 select-text truncate text-base font-medium text-white" :title="cardInfo?.nickname">
                  {{ cardInfo?.nickname }}
                </div>
              </div>
              <div class="flex items-center">
                <div class="mr-3 cursor-pointer text-xs text-[var(--sub-text)]" @click="copyID">
                  {{ cardInfo?.userID }}
                </div>
              </div>
            </div>
          </div>
          <div class="flex-1 overflow-y-auto">
            <div class="my-4 text-[var(--sub-text)]">{{ t("placeholder.personalInfo") }}</div>
            <div v-for="field in userFields" :key="field.title" class="my-4 flex items-center text-xs">
              <div class="w-24 text-[var(--sub-text)]">{{ field.title }}</div>
              <template v-if="field.editable">
                <a-input
                  v-if="editingRemark"
                  v-model:value="remarkDraft"
                  size="small"
                  class="flex-1"
                  @press-enter="tryUpdateRemark"
                  @blur="tryUpdateRemark"
                />
                <div
                  v-else
                  class="flex-1 cursor-pointer select-text truncate font-medium"
                  @click="startEditRemark"
                >
                  {{ field.value }}
                </div>
              </template>
              <div v-else class="flex-1 select-text truncate">{{ field.value }}</div>
            </div>
          </div>
        </div>
        <div class="mx-1 mb-6 mt-3 flex items-center gap-6">
          <a-button v-if="showAddFriend" type="primary" class="flex-1" @click="trySendRequest">
            {{ t("placeholder.addFriends") }}
          </a-button>
          <a-button v-if="isSelfCard" type="primary" class="flex-1" @click="editInfoOpen = true">
            {{ t("placeholder.editInfo") }}
          </a-button>
          <a-button v-if="!isSelfCard" type="primary" class="flex-1" @click="sendMessage">
            {{ t("placeholder.sendMessage") }}
          </a-button>
        </div>
      </div>
    </a-spin>

    <a-modal
      v-model:open="editInfoOpen"
      :footer="null"
      :closable="false"
      :width="484"
      centered
      destroy-on-close
      class="no-padding-modal"
      :mask="false"
      :mask-style="{ opacity: 0, transition: 'none' }"
    >
      <div>
        <div class="flex bg-[var(--chat-bubble)] p-5">
          <span class="text-base font-medium">{{ t("placeholder.editInfo") }}</span>
        </div>
        <a-form
          :model="editForm"
          :colon="false"
          :label-col="{ span: 3 }"
          class="sub-label-form p-6.5"
          autocomplete="off"
          @finish="updateSelfInfo"
        >
          <a-form-item
            :label="t('placeholder.nickName')"
            name="nickname"
            :rules="[{ required: true, message: t('toast.inputNickName') }]"
          >
            <a-input v-model:value="editForm.nickname" :maxlength="20" :spellcheck="false" />
          </a-form-item>
          <a-form-item :label="t('placeholder.gender')" name="gender">
            <a-select v-model:value="editForm.gender">
              <a-select-option :value="1">{{ t("placeholder.man") }}</a-select-option>
              <a-select-option :value="2">{{ t("placeholder.female") }}</a-select-option>
              <a-select-option :value="0">{{ t("placeholder.unknown") }}</a-select-option>
            </a-select>
          </a-form-item>
          <a-form-item :label="t('placeholder.phoneNumber')" name="phoneNumber">
            <a-input v-model:value="editForm.phoneNumber" disabled />
          </a-form-item>
          <a-form-item
            :label="t('placeholder.email')"
            name="email"
            :rules="[{ type: 'email', message: t('toast.inputCorrectEmail') }]"
          >
            <a-input v-model:value="editForm.email" :spellcheck="false" :placeholder="t('toast.inputEmail')" />
          </a-form-item>
          <a-form-item :label="t('placeholder.birth')" name="birth">
            <a-date-picker v-model:value="editForm.birth" :disabled-date="disabledFutureDate" />
          </a-form-item>
          <a-form-item class="mb-0">
            <div class="flex justify-end">
              <a-button class="mr-3.5 border-0 bg-[var(--chat-bubble)] px-6" @click="editInfoOpen = false">
                {{ t("cancel") }}
              </a-button>
              <a-button class="px-6" type="primary" html-type="submit" :loading="editLoading">
                {{ t("confirm") }}
              </a-button>
            </div>
          </a-form-item>
        </a-form>
      </div>
    </a-modal>
  </a-modal>
</template>

<script setup lang="ts">
import { CloseOutlined, LeftOutlined } from "@ant-design/icons-vue";
import { CbEvents, SessionType, type FriendUserItem, type GroupMemberItem, type WSEvent } from "@openim/wasm-client-sdk";
import { message } from "ant-design-vue";
import dayjs, { type Dayjs } from "dayjs";
import { computed, reactive, ref, watch } from "vue";

import { getBusinessUserInfo, updateBusinessUserInfo } from "@/api/login";
import OIMAvatar from "@/components/OIMAvatar.vue";
import { toSpecifiedConversation } from "@/im/conversation";
import { IMSDK } from "@/im/sdk";
import { ts as t } from "@/i18n";
import { useContactStore } from "@/stores/contact";
import { useUserStore } from "@/stores/user";

import type { CardInfo } from "./types";

type FieldRow = {
  title: string;
  value: string;
  editable?: boolean;
};

const props = defineProps<{
  open: boolean;
  userID?: string;
  groupID?: string;
  isSelf?: boolean;
  notAdd?: boolean;
  cardInfo?: CardInfo;
}>();

const emit = defineEmits<{
  "update:open": [open: boolean];
}>();

const userStore = useUserStore();
const contactStore = useContactStore();
const cardInfo = ref<CardInfo>();
const userFields = ref<FieldRow[]>([]);
const isSendRequest = ref(false);
const reqMsg = ref("");
const loading = ref(false);
const sendLoading = ref(false);
const editInfoOpen = ref(false);
const editLoading = ref(false);
const editingRemark = ref(false);
const remarkDraft = ref("");

const editForm = reactive<{
  nickname?: string;
  gender?: number;
  phoneNumber?: string;
  email?: string;
  birth?: Dayjs;
}>({});

const isSelfCard = computed(() => Boolean(props.isSelf));
const isFriendUser = computed(() =>
  contactStore.friendList.some((item) => item.userID === props.userID),
);
const showAddFriend = computed(
  () => !isFriendUser.value && !isSelfCard.value && !props.notAdd,
);

const closeModal = () => {
  emit("update:open", false);
};

const getGender = (gender?: number) => {
  if (!gender) return "-";
  return gender === 1 ? t("placeholder.man") : t("placeholder.female");
};

const setUserInfoRow = (info: CardInfo) => {
  let fields: FieldRow[] = [
    {
      title: t("placeholder.nickName"),
      value: info.nickname || "",
    },
  ];
  const isFriend = info.remark !== undefined;
  if (isFriend) {
    fields.push({
      title: t("placeholder.remark"),
      value: info.remark || "-",
      editable: true,
    });
  }
  if (isFriend || isSelfCard.value) {
    fields = [
      ...fields,
      {
        title: t("placeholder.gender"),
        value: getGender(info.gender),
      },
      {
        title: t("placeholder.birth"),
        value: info.birth ? dayjs(info.birth).format("YYYY/M/D") : "-",
      },
      {
        title: t("placeholder.phoneNumber"),
        value: info.phoneNumber || "-",
      },
      {
        title: t("placeholder.email"),
        value: info.email || "-",
      },
    ];
  }
  userFields.value = fields;
};

const refreshEditForm = () => {
  const source = cardInfo.value ?? {};
  editForm.nickname = source.nickname;
  editForm.gender = source.gender;
  editForm.phoneNumber = source.phoneNumber;
  editForm.email = source.email;
  editForm.birth = source.birth ? dayjs(source.birth) : undefined;
};

const getCardInfo = async () => {
  if (!props.userID && !props.isSelf) return;
  loading.value = true;
  try {
    if (props.isSelf) {
      cardInfo.value = { ...userStore.selfInfo };
      setUserInfoRow(cardInfo.value);
      refreshEditForm();
      return;
    }
    if (props.cardInfo) {
      cardInfo.value = { ...props.cardInfo };
      setUserInfoRow(cardInfo.value);
      return;
    }

    let userInfo: CardInfo = {};
    const friendInfo = contactStore.friendList.find((item) => item.userID === props.userID);
    if (friendInfo) {
      userInfo = { ...friendInfo };
    } else {
      const { data } = await IMSDK.getUsersInfo([props.userID!]);
      userInfo = { ...(data[0] ?? {}) };
    }

    try {
      const {
        data: { users },
      } = await getBusinessUserInfo([props.userID!]);
      userInfo = { ...userInfo, ...users[0] };
    } catch (error) {
      console.error("get business user info failed", props.userID, error);
    }
    cardInfo.value = userInfo;
    setUserInfoRow(userInfo);
  } finally {
    loading.value = false;
  }
};

const friendAddedHandler = ({ data }: WSEvent<FriendUserItem>) => {
  if (data.userID === props.userID) {
    getCardInfo();
  }
};

const copyID = async () => {
  await navigator.clipboard?.writeText(cardInfo.value?.userID ?? "");
  message.success(t("toast.copySuccess"));
};

const trySendRequest = () => {
  isSendRequest.value = true;
};

const backToCard = () => {
  isSendRequest.value = false;
};

const sendApplication = async () => {
  if (!cardInfo.value?.userID) return;
  sendLoading.value = true;
  try {
    await IMSDK.addFriend({
      toUserID: cardInfo.value.userID,
      reqMsg: reqMsg.value,
    });
    message.success(t("toast.sendFreiendRequestSuccess"));
  } catch (error) {
    message.error((error as WSEvent).errMsg ?? t("toast.sendApplicationFailed"));
  } finally {
    sendLoading.value = false;
    backToCard();
  }
};

const sendMessage = async () => {
  if (!props.userID) return;
  await toSpecifiedConversation({
    sourceID: props.userID,
    sessionType: SessionType.Single,
  });
  closeModal();
};

const startEditRemark = () => {
  editingRemark.value = true;
  remarkDraft.value = cardInfo.value?.remark || "";
};

const tryUpdateRemark = async () => {
  if (!editingRemark.value || !props.userID) return;
  editingRemark.value = false;
  try {
    await IMSDK.updateFriends({
      friendUserIDs: [props.userID],
      remark: remarkDraft.value,
    });
    cardInfo.value = {
      ...cardInfo.value,
      remark: remarkDraft.value,
    };
    const friend = contactStore.friendList.find((item) => item.userID === props.userID);
    if (friend) {
      contactStore.updateFriend({ ...friend, remark: remarkDraft.value });
    }
    setUserInfoRow(cardInfo.value);
  } catch (error) {
    message.error((error as WSEvent).errMsg ?? String(error));
  }
};

const disabledFutureDate = (current: Dayjs) => current && current > dayjs().endOf("day");

const updateSelfInfo = async () => {
  editLoading.value = true;
  const options = {
    nickname: editForm.nickname,
    email: editForm.email,
    gender: editForm.gender,
    birth: editForm.birth ? editForm.birth.unix() * 1000 : undefined,
  };
  try {
    await updateBusinessUserInfo(options);
    userStore.updateSelfInfo(options);
    cardInfo.value = { ...cardInfo.value, ...options };
    setUserInfoRow(cardInfo.value);
    editInfoOpen.value = false;
  } catch (error) {
    message.error((error as WSEvent).errMsg ?? String(error));
  } finally {
    editLoading.value = false;
  }
};

const resetState = () => {
  cardInfo.value = undefined;
  userFields.value = [];
  isSendRequest.value = false;
  reqMsg.value = "";
  editingRemark.value = false;
};

watch(
  () => props.open,
  (open) => {
    if (open) {
      getCardInfo();
      IMSDK.on(CbEvents.OnFriendAdded, friendAddedHandler);
    } else {
      IMSDK.off(CbEvents.OnFriendAdded, friendAddedHandler);
    }
  },
  { immediate: true },
);

watch(
  () => props.cardInfo,
  (info) => {
    if (props.open && info) {
      cardInfo.value = { ...info };
      setUserInfoRow(cardInfo.value);
    }
  },
);
</script>

<style scoped lang="scss">
.card-shell {
  background: url("@/assets/images/common/card_bg.png") no-repeat;
  background-size: 332px 134px;
}
</style>
