import {
  CbEvents,
  LoginStatus,
  LogLevel,
  MessageType,
  SessionType,
  type BlackUserItem,
  type ConversationItem,
  type FriendApplicationItem,
  type FriendUserItem,
  type GroupApplicationItem,
  type GroupItem,
  type GroupMemberItem,
  type MessageItem,
  type RevokedInfo,
  type SelfUserInfo,
  type WSEvent,
  type WsResponse,
} from "@openim/wasm-client-sdk";
import { message as antMessage } from "ant-design-vue";

import { CustomType } from "@/constants/im";
import router from "@/routes";
import { useContactStore } from "@/stores/contact";
import { useConversationStore } from "@/stores/conversation";
import { useUserStore } from "@/stores/user";
import { emit } from "@/utils/events";
import { initStore } from "@/utils/imCommon";

import { IMSDK } from "./sdk";

let registered = false;
let resume = false;
let loginPromise: Promise<void> | undefined;

const isSelfID = (userID?: string) => userID === useUserStore().selfInfo.userID;

const selfUpdateHandler = ({ data }: WSEvent<SelfUserInfo>) => {
  useUserStore().updateSelfInfo(data);
};

const connectingHandler = () => {
  useUserStore().updateConnectState("loading");
  console.log("connecting...");
};

const connectFailedHandler = ({ errCode, errMsg }: WSEvent) => {
  useUserStore().updateConnectState("failed");
  console.error("connectFailedHandler", errCode, errMsg);
  if (errCode === 705) {
    tryOut("登录已过期");
  }
};

const connectSuccessHandler = () => {
  useUserStore().updateConnectState("success");
  console.log("connect success...");
};

const kickHandler = () => tryOut("账号在其他设备登录");

const expiredHandler = () => tryOut("登录已过期");

const tryOut = (msg: string) => {
  antMessage.error(msg);
  useUserStore().userLogout(true);
};

const syncStartHandler = ({ data }: WSEvent<boolean>) => {
  const userStore = useUserStore();
  userStore.updateSyncState("loading");
  userStore.updateReinstallState(data);
};

const syncProgressHandler = ({ data }: WSEvent<number>) => {
  useUserStore().updateProgressState(data);
};

const syncFinishHandler = () => {
  const userStore = useUserStore();
  const contactStore = useContactStore();
  const conversationStore = useConversationStore();

  userStore.updateSyncState("success");
  contactStore.getFriendListByReq();
  contactStore.getGroupListByReq();
  conversationStore.getConversationListByReq(false);
  conversationStore.getUnReadCountByReq();
};

const syncFailedHandler = () => {
  useUserStore().updateSyncState("failed");
  antMessage.error("同步失败");
};

const newMessageHandler = ({ data }: WSEvent<MessageItem[]>) => {
  if (useUserStore().syncState === "loading" || resume) {
    return;
  }
  data.forEach((message) => handleNewMessage(message));
};

const revokedMessageHandler = ({ data }: WSEvent<RevokedInfo>) => {
  const message = {
    clientMsgID: data.clientMsgID,
    contentType: MessageType.RevokeMessage,
    notificationElem: {
      detail: JSON.stringify(data),
    },
  } as MessageItem;
  useConversationStore().updateOneMessage(message);
  emit("UPDATE_ONE_MSG", message);
};

const notPushType = [MessageType.TypingMessage, MessageType.RevokeMessage];

const handleNewMessage = (newServerMsg: MessageItem) => {
  if (newServerMsg.contentType === MessageType.CustomMessage) {
    const customData = JSON.parse(newServerMsg.customElem!.data);
    if (
      CustomType.CallingInvite <= customData.customType &&
      customData.customType <= CustomType.CallingHungup
    ) {
      return;
    }
  }

  if (!inCurrentConversation(newServerMsg)) return;

  if (!notPushType.includes(newServerMsg.contentType)) {
    useConversationStore().pushNewMessage(newServerMsg);
    emit("PUSH_NEW_MSG", newServerMsg);
  }
};

const inCurrentConversation = (newServerMsg: MessageItem) => {
  const conversationStore = useConversationStore();
  switch (newServerMsg.sessionType) {
    case SessionType.Single:
      return (
        newServerMsg.sendID === conversationStore.currentConversation?.userID ||
        (isSelfID(newServerMsg.sendID) &&
          newServerMsg.recvID === conversationStore.currentConversation?.userID)
      );
    case SessionType.Group:
    case SessionType.WorkingGroup:
      return newServerMsg.groupID === conversationStore.currentConversation?.groupID;
    case SessionType.Notification:
      return newServerMsg.sendID === conversationStore.currentConversation?.userID;
    default:
      return false;
  }
};

