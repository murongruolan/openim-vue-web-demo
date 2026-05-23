import { defineStore } from "pinia";

import { getBusinessUserInfo, type BusinessUserInfo } from "@/api/login";
import { IMSDK } from "@/im/sdk";
import router from "@/routes";
import { clearIMProfile, getLocale, setLocale } from "@/utils/storage";

import { useContactStore } from "./contact";
import { useConversationStore } from "./conversation";
import type { AppSettings, IMConnectState, UserStoreState } from "./types";

export const useUserStore = defineStore("user", {
  state: (): UserStoreState => ({
    userID: "",
    imToken: "",
    chatToken: "",
    syncState: "success",
    progress: 0,
    reinstall: true,
    isLogining: false,
    connectState: "success",
    selfInfo: {},
    appSettings: {
      locale: getLocale(),
      closeAction: "miniSize",
    },
  }),
  actions: {
    updateSyncState(syncState: IMConnectState) {
      this.syncState = syncState;
    },
    updateProgressState(progress: number) {
      this.progress = progress;
    },
    updateReinstallState(reinstall: boolean) {
      this.reinstall = reinstall;
    },
    updateIsLogining(isLogining: boolean) {
      this.isLogining = isLogining;
    },
    updateConnectState(connectState: IMConnectState) {
      this.connectState = connectState;
    },
    updateSelfInfo(info: Partial<BusinessUserInfo>) {
      this.selfInfo = {
        ...this.selfInfo,
        ...info,
      };
    },
    async getSelfInfoByReq() {
      try {
        const { data } = await IMSDK.getSelfUserInfo();
        this.selfInfo = data as unknown as BusinessUserInfo;
        const res = await getBusinessUserInfo([data.userID]);
        this.selfInfo = {
          ...this.selfInfo,
          ...res.data.users[0],
        };
      } catch (error) {
        console.error("getSelfInfoByReq", error);
        await this.userLogout();
      }
    },
    updateAppSettings(settings: Partial<AppSettings>) {
      if (settings.locale) {
        setLocale(settings.locale);
      }
      this.appSettings = {
        ...this.appSettings,
        ...settings,
      };
    },
    async userLogout(force?: boolean) {
      if (!force) {
        try {
          await IMSDK.logout();
        } catch (error) {
          console.error("logout", error);
        }
      }

      await clearIMProfile();
      this.userID = "";
      this.imToken = "";
      this.chatToken = "";
      this.selfInfo = {};
      this.progress = 0;
      useContactStore().clearContactStore();
      useConversationStore().clearConversationStore();
      router.push("/login");
    },
  },
});
