import i18next from "i18next";

import zh from "./resources/zh.json";

i18next.init({
  lng: "zh",
  fallbackLng: "zh",
  resources: {
    zh: {
      translation: zh,
    },
  },
  interpolation: {
    escapeValue: false,
  },
});

export const t = i18next.t.bind(i18next);
export const ts = (key: string, options?: Record<string, unknown>) =>
  String(i18next.t(key, options ?? {}));
