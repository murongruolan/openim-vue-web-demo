import type {
  ConversationItem,
  MessageItem,
  UploadFileParams,
} from "@openim/wasm-client-sdk";
import { MessageType, SessionType } from "@openim/wasm-client-sdk";
import dayjs from "dayjs";
import "dayjs/locale/zh-cn";
import calendar from "dayjs/plugin/calendar";
import relativeTime from "dayjs/plugin/relativeTime";
import updateLocale from "dayjs/plugin/updateLocale";
import { v4 as uuidV4 } from "uuid";

import { GroupSessionTypes } from "@/constants/im";
import { SystemMessageTypes } from "@/constants/im";
import { IMSDK } from "@/im/sdk";
import { ts as t } from "@/i18n";
import { useContactStore } from "@/stores/contact";
import { useConversationStore } from "@/stores/conversation";
import { useUserStore } from "@/stores/user";

dayjs.extend(calendar);
dayjs.extend(relativeTime);
dayjs.extend(updateLocale);
dayjs.locale("zh-cn");

dayjs.updateLocale("en", {
  calendar: {
    sameDay: "HH:mm",
    nextDay: "[tomorrow]",
    nextWeek: "dddd",
    lastDay: "[yesterday] HH:mm",
    lastWeek: "dddd HH:mm",
    sameElse: "YYYY/M/D HH:mm",
  },
});

dayjs.updateLocale("zh-cn", {
  calendar: {
    sameDay: "HH:mm",
    nextDay: "[明天]",
    nextWeek: "dddd",
    lastDay: "[昨天] HH:mm",
    lastWeek: "dddd HH:mm",
    sameElse: "YYYY年M月D日 HH:mm",
  },
});

// Source: src/utils/imCommon.ts#initStore
export const initStore = () => {
  calcApplicationBadge();

  const userStore = useUserStore();
  const contactStore = useContactStore();
  const conversationStore = useConversationStore();

  conversationStore.getUnReadCountByReq();
  conversationStore.getConversationListByReq();
  userStore.getSelfInfoByReq();
  contactStore.getBlackListByReq();
  contactStore.getRecvFriendApplicationListByReq();
  contactStore.getRecvGroupApplicationListByReq();
  contactStore.getSendFriendApplicationListByReq();
  contactStore.getSendGroupApplicationListByReq();
  conversationStore.getUnReadCountByReq();
};

export const conversationSort = (
  conversationList: ConversationItem[],
  originalList?: ConversationItem[],
) => {
  const listWithIndex = conversationList.map((item, index) => ({
    ...item,
    originalIndex:
      originalList?.findIndex((c) => c.conversationID === item.conversationID) ?? index,
  }));

  const ids: string[] = [];
  const filterArr = listWithIndex.filter((conversation) => {
    if (!ids.includes(conversation.conversationID)) {
      ids.push(conversation.conversationID);
      return true;
    }
    return false;
  });

  filterArr.sort((a, b) => {
    if (a.isPinned === b.isPinned) {
      const aCompare =
        a.draftTextTime > a.latestMsgSendTime ? a.draftTextTime : a.latestMsgSendTime;
      const bCompare =
        b.draftTextTime > b.latestMsgSendTime ? b.draftTextTime : b.latestMsgSendTime;
      if (aCompare > bCompare) return -1;
      if (aCompare < bCompare) return 1;
      if (!originalList) return 0;
      return a.originalIndex - b.originalIndex;
    }
    return a.isPinned ? -1 : 1;
  });

  return filterArr.map(({ originalIndex, ...rest }) => rest);
};

export const isGroupSession = (sessionType?: SessionType) =>
  sessionType ? GroupSessionTypes.includes(sessionType) : false;

export const formatConversionTime = (timestamp: number): string => {
  if (!timestamp) return "";

  const fromNowStr = dayjs(timestamp).fromNow();

  if (fromNowStr.includes(t("date.second"))) {
    return t("date.justNow");
  }

  if (
    !fromNowStr.includes(t("date.second")) &&
    !fromNowStr.includes(t("date.minute"))
  ) {
    return dayjs(timestamp).calendar();
  }

  return fromNowStr;
};

export const parseBr = (text: string) =>
  text.replace(new RegExp("\\n", "g"), "<br>").replace(new RegExp("\n", "g"), "<br>");

export const formatMessageTime = (timestamp: number, keepSameYear = false): string => {
  if (!timestamp) return "";

  const isRecent = dayjs().diff(timestamp, "day") < 7;
  const keepYear = keepSameYear || dayjs(timestamp).year() !== dayjs().year();

  if (!isRecent && !keepYear) {
    return dayjs(timestamp).format("M/D HH:mm");
  }

  return dayjs(timestamp).calendar();
};

