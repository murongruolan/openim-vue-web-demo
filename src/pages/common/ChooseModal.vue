<template>
  <a-modal
    :open="open"
    :footer="null"
    :closable="false"
    :width="680"
    centered
    destroy-on-close
    class="no-padding-modal max-w-[80vw]"
    :mask="false"
    :mask-style="{ opacity: 0, transition: 'none' }"
    @cancel="closeModal"
    @after-close="resetState"
  >
    <div class="flex h-16 items-center justify-between bg-[var(--gap-text)] px-7">
      <div>{{ titleMap[state.type] }}</div>
      <CloseOutlined class="cursor-pointer text-[var(--sub-text)]" @click="closeModal" />
    </div>

    <template v-if="state.type === 'CRATE_GROUP'">
      <div class="px-6 pt-4">
        <div class="mb-6 flex items-center">
          <div class="min-w-[60px] font-medium">{{ t("placeholder.groupName") }}</div>
          <a-input
            v-model:value="groupBaseInfo.groupName"
            :placeholder="t('placeholder.pleaseEnter')"
            :maxlength="16"
            :spellcheck="false"
          />
        </div>
        <div class="mb-6 flex items-center">
          <div class="min-w-[60px] font-medium">{{ t("placeholder.groupAvatar") }}</div>
          <div class="flex items-center">
            <OIMAvatar :src="groupBaseInfo.groupAvatar" isgroup />
            <label class="ml-3 cursor-pointer text-xs text-[var(--primary)]">
              {{ t("placeholder.clickToModify") }}
              <input class="hidden" type="file" accept="image/*" @change="uploadAvatar" />
            </label>
          </div>
        </div>
        <div class="flex">
          <div class="min-w-[60px] font-medium">{{ t("placeholder.groupMember") }}</div>
          <ChooseBox
            class="!m-0 !h-[40vh] flex-1"
            :model-value="checkedList"
            :list="friendCheckList"
            @update:model-value="checkedList = $event"
          />
        </div>
      </div>
    </template>

    <ChooseBox
      v-else
      class="!h-[60vh]"
      :model-value="checkedList"
      :list="state.type === 'INVITE_TO_GROUP' ? inviteFriendList : memberCheckList"
      :choose-one-only="state.type === 'TRANSFER_IN_GROUP'"
      @update:model-value="checkedList = $event"
    />

    <div class="flex justify-end px-9 py-6">
      <a-button class="mr-6 border-0 bg-[var(--chat-bubble)] px-6" @click="closeModal">
        {{ t("cancel") }}
      </a-button>
      <a-button class="px-6" type="primary" :loading="loading" @click="confirmChoose">
        {{ t("confirm") }}
      </a-button>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { CloseOutlined, RightOutlined } from "@ant-design/icons-vue";
import {
  GroupMemberRole,
  GroupType,
  SessionType,
  type GroupMemberItem,
  type WSEvent,
} from "@openim/wasm-client-sdk";
import { message } from "ant-design-vue";
import { computed, defineComponent, h, reactive, ref, watch } from "vue";

import friendIcon from "@/assets/images/chooseModal/friend.png";
import OIMAvatar from "@/components/OIMAvatar.vue";
import { toSpecifiedConversation } from "@/im/conversation";
import { IMSDK } from "@/im/sdk";
import { ts as t } from "@/i18n";
import { useContactStore } from "@/stores/contact";
import { useConversationStore } from "@/stores/conversation";
import { useUserStore } from "@/stores/user";
import { emit as emitEvent } from "@/utils/events";
import { uploadFile } from "@/utils/imCommon";

import type { CheckListItem, ChooseModalState, SelectUserParams } from "./types";

const props = defineProps<{
  open: boolean;
  state: ChooseModalState;
}>();

const emit = defineEmits<{
  "update:open": [open: boolean];
}>();

const contactStore = useContactStore();
const conversationStore = useConversationStore();
const userStore = useUserStore();
const loading = ref(false);
const checkedList = ref<CheckListItem[]>([]);
const memberList = ref<GroupMemberItem[]>([]);
const groupBaseInfo = reactive({
  groupName: "",
  groupAvatar: "",
});

const titleMap = computed<Record<string, string>>(() => ({
  CRATE_GROUP: t("placeholder.createGroup"),
  INVITE_TO_GROUP: t("placeholder.invitation"),
  KICK_FORM_GROUP: t("placeholder.kickMember"),
  TRANSFER_IN_GROUP: t("placeholder.transferGroup"),
  SELECT_USER: t("placeholder.selectUser"),
}));

const friendCheckList = computed<CheckListItem[]>(() =>
  contactStore.friendList.map((item) => ({ ...item })),
);

const memberCheckList = computed<CheckListItem[]>(() => {
  const currentRole = conversationStore.currentMemberInGroup?.roleLevel ?? 0;
  const selfID = userStore.selfInfo.userID;
  return memberList.value.map((member) => ({
    ...member,
    disabled:
      member.userID === selfID ||
      (props.state.type === "KICK_FORM_GROUP" && member.roleLevel >= currentRole),
  }));
});

const inviteFriendList = ref<CheckListItem[]>([]);

