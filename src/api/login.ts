import md5 from "md5";
import { v4 as uuidv4 } from "uuid";

import { createRequest } from "@/api/request";
import { useUserStore } from "@/stores/user";
import { getChatToken } from "@/utils/storage";

const request = createRequest(import.meta.env.VITE_CHAT_URL as string);

const platform = 5;

const getAreaCode = (code?: string) =>
  code ? (code.includes("+") ? code : `+${code}`) : code;

// Source: src/api/login.ts
// Contract: docs/web-api-interface.md#2.1-发送验证码
export const sendSms = (params: API.Login.SendSmsParams) =>
  request.post("/account/code/send", { ...params }, { headers: { operationID: uuidv4() } });

// Source: src/api/login.ts
// Contract: docs/web-api-interface.md#2.2-校验验证码
export const verifyCode = (params: API.Login.VerifyCodeParams) =>
  request.post(
    "/account/code/verify",
    {
      ...params,
      ...(params.areaCode ? { areaCode: getAreaCode(params.areaCode) } : {}),
    },
    { headers: { operationID: uuidv4() } },
  );

// Source: src/api/login.ts
// Contract: docs/web-api-interface.md#2.3-注册
export const register = (params: API.Login.DemoRegisterType) =>
  request.post<unknown, { data: API.Login.AuthResponse }>(
    "/account/register",
    {
      ...params,
      user: {
        ...params.user,
        areaCode: getAreaCode(params.user.areaCode),
      },
      platform,
    },
    { headers: { operationID: uuidv4() } },
  );

// Source: src/api/login.ts
// Contract: docs/web-api-interface.md#2.5-重置密码
export const resetPassword = (params: API.Login.ResetParams) =>
  request.post(
    "/account/password/reset",
    {
      ...params,
      ...(params.areaCode ? { areaCode: getAreaCode(params.areaCode) } : {}),
    },
    { headers: { operationID: uuidv4() } },
  );

// Source: src/api/login.ts
// Contract: docs/web-api-interface.md#2.4-登录
export const login = (params: API.Login.LoginParams) =>
  request.post<unknown, { data: API.Login.AuthResponse }>(
    "/account/login",
    {
      ...params,
      platform,
      ...(params.areaCode ? { areaCode: getAreaCode(params.areaCode) } : {}),
    },
    { headers: { operationID: uuidv4() } },
  );

export interface BusinessUserInfo {
  userID: string;
  password: string;
  account: string;
  phoneNumber: string;
  areaCode: string;
  email: string;
  nickname: string;
  faceURL: string;
  gender: number;
  level: number;
  birth: number;
  allowAddFriend: BusinessAllowType;
  allowBeep: BusinessAllowType;
  allowVibration: BusinessAllowType;
  globalRecvMsgOpt: number;
}

export enum BusinessAllowType {
  Allow = 1,
  NotAllow = 2,
}

// Source: src/api/login.ts#getBusinessUserInfo
// Contract: docs/web-api-interface.md#3.1-按-userid-获取业务用户完整信息
export const getBusinessUserInfo = async (userIDs: string[]) =>
  request.post<unknown, { data: { users: BusinessUserInfo[] } }>(
    "/user/find/full",
    { userIDs },
    {
      headers: {
        operationID: uuidv4(),
        token: await getChatToken(),
      },
    },
  );

// Source: src/api/login.ts#searchBusinessUserInfo
// Contract: docs/web-api-interface.md#3.2-搜索业务用户
export const searchBusinessUserInfo = async (keyword: string) =>
  request.post<unknown, { data: { total: number; users: BusinessUserInfo[] } }>(
    "/user/search/full",
    {
      keyword,
      pagination: {
        pageNumber: 1,
        showNumber: 1,
      },
    },
    {
      headers: {
        operationID: uuidv4(),
        token: await getChatToken(),
      },
    },
  );

interface UpdateBusinessUserInfoParams {
  email: string;
  nickname: string;
  faceURL: string;
  gender: number;
  birth: number;
  allowAddFriend: BusinessAllowType;
  allowBeep: BusinessAllowType;
  allowVibration: BusinessAllowType;
  globalRecvMsgOpt: number;
}

// Source: src/api/login.ts#updateBusinessUserInfo
// Contract: docs/web-api-interface.md#3.3-更新业务用户信息
export const updateBusinessUserInfo = async (
  params: Partial<UpdateBusinessUserInfoParams>,
) =>
  request.post<unknown>(
    "/user/update",
    {
      ...params,
      userID: useUserStore().selfInfo.userID,
    },
    {
      headers: {
        operationID: uuidv4(),
        token: await getChatToken(),
      },
    },
  );
