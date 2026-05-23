import type { ConversationItem, SessionType } from "@openim/wasm-client-sdk";

import router from "@/routes";
import { useConversationStore } from "@/stores/conversation";

import { IMSDK } from "./sdk";

export type ToSpecifiedConversationParams = {
  sourceID: string;
  sessionType: SessionType;
  isJump?: boolean;
  isChildWindow?: boolean;
};

// Source: src/hooks/useConversationToggle.ts
export const toSpecifiedConversation = async ({
  sourceID,
  sessionType,
}: ToSpecifiedConversationParams) => {
  const conversationStore = useConversationStore();
  let conversation: ConversationItem | undefined = conversationStore.conversationList.find(
    (item) => item.userID === sourceID || item.groupID === sourceID,
  );

  if (!conversation) {
    try {
      conversation = (
        await IMSDK.getOneConversation({
          sourceID,
          sessionType,
        })
      ).data;
    } catch (error) {
      console.error("getOneConversation", error);
    }
  }

  if (
    !conversation ||
    conversationStore.currentConversation?.conversationID === conversation.conversationID
  ) {
    return;
  }

  await conversationStore.updateCurrentConversation({ ...conversation });
  router.push(`/chat/${conversation.conversationID}`);
};