const conversationChangeHandler = ({ data }: WSEvent<ConversationItem[]>) => {
  useConversationStore().updateConversationList(data, "filter");
};

const newConversationHandler = ({ data }: WSEvent<ConversationItem[]>) => {
  useConversationStore().updateConversationList(data, "push");
};

const totalUnreadChangeHandler = ({ data }: WSEvent<number>) => {
  const conversationStore = useConversationStore();
  if (data === conversationStore.unReadCount) return;
  conversationStore.updateUnReadCount(data);
};

const friendInfoChangeHandler = ({ data }: WSEvent<FriendUserItem>) => {
  useContactStore().updateFriend(data);
};

const friendAddedHandler = ({ data }: WSEvent<FriendUserItem>) => {
  useContactStore().pushNewFriend(data);
};

const friendDeletedHandler = ({ data }: WSEvent<FriendUserItem>) => {
  useContactStore().updateFriend(data, true);
};

const blackAddedHandler = ({ data }: WSEvent<BlackUserItem>) => {
  useContactStore().pushNewBlack(data);
};

const blackDeletedHandler = ({ data }: WSEvent<BlackUserItem>) => {
  IMSDK.getSpecifiedFriendsInfo({
    friendUserIDList: [data.userID],
  }).then(({ data }) => {
    if (data.length) {
      useContactStore().pushNewFriend(data[0]);
    }
  });
  useContactStore().updateBlack(data, true);
};

const joinedGroupAddedHandler = ({ data }: WSEvent<GroupItem>) => {
  const conversationStore = useConversationStore();
  if (data.groupID === conversationStore.currentConversation?.groupID) {
    conversationStore.updateCurrentGroupInfo(data);
    conversationStore.getCurrentMemberInGroupByReq(data.groupID);
  }
  useContactStore().pushNewGroup(data);
};

const joinedGroupDeletedHandler = ({ data }: WSEvent<GroupItem>) => {
  const conversationStore = useConversationStore();
  if (data.groupID === conversationStore.currentConversation?.groupID) {
    conversationStore.getCurrentGroupInfoByReq(data.groupID);
    conversationStore.setCurrentMemberInGroup();
  }
  useContactStore().updateGroup(data, true);
};

const joinedGroupDismissHandler = ({ data }: WSEvent<GroupItem>) => {
  const conversationStore = useConversationStore();
  if (data.groupID === conversationStore.currentConversation?.groupID) {
    conversationStore.getCurrentMemberInGroupByReq(data.groupID);
  }
};

const groupInfoChangedHandler = ({ data }: WSEvent<GroupItem>) => {
  const conversationStore = useConversationStore();
  useContactStore().updateGroup(data);
  if (data.groupID === conversationStore.currentConversation?.groupID) {
    conversationStore.updateCurrentGroupInfo(data);
  }
};

const groupMemberAddedHandler = ({ data }: WSEvent<GroupMemberItem>) => {
  const conversationStore = useConversationStore();
  if (data.groupID === conversationStore.currentConversation?.groupID && isSelfID(data.userID)) {
    conversationStore.getCurrentMemberInGroupByReq(data.groupID);
  }
};

const groupMemberDeletedHandler = ({ data }: WSEvent<GroupMemberItem>) => {
  const conversationStore = useConversationStore();
  if (data.groupID === conversationStore.currentConversation?.groupID && isSelfID(data.userID)) {
    conversationStore.getCurrentMemberInGroupByReq(data.groupID);
  }
};

const groupMemberInfoChangedHandler = ({ data }: WSEvent<GroupMemberItem>) => {
  const conversationStore = useConversationStore();
  if (data.groupID === conversationStore.currentConversation?.groupID) {
    conversationStore.tryUpdateCurrentMemberInGroup(data);
  }
};

const friendApplicationProcessedHandler = ({ data }: WSEvent<FriendApplicationItem>) => {
  const isRecv = data.toUserID === useUserStore().selfInfo.userID;
  if (isRecv) {
    useContactStore().updateRecvFriendApplication(data);
  } else {
    useContactStore().updateSendFriendApplication(data);
  }
};