const closeModal = () => {
  emit("update:open", false);
};

const isSameItem = (a: CheckListItem, b: CheckListItem) =>
  (a.userID && b.userID && a.userID === b.userID) ||
  (a.groupID && b.groupID && a.groupID === b.groupID);

const getGroupMembers = async (groupID?: string) => {
  const sourceID = groupID || conversationStore.currentConversation?.groupID || "";
  if (!sourceID) return;
  try {
    const { data } = await IMSDK.getGroupMemberList({
      groupID: sourceID,
      offset: 0,
      count: 500,
      filter: 0,
    });
    memberList.value = data;
  } catch (error) {
    message.error((error as WSEvent).errMsg ?? t("toast.getMemberListFailed"));
  }
};

const checkUsersInGroup = async () => {
  const groupID =
    (props.state.extraData as string | undefined) ||
    conversationStore.currentConversation?.groupID ||
    "";
  if (!groupID) {
    inviteFriendList.value = friendCheckList.value;
    return;
  }
  const list = friendCheckList.value.map((item) => ({ ...item }));
  const userIDList = list.filter((item) => item.userID).map((item) => item.userID!);
  try {
    const { data } = await IMSDK.getUsersInGroup({ groupID, userIDList });
    inviteFriendList.value = list.map((item) => ({
      ...item,
      disabled: item.userID ? data.includes(item.userID) : false,
    }));
  } catch (error) {
    inviteFriendList.value = list;
  }
};

const applyPresetList = () => {
  if (props.state.type === "CRATE_GROUP" && Array.isArray(props.state.extraData)) {
    checkedList.value = [...(props.state.extraData as CheckListItem[])];
  }
  if (props.state.type === "SELECT_USER" && props.state.extraData) {
    checkedList.value = [...((props.state.extraData as SelectUserParams).choosedList ?? [])];
  }
};

const confirmChoose = async () => {
  const selected = checkedList.value;
  if (!selected.length && props.state.type !== "SELECT_USER") {
    message.warning(t("toast.selectLeastOne"));
    return;
  }
  if (!groupBaseInfo.groupName.trim() && props.state.type === "CRATE_GROUP") {
    message.warning(t("toast.inputGroupName"));
    return;
  }

  loading.value = true;
  try {
    switch (props.state.type) {
      case "CRATE_GROUP":
        if (selected.length === 1) {
          await toSpecifiedConversation({
            sourceID: selected[0].userID!,
            sessionType: SessionType.Single,
          });
          break;
        }
        await IMSDK.createGroup({
          groupInfo: {
            groupType: GroupType.WorkingGroup,
            groupName: groupBaseInfo.groupName,
            faceURL: groupBaseInfo.groupAvatar,
          },
          memberUserIDs: selected.map((item) => item.userID!),
          adminUserIDs: [],
        });
        contactStore.getGroupListByReq();
        break;
      case "INVITE_TO_GROUP":
        await IMSDK.inviteUserToGroup({
          groupID: props.state.extraData as string,
          userIDList: selected.map((item) => item.userID!),
          reason: "",
        });
        break;
      case "KICK_FORM_GROUP":
        await IMSDK.kickGroupMember({
          groupID: props.state.extraData as string,
          userIDList: selected.map((item) => item.userID!),
          reason: "",
        });
        break;
      case "TRANSFER_IN_GROUP":
        await IMSDK.transferGroupOwner({
          groupID: props.state.extraData as string,
          newOwnerUserID: selected[0].userID!,
        });
        break;
      case "SELECT_USER":
        emitEvent("SELECT_USER", {
          notConversation: Boolean((props.state.extraData as SelectUserParams).notConversation),
          choosedList: selected,
        });
        break;
      default:
        break;
    }
    closeModal();
  } catch (error) {
    message.error((error as WSEvent).errMsg ?? String(error));
  } finally {
    loading.value = false;
  }
};

const uploadAvatar = async (event: Event) => {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;
  try {
    const {
      data: { url },
    } = await uploadFile(file);
    groupBaseInfo.groupAvatar = url;
  } catch (error) {
    message.error((error as WSEvent).errMsg ?? t("toast.updateAvatarFailed"));
  }
};

const resetState = () => {
  checkedList.value = [];
  memberList.value = [];
  inviteFriendList.value = [];
  groupBaseInfo.groupName = "";
  groupBaseInfo.groupAvatar = "";
};

watch(
  () => props.open,
  (open) => {
    if (!open) return;
    applyPresetList();
    if (props.state.type === "INVITE_TO_GROUP") {
      checkUsersInGroup();
    }
    if (props.state.type === "KICK_FORM_GROUP" || props.state.type === "TRANSFER_IN_GROUP") {
      getGroupMembers(props.state.extraData as string);
    }
  },
);

