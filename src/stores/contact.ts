import type {
  BlackUserItem,
  FriendApplicationItem,
  FriendUserItem,
  GroupApplicationItem,
  GroupItem,
} from "@openim/wasm-client-sdk";
import { ApplicationHandleResult } from "@openim/wasm-client-sdk";
import { defineStore } from "pinia";

import { IMSDK } from "@/im/sdk";

import type { ContactStoreState } from "./types";

export const useContactStore = defineStore("contact", {
  state: (): ContactStoreState => ({
    friendList: [],
    blackList: [],
    groupList: [],
    recvFriendApplicationList: [],
    sendFriendApplicationList: [],
    recvGroupApplicationList: [],
    sendGroupApplicationList: [],
    unHandleFriendApplicationCount: 0,
    unHandleGroupApplicationCount: 0,
  }),
  actions: {
    async getFriendListByReq() {
      try {
        let offset = 0;
        let tmpList: FriendUserItem[] = [];
        let initialFetch = true;
        while (true) {
          const count = initialFetch ? 10000 : 1000;
          const { data } = await IMSDK.getFriendListPage({
            offset,
            count,
            filterBlack: true,
          });
          tmpList = [...tmpList, ...data];
          offset += count;
          if (data.length < count) break;
          initialFetch = false;
        }
        this.friendList = [...tmpList];
      } catch (error) {
        console.error("getFriendListByReq", error);
      }
    },
    setFriendList(list: FriendUserItem[]) {
      this.friendList = list;
    },
    updateFriend(friend: FriendUserItem, remove?: boolean) {
      const tmpList = [...this.friendList];
      const idx = tmpList.findIndex((item) => item.userID === friend.userID);
      if (idx < 0) return;
      if (remove) {
        tmpList.splice(idx, 1);
      } else {
        tmpList[idx] = { ...friend };
      }
      this.friendList = tmpList;
    },
    pushNewFriend(friend: FriendUserItem) {
      this.friendList = [...this.friendList, friend];
    },
    async getBlackListByReq() {
      try {
        const { data } = await IMSDK.getBlackList();
        this.blackList = data;
      } catch (error) {
        console.error("getBlackListByReq", error);
      }
    },
    updateBlack(black: BlackUserItem, remove?: boolean) {
      const tmpList = [...this.blackList];
      const idx = tmpList.findIndex((item) => item.userID === black.userID);
      if (idx < 0) return;
      if (remove) {
        tmpList.splice(idx, 1);
      } else {
        tmpList[idx] = { ...black };
      }
      this.blackList = tmpList;
    },
    pushNewBlack(black: BlackUserItem) {
      const isFriend = this.friendList.find((friend) => friend.userID === black.userID);
      this.blackList = [...this.blackList, black];
      if (isFriend) {
        this.friendList = this.friendList.filter((friend) => friend.userID !== black.userID);
      }
    },
    async getGroupListByReq() {
      try {
        let offset = 0;
        let tmpList: GroupItem[] = [];
        while (true) {
          const { data } = await IMSDK.getJoinedGroupListPage({ offset, count: 1000 });
          tmpList = [...tmpList, ...data];
          offset += 1000;
          if (data.length < 1000) break;
        }
        this.groupList = tmpList;
      } catch (error) {
        console.error("getGroupListByReq", error);
      }
    },
    setGroupList(list: GroupItem[]) {
      this.groupList = list;
    },
    updateGroup(group: GroupItem, remove?: boolean) {
      const tmpList = [...this.groupList];
      const idx = tmpList.findIndex((item) => item.groupID === group.groupID);
      if (idx < 0) return;
      if (remove) {
        tmpList.splice(idx, 1);
      } else {
        tmpList[idx] = { ...group };
      }
      this.groupList = tmpList;
    },
    pushNewGroup(group: GroupItem) {
      this.groupList = [...this.groupList, group];
    },
    async getRecvFriendApplicationListByReq() {
      try {
        const { data } = await IMSDK.getFriendApplicationListAsRecipient();
        this.recvFriendApplicationList = data;
      } catch (error) {
        console.error("getRecvFriendApplicationListByReq", error);
      }
    },
    async updateRecvFriendApplication(application: FriendApplicationItem) {
      let tmpList = [...this.recvFriendApplicationList];
      let isHandleResultUpdate = false;
      const idx = tmpList.findIndex((item) => item.fromUserID === application.fromUserID);
      if (idx < 0) {
        tmpList = [...tmpList, application];
      } else {
        isHandleResultUpdate = true;
        tmpList[idx] = { ...application };
      }
      this.recvFriendApplicationList = tmpList;
      if (idx < 0 || isHandleResultUpdate) {
        this.unHandleFriendApplicationCount = tmpList.filter(
          (item) => item.handleResult === 0,
        ).length;
      }
    },
    async getSendFriendApplicationListByReq() {
      try {
        const { data } = await IMSDK.getFriendApplicationListAsApplicant();
        this.sendFriendApplicationList = data;
      } catch (error) {
        console.error("getSendFriendApplicationListByReq", error);
      }
    },
    updateSendFriendApplication(application: FriendApplicationItem) {
      let tmpList = [...this.sendFriendApplicationList];
      const idx = tmpList.findIndex((item) => item.toUserID === application.toUserID);
      if (idx < 0) {
        tmpList = [...tmpList, application];
      } else {
        tmpList[idx] = { ...application };
      }
      this.sendFriendApplicationList = tmpList;
    },
    async getRecvGroupApplicationListByReq() {
      try {
        const { data } = await IMSDK.getGroupApplicationListAsRecipient();
        this.recvGroupApplicationList = data;
      } catch (error) {
        console.error("getRecvGroupApplicationListByReq", error);
      }
    },
    async updateRecvGroupApplication(application: GroupApplicationItem) {
      let tmpList = [...this.recvGroupApplicationList];
      const idx = tmpList.findIndex((item) => item.userID === application.userID);
      if (idx < 0) {
        tmpList = [...tmpList, application];
      } else {
        tmpList[idx] = { ...application };
      }
      this.recvGroupApplicationList = tmpList;
      if (idx < 0 || application.handleResult === ApplicationHandleResult.Unprocessed) {
        this.unHandleGroupApplicationCount = tmpList.filter(
          (item) => item.handleResult === 0,
        ).length;
      }
    },
    async getSendGroupApplicationListByReq() {
      try {
        const { data } = await IMSDK.getGroupApplicationListAsApplicant();
        this.sendGroupApplicationList = data;
      } catch (error) {
        console.error("getSendGroupApplicationListByReq", error);
      }
    },
    updateSendGroupApplication(application: GroupApplicationItem) {
      let tmpList = [...this.sendGroupApplicationList];
      const idx = tmpList.findIndex((item) => item.groupID === application.groupID);
      if (idx < 0) {
        tmpList = [...tmpList, application];
      } else {
        tmpList[idx] = { ...application };
      }
      this.sendGroupApplicationList = tmpList;
    },
    updateUnHandleFriendApplicationCount(num: number) {
      this.unHandleFriendApplicationCount = num;
    },
    updateUnHandleGroupApplicationCount(num: number) {
      this.unHandleGroupApplicationCount = num;
    },
    clearContactStore() {
      this.friendList = [];
      this.blackList = [];
      this.groupList = [];
      this.recvFriendApplicationList = [];
      this.sendFriendApplicationList = [];
      this.recvGroupApplicationList = [];
      this.sendGroupApplicationList = [];
      this.unHandleFriendApplicationCount = 0;
      this.unHandleGroupApplicationCount = 0;
    },
  },
});
