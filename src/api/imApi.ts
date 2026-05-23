import { v4 as uuidv4 } from "uuid";

import { createRequest } from "@/api/request";
import { getChatToken } from "@/utils/storage";

const request = createRequest(import.meta.env.VITE_CHAT_URL as string);

// Source: src/api/imApi.ts#getRtcConnectData
// Contract: docs/web-api-interface.md#4.1-获取-rtc-livekit-token
export const getRtcConnectData = async (room: string, identity: string) =>
  request.post<unknown, { data: { serverUrl: string; token: string } }>(
    "/user/rtc/get_token",
    {
      room,
      identity,
    },
    {
      headers: {
        token: await getChatToken(),
        operationID: uuidv4(),
      },
    },
  );