const groupApplicationProcessedHandler = ({ data }: WSEvent<GroupApplicationItem>) => {
  const isRecv = data.userID !== useUserStore().selfInfo.userID;
  if (isRecv) {
    useContactStore().updateRecvGroupApplication(data);
  } else {
    useContactStore().updateSendGroupApplication(data);
  }
};

const groupMemberAddedHandlerForEmitter =
  groupMemberAddedHandler as unknown as (data: WSEvent<never>) => void;
const friendApplicationAcceptedHandler =
  friendApplicationProcessedHandler as unknown as (data: WSEvent<never>) => void;

export const registerGlobalEvents = () => {
  if (registered) return;
  registered = true;

  IMSDK.on(CbEvents.OnSelfInfoUpdated, selfUpdateHandler);
  IMSDK.on(CbEvents.OnConnecting, connectingHandler);
  IMSDK.on(CbEvents.OnConnectFailed, connectFailedHandler);
  IMSDK.on(CbEvents.OnConnectSuccess, connectSuccessHandler);
  IMSDK.on(CbEvents.OnKickedOffline, kickHandler);
  IMSDK.on(CbEvents.OnUserTokenExpired, expiredHandler);
  IMSDK.on(CbEvents.OnUserTokenInvalid, expiredHandler);
  IMSDK.on(CbEvents.OnSyncServerStart, syncStartHandler);
  IMSDK.on(CbEvents.OnSyncServerProgress, syncProgressHandler);
  IMSDK.on(CbEvents.OnSyncServerFinish, syncFinishHandler);
  IMSDK.on(CbEvents.OnSyncServerFailed, syncFailedHandler);
  IMSDK.on(CbEvents.OnRecvNewMessages, newMessageHandler);
  IMSDK.on(CbEvents.OnNewRecvMessageRevoked, revokedMessageHandler);
  IMSDK.on(CbEvents.OnConversationChanged, conversationChangeHandler);
  IMSDK.on(CbEvents.OnNewConversation, newConversationHandler);
  IMSDK.on(CbEvents.OnTotalUnreadMessageCountChanged, totalUnreadChangeHandler);
  IMSDK.on(CbEvents.OnFriendInfoChanged, friendInfoChangeHandler);
  IMSDK.on(CbEvents.OnFriendAdded, friendAddedHandler);
  IMSDK.on(CbEvents.OnFriendDeleted, friendDeletedHandler);
  IMSDK.on(CbEvents.OnBlackAdded, blackAddedHandler);
  IMSDK.on(CbEvents.OnBlackDeleted, blackDeletedHandler);
  IMSDK.on(CbEvents.OnJoinedGroupAdded, joinedGroupAddedHandler);
  IMSDK.on(CbEvents.OnJoinedGroupDeleted, joinedGroupDeletedHandler);
  IMSDK.on(CbEvents.OnGroupDismissed, joinedGroupDismissHandler);
  IMSDK.on(CbEvents.OnGroupInfoChanged, groupInfoChangedHandler);
  IMSDK.on(CbEvents.OnGroupMemberAdded, groupMemberAddedHandlerForEmitter);
  IMSDK.on(CbEvents.OnGroupMemberDeleted, groupMemberDeletedHandler);
  IMSDK.on(CbEvents.OnGroupMemberInfoChanged, groupMemberInfoChangedHandler);
  IMSDK.on(CbEvents.OnFriendApplicationAdded, friendApplicationProcessedHandler);
  IMSDK.on(CbEvents.OnFriendApplicationAccepted, friendApplicationAcceptedHandler);
  IMSDK.on(CbEvents.OnFriendApplicationRejected, friendApplicationProcessedHandler);
  IMSDK.on(CbEvents.OnGroupApplicationAdded, groupApplicationProcessedHandler);
  IMSDK.on(CbEvents.OnGroupApplicationAccepted, groupApplicationProcessedHandler);
  IMSDK.on(CbEvents.OnGroupApplicationRejected, groupApplicationProcessedHandler);

  window.addEventListener("online", networkStatusChangedHandler);
  window.addEventListener("offline", networkStatusChangedHandler);
};

