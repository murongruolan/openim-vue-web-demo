<template>
  <div class="login-page">
    <div class="app-drag window-bar" />
    <div class="login-content">
      <section class="left-bar">
        <div class="left-inner">
          <div class="left-title">{{ t("placeholder.title") }}</div>
          <span class="left-subtitle">{{ t("placeholder.subTitle") }}</span>
          <img :src="loginBg" alt="login_bg" />
        </div>
      </section>

      <section class="login-card">
        <LoginForm
          v-if="formType === 0"
          :login-method="loginMethod"
          @change-form-type="setFormType"
          @update-login-method="updateLoginMethod"
        />
        <ModifyForm
          v-if="formType === 1"
          :login-method="loginMethod"
          @change-form-type="setFormType"
        />
        <RegisterForm
          v-if="formType === 2"
          :login-method="loginMethod"
          @change-form-type="setFormType"
        />
      </section>
    </div>

    <div class="version-info" @click="handleCopy">
      <span>{{ APP_NAME }} {{ APP_VERSION }}</span>
      <span>{{ SDK_VERSION }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { message } from "ant-design-vue";

import loginBg from "@/assets/images/login/login_bg.png";
import { APP_NAME, APP_VERSION, SDK_VERSION } from "@/config";
import { ts as t } from "@/i18n";
import { getLoginMethod, setLoginMethod } from "@/utils/storage";

import LoginForm from "./components/LoginForm.vue";
import ModifyForm from "./components/ModifyForm.vue";
import RegisterForm from "./components/RegisterForm.vue";

export type FormType = 0 | 1 | 2;

const formType = ref<FormType>(0);
const loginMethod = ref<"phone" | "email">(getLoginMethod());

const setFormType = (type: FormType) => {
  formType.value = type;
};

const updateLoginMethod = (method: "phone" | "email") => {
  loginMethod.value = method;
  setLoginMethod(method);
};

const handleCopy = async () => {
  await navigator.clipboard?.writeText(`${APP_NAME} ${APP_VERSION}/${SDK_VERSION}`);
  message.success(t("toast.copySuccess"));
};
</script>

<style scoped lang="scss">
.login-page {
  position: relative;
  display: flex;
  height: 100%;
  flex-direction: column;
}

.window-bar {
  position: relative;
  height: 40px;
  flex: 0 0 40px;
  background: var(--top-search-bar);
}

.login-content {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.left-bar {
  display: flex;
  min-height: 420px;
}

.left-inner {
  margin-right: 56px;
  text-align: center;
}

.left-title {
  font-size: 24px;
  line-height: 32px;
}

.left-subtitle {
  color: #9ca3af;
  font-size: 14px;
}

.left-inner img {
  display: block;
}

.login-card {
  width: 350px;
  height: 450px;
  margin-right: 56px;
  padding: 44px;
  border-radius: 6px;
  background: #fff;
  box-shadow: 0 0 30px rgb(0 0 0 / 10%);
}

.version-info {
  position: absolute;
  right: 12px;
  bottom: 12px;
  display: flex;
  cursor: pointer;
  flex-direction: column;
  align-items: center;
  color: var(--sub-text);
  font-size: 12px;
  line-height: 18px;
}

@media only screen and (max-width: 900px) {
  .left-bar {
    display: none;
  }

  .login-card {
    margin-right: 0;
  }
}
</style>