const ChooseBox = defineComponent({
  name: "ChooseBox",
  props: {
    modelValue: {
      type: Array as () => CheckListItem[],
      required: true,
    },
    list: {
      type: Array as () => CheckListItem[],
      required: true,
    },
    class: {
      type: String,
      default: "",
    },
    chooseOneOnly: {
      type: Boolean,
      default: false,
    },
  },
  emits: ["update:modelValue"],
  setup(boxProps, { emit: boxEmit }) {
    const showList = ref(false);
    const toggle = (item: CheckListItem) => {
      if (item.disabled) return;
      const checked = [...boxProps.modelValue];
      const idx = checked.findIndex((selected) => isSameItem(selected, item));
      if (idx > -1) {
        checked.splice(idx, 1);
      } else {
        if (boxProps.chooseOneOnly && checked.length > 0) {
          message.warning(t("toast.beyondSelectionLimit"));
          return;
        }
        checked.push(item);
      }
      boxEmit("update:modelValue", checked);
    };
    const isChecked = (item: CheckListItem) =>
      boxProps.modelValue.some((selected) => isSameItem(selected, item));
    const showName = (item: CheckListItem) =>
      item.remark || item.nickname || item.groupName || item.showName || item.userID;

    return () =>
      h(
        "div",
        {
          class: [
            "mx-9 mt-5 flex h-[480px] rounded-md border border-[var(--gap-text)]",
            boxProps.class,
          ],
        },
        [
          h("div", { class: "flex flex-1 flex-col border-r border-[var(--gap-text)]" }, [
            h("div", { class: "py-3 pb-3" }),
            !showList.value
              ? h(
                  "div",
                  { class: "flex-1 overflow-auto" },
                  h(
                    "div",
                    {
                      class:
                        "mx-2 flex cursor-pointer items-center justify-between rounded-md px-3.5 py-2.5 hover:bg-[var(--primary-active)]",
                      onClick: () => {
                        showList.value = true;
                      },
                    },
                    [
                      h("div", { class: "flex items-center" }, [
                        h("img", { width: 42, src: friendIcon, alt: "" }),
                        h("div", { class: "ml-3.5" }, t("placeholder.myFriend")),
                      ]),
                      h(RightOutlined, { class: "text-[var(--sub-text)]" }),
                    ],
                  ),
                )
              : h("div", { class: "flex flex-1 flex-col" }, [
                  h(
                    "div",
                    {
                      class: "mx-5.5 cursor-pointer text-xs text-[var(--primary)]",
                      onClick: () => {
                        showList.value = false;
                      },
                    },
                    `${t("placeholder.contacts")} > ${t("placeholder.myFriend")}`,
                  ),
                  h(
                    "div",
                    { class: "mb-3 flex-1 overflow-y-auto" },
                    boxProps.list.map((item) =>
                      h(
                        "div",
                        {
                          key: item.userID || item.groupID,
                          class: [
                            "mx-2 flex items-center justify-between rounded-md px-3.5 py-2.5 hover:bg-[var(--primary-active)]",
                            item.disabled ? "opacity-50" : "cursor-pointer",
                          ],
                          onClick: () => toggle(item),
                        },
                        [
                          h("div", { class: "flex items-center" }, [
                            h("input", {
                              type: "checkbox",
                              class: "mr-3",
                              checked: isChecked(item),
                              disabled: item.disabled,
                              onClick: (event: Event) => event.stopPropagation(),
                              onChange: () => toggle(item),
                            }),
                            h(OIMAvatar, {
                              src: item.faceURL,
                              text: showName(item),
                              isgroup:
                                Boolean(item.groupName) ||
                                item.conversationType === SessionType.WorkingGroup,
                            }),
                            h("div", { class: "ml-3 max-w-[120px] truncate" }, showName(item)),
                            item.roleLevel === GroupMemberRole.Owner
                              ? h(
                                  "span",
                                  {
                                    class:
                                      "ml-2 rounded border border-[#FF9831] px-1 text-xs text-[#FF9831]",
                                  },
                                  t("placeholder.groupOwner"),
                                )
                              : null,
                          ]),
                          h(RightOutlined, { class: "text-[var(--sub-text)]" }),
                        ],
                      ),
                    ),
                  ),
                ]),
          ]),
          h("div", { class: "flex flex-1 flex-col overflow-hidden" }, [
            h("div", { class: "mx-5 py-5.5" }, [
              t("placeholder.selected"),
              h("span", { class: "text-[var(--primary)]" }, ` ${boxProps.modelValue.length} `),
            ]),
            h(
              "div",
              { class: "mb-3 flex-1 overflow-y-auto" },
              boxProps.modelValue.map((item) =>
                h(
                  "div",
                  {
                    key: item.userID || item.groupID,
                    class:
                      "mx-2 flex items-center justify-between rounded-md px-3.5 py-2.5 hover:bg-[var(--primary-active)]",
                  },
                  [
                    h("div", { class: "flex items-center" }, [
                      h(OIMAvatar, {
                        src: item.faceURL,
                        text: showName(item),
                        isgroup:
                          Boolean(item.groupName) ||
                          item.conversationType === SessionType.WorkingGroup,
                      }),
                      h("div", { class: "ml-3 max-w-[120px] truncate" }, showName(item)),
                    ]),
                    h(CloseOutlined, {
                      class: "cursor-pointer text-[var(--sub-text)]",
                      onClick: () => toggle(item),
                    }),
                  ],
                ),
              ),
            ),
          ]),
        ],
      );
  },
});
</script>
