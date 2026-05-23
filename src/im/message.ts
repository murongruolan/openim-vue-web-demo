import {
  MessageStatus,
  type CustomMsgParams,
  type MessageItem,
  type SendMsgParams,
} from "@openim/wasm-client-sdk";
import { v4 as uuidV4 } from "uuid";

import { useConversationStore } from "@/stores/conversation";
import { emit } from "@/utils/events";

import { IMSDK } from "./sdk";

export type SendMessageParams = Partial<Omit<SendMsgParams, "message">> & {
  message: MessageItem;
  needPush?: boolean;
};

// Source: src/pages/chat/queryChat/ChatFooter/useSendMessage.ts
// Contract: docs/web-sdk-interface.md#6.4-发送消息
export const sendMessage = async ({
  recvID,
  groupID,
  message,
  needPush,
}: SendMessageParams) => {
  const conversationStore = useConversationStore();
  const currentConversation = conversationStore.currentConversation;
  const sourceID = recvID || groupID;
  const inCurrentConversation =
    currentConversation?.userID === sourceID ||
    currentConversation?.groupID === sourceID ||
    !sourceID;
  const shouldPush = needPush ?? inCurrentConversation;

  if (shouldPush) {
    emit("PUSH_NEW_MSG", message);
    emit("CHAT_LIST_SCROLL_TO_BOTTOM");
  }

  const options = {
    recvID: recvID ?? currentConversation?.userID ?? "",
    groupID: groupID ?? currentConversation?.groupID ?? "",
    message,
  };

  try {
    const { data: successMessage } = await IMSDK.sendMessage(options);
    emit("UPDATE_ONE_MSG", successMessage);
    return successMessage;
  } catch (error) {
    emit("UPDATE_ONE_MSG", {
      ...message,
      status: MessageStatus.Failed,
    } as MessageItem);
    return undefined;
  }
};

export interface FileWithPath extends File {
  path?: string;
}

const getPicInfo = (file: File): Promise<HTMLImageElement> =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = function () {
      resolve(img);
    };
    img.src = URL.createObjectURL(file);
  });

// Source: src/pages/chat/queryChat/ChatFooter/SendActionBar/useFileMessage.ts
// Contract: docs/web-sdk-interface.md#6.2-创建图片消息
export const getImageMessage = async (file: FileWithPath) => {
  const { width, height } = await getPicInfo(file);
  const baseInfo = {
    uuid: uuidV4(),
    type: file.type,
    size: file.size,
    width,
    height,
    url: URL.createObjectURL(file),
  };

  const { data } = await IMSDK.createImageMessageByFile({
    sourcePicture: baseInfo,
    bigPicture: baseInfo,
    snapshotPicture: baseInfo,
    sourcePath: "",
    file,
  });
  return data;
};

// Source: src/pages/common/RtcCallModal/index.tsx
// Contract: docs/web-sdk-interface.md#6.3-创建自定义消息
export const getCustomMessage = async (params: CustomMsgParams) => {
  const { data } = await IMSDK.createCustomMessage(params);
  return data;
};
