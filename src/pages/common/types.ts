import type {
  ConversationItem,
  FriendUserItem,
  GroupItem,
  GroupMemberItem,
  PublicUserItem,
  RtcInvite,
} from "@openim/wasm-client-sdk";

import type { BusinessUserInfo } from "@/api/login";

export type CardInfo = Partial<BusinessUserInfo & FriendUserItem>;

export type OpenUserCardParams = {
  userID?: string;
  groupID?: string;
  isSelf?: boolean;
  notAdd?: boolean;
  cardInfo?: CardInfo;
};

export type ChooseModalType =
  | "CRATE_GROUP"
  | "INVITE_TO_GROUP"
  | "KICK_FORM_GROUP"
  | "TRANSFER_IN_GROUP"
  | "SELECT_USER";

export type CheckListItem = Partial<
  FriendUserItem &
    ConversationItem &
    GroupItem &
    GroupMemberItem & {
      disabled?: boolean;
    }
>;

export type ChooseModalState = {
  type: ChooseModalType;
  extraData?: unknown;
};

export type SelectUserParams = {
  notConversation: boolean;
  choosedList: CheckListItem[];
};

export interface ParticipantInfo {
  userInfo: PublicUserItem;
  groupMemberInfo?: GroupMemberItem;
  groupInfo?: GroupItem;
}

export interface InviteData {
  invitation?: RtcInvite;
  participant?: ParticipantInfo;
  isJoin?: boolean;
}
