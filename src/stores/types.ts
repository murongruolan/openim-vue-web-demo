import type {
  BlackUserItem,
  ConversationItem,
  FriendApplicationItem,
  FriendUserItem,
  GroupApplicationItem,
  GroupItem,
  GroupMemberItem,
  MessageItem,
} from "@openim/wasm-client-sdk";

import type { BusinessUserInfo } from "@/api/login";

export type IMConnectState = "success" | "loading" | "failed";

export type ConversationListUpdateType = "push" | "filter";

export type AppSettings = {
  locale: string;
  closeAction: "miniSize" | "quit";
};

export type UserStoreState = {
  userID: string;
  imToken: string;
  chatToken: string;
  syncState: IMConnectState;
  progress: number;
  reinstall: boolean;
  isLogining: boolean;
  connectState: IMConnectState;
  selfInfo: Partial<BusinessUserInfo>;
  appSettings: AppSettings;
};

export type ConversationStoreState = {
  conversationList: ConversationItem[];
  currentConversation?: ConversationItem;
  unReadCount: number;
  currentGroupInfo?: GroupItem;
  currentMemberInGroup?: GroupMemberItem;
  newMessageList: MessageItem[];
};

export type ContactStoreState = {
  friendList: FriendUserItem[];
  blackList: BlackUserItem[];
  groupList: GroupItem[];
  recvFriendApplicationList: FriendApplicationItem[];
  sendFriendApplicationList: FriendApplicationItem[];
  recvGroupApplicationList: GroupApplicationItem[];
  sendGroupApplicationList: GroupApplicationItem[];
  unHandleFriendApplicationCount: number;
  unHandleGroupApplicationCount: number;
};
