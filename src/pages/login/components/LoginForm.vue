<template>
  <div class="login-form">
    <div class="form-title">{{ t("placeholder.welcome") }}</div>
    <a-tabs :active-key="loginMethod" class="login-method-tab" @change="onLoginMethodChange">
      <a-tab-pane key="phone" :tab="t('placeholder.phoneNumber')" />
      <a-tab-pane key="email" :tab="t('placeholder.email')" />
    </a-tabs>

    <a-form
      ref="formRef"
      :model="formState"
      layout="vertical"
      autocomplete="off"
      @finish="onFinish"
    >
      <a-form-item v-if="loginMethod === 'phone'" :label="t('placeholder.phoneNumber')">
        <a-input-group compact>
          <a-select v-model:value="formState.areaCode" class="area-select" :options="areaCode" />
          <a-input
            v-model:value="formState.phoneNumber"
            allow-clear
            class="phone-input"
            :placeholder="t('toast.inputPhoneNumber')"
          />
        </a-input-group>
      </a-form-item>
      <a-form-item
        v-else
        name="email"
        :label="t('placeholder.email')"
        :rules="[{ type: 'email', message: t('toast.inputCorrectEmail') }]"
      >
        <a-input
          v-model:value="formState.email"
          allow-clear
          :placeholder="t('toast.inputEmail')"
        />
      </a-form-item>

      <a-form-item
        v-if="loginType === LoginType.VerifyCode"
        name="verifyCode"
        :label="t('placeholder.verifyCode')"
      >
        <a-input-group compact>
          <a-input
            v-model:value="formState.verifyCode"
            allow-clear
            class="verify-input"
            :placeholder="t('toast.inputVerifyCode')"
          />
          <a-button type="primary" :loading="countdown > 0" @click="sendSmsHandle">
            {{ countdown > 0 ? t("date.second", { num: countdown }) : t("placeholder.sendVerifyCode") }}
          </a-button>
        </a-input-group>
      </a-form-item>
      <a-form-item v-else name="password" :label="t('placeholder.password')">
        <a-input-password
          v-model:value="formState.password"
          allow-clear
          :placeholder="t('toast.inputPassword')"
        />
      </a-form-item>

      <div class="login-actions">
        <span class="muted-link" @click="$emit('changeFormType', 1)">
          {{ t("placeholder.forgetPassword") }}
        </span>
        <span class="primary-link" @click="toggleLoginType">
          {{ loginType === LoginType.Password ? t("placeholder.verifyCode") : t("placeholder.password") }}{{ t("placeholder.login") }}
        </span>
      </div>

      <a-form-item class="submit-item">
        <a-button type="primary" html-type="submit" block :loading="loading">
          {{ t("placeholder.login") }}
        </a-button>
      </a-form-item>

      <div class="register-line">
        <span>{{ t("placeholder.registerToast") }}</span>
        <span class="register-link" @click="$emit('changeFormType', 2)">
          {{ t("placeholder.toRegister") }}
        </span>
      </div>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import md5 from "md5";
import { message } from "ant-design-vue";
import { onBeforeUnmount, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";

import { login, sendSms } from "@/api/login";
import { ts as t } from "@/i18n";
import {
  getEmail,
  getPhoneNumber,
  setAreaCode,
  setEmail,
  setIMProfile,
  setPhoneNumber,
} from "@/utils/storage";

import { areaCode } from "../areaCode";

enum LoginType {
  Password,
  VerifyCode,
}

const props = defineProps<{
  loginMethod: "phone" | "email";
}>();

const emit = defineEmits<{
  changeFormType: [type: 0 | 1 | 2];
  updateLoginMethod: [method: "phone" | "email"];
}>();

const router = useRouter();
const loading = ref(false);
const loginType = ref<LoginType>(LoginType.Password);
const countdown = ref(0);
const formState = reactive<API.Login.LoginParams>({
  areaCode: "+86",
  phoneNumber: getPhoneNumber() ?? "",
  email: getEmail() ?? "",
  password: "",
  verifyCode: "",
});

let timer: number | undefined;

watch(countdown, (value) => {
  if (timer) {
    window.clearTimeout(timer);
    timer = undefined;
  }
  if (value > 0) {
    timer = window.setTimeout(() => {
      countdown.value -= 1;
    }, 1000);
  }
});

onBeforeUnmount(() => {
  if (timer) {
    window.clearTimeout(timer);
  }
});

const onLoginMethodChange = (key: string) => {
  emit("updateLoginMethod", key as "phone" | "email");
};

const toggleLoginType = () => {
  loginType.value =
    loginType.value === LoginType.Password ? LoginType.VerifyCode : LoginType.Password;
};

const sendSmsHandle = async () => {
  const options: API.Login.SendSmsParams = {
    phoneNumber: formState.phoneNumber,
    email: formState.email,
    areaCode: formState.areaCode,
    usedFor: 3,
  };
  if (props.loginMethod === "phone") {
    delete options.email;
  }
  if (props.loginMethod === "email") {
    delete options.phoneNumber;
    delete options.areaCode;
  }

  await sendSms(options);
  countdown.value = 60;
};

const onFinish = async () => {
  const params: API.Login.LoginParams = { ...formState };
  if (loginType.value === LoginType.Password) {
    params.password = md5(params.password ?? "");
    delete params.verifyCode;
  } else {
    delete params.password;
  }

  if (props.loginMethod === "phone") {
    delete params.email;
  } else {
    delete params.phoneNumber;
    delete params.areaCode;
  }

  if (params.phoneNumber) {
    setAreaCode(params.areaCode ?? "+86");
    setPhoneNumber(params.phoneNumber);
  }
  if (params.email) {
    setEmail(params.email);
  }

  loading.value = true;
  try {
    const res = await login(params);
    const { chatToken, imToken, userID } = res.data;
    setIMProfile({ chatToken, imToken, userID });
    router.push("/chat");
  } catch (error) {
    const err = error as { errMsg?: string };
    if (err.errMsg) {
      message.error(err.errMsg);
    }
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped lang="scss">
.form-title {
  font-size: 20px;
  font-weight: 500;
  line-height: 28px;
}

.login-method-tab {
  :deep(.ant-tabs-nav) {
    margin: 24px 0 12px;
  }

  :deep(.ant-tabs-tab) {
    padding: 6px 0;
  }
}

.area-select {
  width: 76px !important;
  min-width: 76px;
  flex: 0 0 76px;
}

.phone-input {
  width: calc(100% - 76px) !important;
  flex: 1 1 0;
}

.verify-input {
  width: calc(100% - 104px);
}

.login-actions {
  display: flex;
  justify-content: space-between;
  margin-bottom: 40px;
}

.muted-link,
.primary-link,
.register-link {
  cursor: pointer;
  font-size: 14px;
}

.muted-link,
.register-line {
  color: #9ca3af;
}

.primary-link,
.register-link {
  color: var(--primary);
}

.submit-item {
  margin-bottom: 16px;
}

.register-line {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}
</style>