export const disposeGlobalEvents = () => {
  if (!registered) return;
  registered = false;

  IMSDK.off(CbEvents.OnSelfInfoUpdated, selfUpdateHandler);
  IMSDK.off(CbEvents.OnConnecting, connectingHandler);
  IMSDK.off(CbEvents.OnConnectFailed, connectFailedHandler);
  IMSDK.off(CbEvents.OnConnectSuccess, connectSuccessHandler);
  IMSDK.off(CbEvents.OnKickedOffline, kickHandler);
  IMSDK.off(CbEvents.OnUserTokenExpired, expiredHandler);
  IMSDK.off(CbEvents.OnUserTokenInvalid, expiredHandler);
  IMSDK.off(CbEvents.OnSyncServerStart, syncStartHandler);
  IMSDK.off(CbEvents.OnSyncServerProgress, syncProgressHandler);
  IMSDK.off(CbEvents.OnSyncServerFinish, syncFinishHandler);
  IMSDK.off(CbEvents.OnSyncServerFailed, syncFailedHandler);
  IMSDK.off(CbEvents.OnRecvNewMessages, newMessageHandler);
  IMSDK.off(CbEvents.OnNewRecvMessageRevoked, revokedMessageHandler);
  IMSDK.off(CbEvents.OnConversationChanged, conversationChangeHandler);
  IMSDK.off(CbEvents.OnNewConversation, newConversationHandler);
  IMSDK.off(CbEvents.OnTotalUnreadMessageCountChanged, totalUnreadChangeHandler);
  IMSDK.off(CbEvents.OnFriendInfoChanged, friendInfoChangeHandler);
  IMSDK.off(CbEvents.OnFriendAdded, friendAddedHandler);
  IMSDK.off(CbEvents.OnFriendDeleted, friendDeletedHandler);
  IMSDK.off(CbEvents.OnBlackAdded, blackAddedHandler);
  IMSDK.off(CbEvents.OnBlackDeleted, blackDeletedHandler);
  IMSDK.off(CbEvents.OnJoinedGroupAdded, joinedGroupAddedHandler);
  IMSDK.off(CbEvents.OnJoinedGroupDeleted, joinedGroupDeletedHandler);
  IMSDK.off(CbEvents.OnGroupDismissed, joinedGroupDismissHandler);
  IMSDK.off(CbEvents.OnGroupInfoChanged, groupInfoChangedHandler);
  IMSDK.off(CbEvents.OnGroupMemberAdded, groupMemberAddedHandlerForEmitter);
  IMSDK.off(CbEvents.OnGroupMemberDeleted, groupMemberDeletedHandler);
  IMSDK.off(CbEvents.OnGroupMemberInfoChanged, groupMemberInfoChangedHandler);
  IMSDK.off(CbEvents.OnFriendApplicationAdded, friendApplicationProcessedHandler);
  IMSDK.off(CbEvents.OnFriendApplicationAccepted, friendApplicationAcceptedHandler);
  IMSDK.off(CbEvents.OnFriendApplicationRejected, friendApplicationProcessedHandler);
  IMSDK.off(CbEvents.OnGroupApplicationAdded, groupApplicationProcessedHandler);
  IMSDK.off(CbEvents.OnGroupApplicationAccepted, groupApplicationProcessedHandler);
  IMSDK.off(CbEvents.OnGroupApplicationRejected, groupApplicationProcessedHandler);

  window.removeEventListener("online", networkStatusChangedHandler);
  window.removeEventListener("offline", networkStatusChangedHandler);
};

export const tryLoginIM = async () => {
  if (loginPromise) return loginPromise;

  loginPromise = doTryLoginIM().finally(() => {
    loginPromise = undefined;
  });
  return loginPromise;
};

const doTryLoginIM = async () => {
  const userStore = useUserStore();
  userStore.updateIsLogining(true);
  try {
    const status = await IMSDK.getLoginStatus().catch(() => undefined);
    if (status?.data === LoginStatus.Logged) {
      await IMSDK.logout();
    }
    await IMSDK.login({
      userID: userStore.userID,
      token: userStore.imToken,
      platformID: 5,
      apiAddr: import.meta.env.VITE_API_URL,
      wsAddr: import.meta.env.VITE_WS_URL,
      logLevel: LogLevel.Debug,
    });
    initStore();
  } catch (error) {
    console.error(error);
    if ((error as WsResponse).errCode !== 10102) {
      router.push("/login");
    }
  } finally {
    userStore.updateIsLogining(false);
  }
};

const networkStatusChangedHandler = () => {
  IMSDK.networkStatusChanged();
};

export const setResumeFlag = () => {
  if (resume) return;
  resume = true;
  window.setTimeout(() => {
    resume = false;
  }, 5000);
};