export const formatMessageByType = (message?: MessageItem): string => {
  if (!message) return "";
  const selfUserID = useUserStore().selfInfo.userID;
  const getName = (user: { userID: string; nickname?: string }) =>
    user.userID === selfUserID ? t("you") : user.nickname ?? "";

  try {
    switch (message.contentType) {
      case MessageType.TextMessage:
        return parseBr(message.textElem?.content ?? "");
      case MessageType.PictureMessage:
        return t("messageDescription.imageMessage");
      case MessageType.VoiceMessage:
        return t("messageDescription.voiceMessage");
      case MessageType.VideoMessage:
        return t("messageDescription.videoMessage");
      case MessageType.FileMessage:
        return t("messageDescription.fileMessage", {
          file: message.fileElem?.fileName ?? "",
        });
      case MessageType.CardMessage:
        return t("messageDescription.cardMessage");
      case MessageType.FaceMessage:
        return t("messageDescription.faceMessage");
      case MessageType.FriendAdded:
        return t("messageDescription.alreadyFriendMessage");
      case MessageType.GroupCreated: {
        const detail = JSON.parse(message.notificationElem!.detail);
        return t("messageDescription.createGroupMessage", {
          creator: getName(detail.opUser),
        });
      }
      case MessageType.GroupInfoUpdated: {
        const detail = JSON.parse(message.notificationElem!.detail);
        return t("messageDescription.updateGroupInfoMessage", {
          operator: getName(detail.opUser),
        });
      }
      case MessageType.MemberEnter: {
        const detail = JSON.parse(message.notificationElem!.detail);
        return t("messageDescription.joinGroupMessage", {
          name: getName(detail.entrantUser),
        });
      }
      case MessageType.MemberInvited: {
        const detail = JSON.parse(message.notificationElem!.detail);
        const invited = (detail.invitedUserList ?? [])
          .slice(0, 3)
          .map((user: { userID: string; nickname?: string }) => getName(user))
          .join("、");
        return t("messageDescription.invitedToGroupMessage", {
          operator: getName(detail.opUser),
          invitedUser:
            invited + ((detail.invitedUserList?.length ?? 0) > 3 ? "..." : ""),
        });
      }
      case MessageType.MemberKicked: {
        const detail = JSON.parse(message.notificationElem!.detail);
        const kicked = (detail.kickedUserList ?? [])
          .slice(0, 3)
          .map((user: { userID: string; nickname?: string }) => getName(user))
          .join("、");
        return t("messageDescription.kickInGroupMessage", {
          operator: getName(detail.opUser),
          kickedUser: kicked + ((detail.kickedUserList?.length ?? 0) > 3 ? "..." : ""),
        });
      }
      case MessageType.MemberQuit: {
        const detail = JSON.parse(message.notificationElem!.detail);
        return t("messageDescription.quitGroupMessage", {
          name: getName(detail.quitUser),
        });
      }
      case MessageType.GroupDismissed: {
        const detail = JSON.parse(message.notificationElem!.detail);
        return t("messageDescription.disbanedGroupMessage", {
          operator: getName(detail.opUser),
        });
      }
      default:
        return t("messageDescription.catchMessage");
    }
  } catch (error) {
    return t("messageDescription.catchMessage");
  }
};

export const getConversationContent = (message: MessageItem) => {
  if (
    !message.groupID ||
    SystemMessageTypes.includes(message.contentType) ||
    message.sendID === useUserStore().selfInfo.userID
  ) {
    return formatMessageByType(message);
  }
  return `${message.senderNickname}：${formatMessageByType(message)}`;
};

export const notificationMessageFormat = (message: MessageItem) => {
  return formatMessageByType(message);
};

export const calcApplicationBadge = () => {
  const contactStore = useContactStore();
  const unHandleFriendApplicationNum = contactStore.recvFriendApplicationList.filter(
    (application) => application.handleResult === 0,
  ).length;
  const unHandleGroupApplicationNum = contactStore.recvGroupApplicationList.filter(
    (application) => application.handleResult === 0,
  ).length;

  contactStore.updateUnHandleFriendApplicationCount(unHandleFriendApplicationNum);
  contactStore.updateUnHandleGroupApplicationCount(unHandleGroupApplicationNum);
};

export const getConversationIDByMsg = (message: MessageItem) => {
  if (message.sessionType === SessionType.Single) {
    const ids = [message.sendID, message.recvID].sort();
    return `si_${ids[0]}_${ids[1]}`;
  }
  if (message.sessionType === SessionType.Group) {
    return `sg_${message.groupID}`;
  }
  if (message.sessionType === SessionType.Notification) {
    return `sn_${message.sendID}_${message.recvID}`;
  }
  return "";
};

// Source: src/utils/imCommon.ts#uploadFile
// Web-only migration: old Electron filepath branch is intentionally excluded.
export const uploadFile = async (file: File) => {
  const params: UploadFileParams = {
    name: file.name,
    contentType: file.type,
    uuid: uuidV4(),
    cause: "",
    file,
  };
  return IMSDK.uploadFile(params);
};
