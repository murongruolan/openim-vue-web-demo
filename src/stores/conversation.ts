import type { ConversationItem, GroupItem, GroupMemberItem, MessageItem } from "@openim/wasm-client-sdk";
import { defineStore } from "pinia";

import { IMSDK } from "@/im/sdk";
import { conversationSort, isGroupSession } from "@/utils/imCommon";

import { useUserStore } from "./user";
import type { ConversationListUpdateType, ConversationStoreState } from "./types";

const CONVERSATION_SPLIT_COUNT = 500;

export const useConversationStore = defineStore("conversation", {
  state: (): ConversationStoreState => ({
    conversationList: [],
    currentConversation: undefined,
    unReadCount: 0,
    currentGroupInfo: undefined,
    currentMemberInGroup: undefined,
    newMessageList: [],
  }),
  actions: {
    async getConversationListByReq(isOffset?: boolean) {
      let tmpConversationList: ConversationItem[] = [];
      try {
        const { data } = await IMSDK.getConversationListSplit({
          offset: isOffset ? this.conversationList.length : 0,
          count: CONVERSATION_SPLIT_COUNT,
        });
        tmpConversationList = data;
      } catch (error) {
        console.error("getConversationListByReq", error);
        return true;
      }

      this.conversationList = [
        ...(isOffset ? this.conversationList : []),
        ...tmpConversationList,
      ];
      return tmpConversationList.length === CONVERSATION_SPLIT_COUNT;
    },
    updateConversationList(list: ConversationItem[], type: ConversationListUpdateType) {
      const idx = list.findIndex(
        (conversation) =>
          conversation.conversationID === this.currentConversation?.conversationID,
      );
      if (idx > -1) {
        this.updateCurrentConversation(list[idx]);
      }

      if (type === "filter") {
        this.conversationList = conversationSort(
          [...list, ...this.conversationList],
          this.conversationList,
        );
        return;
      }

      const ids = list.map((conversation) => conversation.conversationID);
      const filterArr = this.conversationList.filter(
        (conversation) => !ids.includes(conversation.conversationID),
      );
      this.conversationList = conversationSort([...list, ...filterArr]);
    },
    async updateCurrentConversation(conversation?: ConversationItem) {
      if (!conversation) {
        this.currentConversation = undefined;
        this.currentGroupInfo = undefined;
        this.currentMemberInGroup = undefined;
        return;
      }

      const prevConversation = this.currentConversation;
      const toggleNewConversation =
        conversation.conversationID !== prevConversation?.conversationID;
      if (toggleNewConversation && isGroupSession(conversation.conversationType)) {
        this.getCurrentGroupInfoByReq(conversation.groupID);
        await this.getCurrentMemberInGroupByReq(conversation.groupID);
      }
      this.currentConversation = { ...conversation };
    },
    async getUnReadCountByReq() {
      try {
        const { data } = await IMSDK.getTotalUnreadMsgCount();
        this.unReadCount = data;
        return data;
      } catch (error) {
        console.error("getUnReadCountByReq", error);
        return 0;
      }
    },
    updateUnReadCount(count: number) {
      this.unReadCount = count;
    },
    async getCurrentGroupInfoByReq(groupID: string) {
      try {
        const { data } = await IMSDK.getSpecifiedGroupsInfo([groupID]);
        this.currentGroupInfo = data[0] ? { ...data[0] } : undefined;
      } catch (error) {
        console.error("getCurrentGroupInfoByReq", error);
      }
    },
    updateCurrentGroupInfo(groupInfo: GroupItem) {
      this.currentGroupInfo = { ...groupInfo };
    },
    async getCurrentMemberInGroupByReq(groupID: string) {
      const selfID = useUserStore().selfInfo.userID;
      if (!selfID) {
        this.currentMemberInGroup = undefined;
        return;
      }
      try {
        const { data } = await IMSDK.getSpecifiedGroupMembersInfo({
          groupID,
          userIDList: [selfID],
        });
        this.currentMemberInGroup = data[0] ? { ...data[0] } : undefined;
      } catch (error) {
        this.currentMemberInGroup = undefined;
        console.error("getCurrentMemberInGroupByReq", error);
      }
    },
    setCurrentMemberInGroup(memberInfo?: GroupMemberItem) {
      this.currentMemberInGroup = memberInfo;
    },
    tryUpdateCurrentMemberInGroup(member: GroupMemberItem) {
      const currentMemberInGroup = this.currentMemberInGroup;
      if (
        member.groupID === currentMemberInGroup?.groupID &&
        member.userID === currentMemberInGroup?.userID
      ) {
        this.currentMemberInGroup = { ...member };
      }
    },
    pushNewMessage(message: MessageItem) {
      this.newMessageList = [...this.newMessageList, message];
    },
    updateOneMessage(message: MessageItem) {
      const idx = this.newMessageList.findIndex(
        (item) => item.clientMsgID === message.clientMsgID,
      );
      if (idx < 0) return;
      const list = [...this.newMessageList];
      list[idx] = {
        ...list[idx],
        ...message,
      };
      this.newMessageList = list;
    },
    clearConversationStore() {
      this.conversationList = [];
      this.currentConversation = undefined;
      this.unReadCount = 0;
      this.currentGroupInfo = undefined;
      this.currentMemberInGroup = undefined;
      this.newMessageList = [];
    },
  },
});
