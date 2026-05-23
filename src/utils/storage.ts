import localforage from "localforage";

// Source: src/utils/storage.ts
// Contract: docs/vue-rebuild-1to1-contract.md#5-原项目到-vue-版迁移映射
localforage.config({
  name: "OpenCorp-Config",
});

export const IM_TOKEN_KEY = "IM_TOKEN";
export const IM_CHAT_TOKEN_KEY = "IM_CHAT_TOKEN";
export const IM_USERID_KEY = "IM_USERID";

export const setAreaCode = (areaCode: string) =>
  localStorage.setItem("IM_AREA_CODE", areaCode);
export const setPhoneNumber = (account: string) =>
  localStorage.setItem("IM_PHONE_NUM", account);
export const setEmail = (email: string) => localStorage.setItem("IM_EMAIL", email);
export const setLoginMethod = (method: string) =>
  localStorage.setItem("IM_LOGIN_METHOD", method);
export const setTMToken = (token: string) => localforage.setItem(IM_TOKEN_KEY, token);
export const setChatToken = (token: string) =>
  localforage.setItem(IM_CHAT_TOKEN_KEY, token);
export const setTMUserID = (userID: string) => localforage.setItem(IM_USERID_KEY, userID);

export const setIMProfile = ({
  chatToken,
  imToken,
  userID,
}: {
  chatToken: string;
  imToken: string;
  userID: string;
}) => {
  setTMToken(imToken);
  setChatToken(chatToken);
  setTMUserID(userID);
};

export const getAreaCode = () => localStorage.getItem("IM_AREA_CODE");
export const getPhoneNumber = () => localStorage.getItem("IM_PHONE_NUM");
export const getEmail = () => localStorage.getItem("IM_EMAIL");
export const getLoginMethod = () =>
  (localStorage.getItem("IM_LOGIN_METHOD") ?? "phone") as "phone" | "email";
export const getIMToken = () => localforage.getItem<string>(IM_TOKEN_KEY);
export const getChatToken = () => localforage.getItem<string>(IM_CHAT_TOKEN_KEY);
export const getIMUserID = () => localforage.getItem<string>(IM_USERID_KEY);

export const setLocale = (locale: string) => localStorage.setItem("IM_LOCALE", locale);

export const getLocale = () =>
  localStorage.getItem("IM_LOCALE") || window.navigator.language || "en-US";

export const clearIMProfile = () =>
  Promise.all([
    localforage.removeItem(IM_TOKEN_KEY),
    localforage.removeItem(IM_CHAT_TOKEN_KEY),
    localforage.removeItem(IM_USERID_KEY),
  ]);
