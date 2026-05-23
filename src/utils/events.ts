import type {
  ChooseModalState,
  InviteData,
  OpenUserCardParams,
  SelectUserParams,
} from "@/pages/common/types";

type Handler<T = unknown> = (payload: T) => void;

export type EmitterPayloadMap = {
  OPEN_USER_CARD: OpenUserCardParams;
  OPEN_GROUP_CARD: unknown;
  OPEN_CHOOSE_MODAL: ChooseModalState;
  OPEN_RTC_MODAL: InviteData;
  CHAT_LIST_SCROLL_TO_BOTTOM: void;
  PUSH_NEW_MSG: unknown;
  UPDATE_ONE_MSG: unknown;
  SELECT_USER: SelectUserParams;
};

const eventMap = new Map<string, Set<Handler>>();

export const on = <T = unknown>(event: string, handler: Handler<T>) => {
  const handlers = eventMap.get(event) ?? new Set<Handler>();
  handlers.add(handler as Handler);
  eventMap.set(event, handlers);
};

export const off = <T = unknown>(event: string, handler: Handler<T>) => {
  eventMap.get(event)?.delete(handler as Handler);
};

export const emit = <T = unknown>(event: string, payload?: T) => {
  eventMap.get(event)?.forEach((handler) => handler(payload));
};

export default { on, off, emit };
