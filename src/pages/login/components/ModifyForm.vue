<template>
  <div class="modify-form">
    <div class="back-link" @click="back">
      <LeftOutlined />
      <span>{{ t("placeholder.getBack") }}</span>
    </div>
    <div class="modify-title">{{ t("placeholder.forgetPassword") }}</div>

    <a-form
      :model="formState"
      layout="vertical"
      autocomplete="off"
      class="modify-body"
      @finish="onFinish"
    >
      <template v-if="isConfirm">
        <a-form-item
          name="password"
          :label="t('placeholder.password')"
          :help="t('toast.passwordRules')"
          :rules="[
            {
              required: true,
              pattern: /^(?=.*[0-9])(?=.*[a-zA-Z]).{6,20}$/,
              message: t('toast.passwordRules'),
            },
          ]"
        >
          <a-input-password
            v-model:value="formState.password"
            allow-clear
            :placeholder="t('toast.inputPassword')"
          />
        </a-form-item>

        <a-form-item
          name="password2"
          :label="t('placeholder.confirmPassword')"
          :rules="[
            { required: true, message: t('toast.reconfirmPassword') },
            { validator: validatePassword2 },
          ]"
        >
          <a-input-password
            v-model:value="formState.password2"
            allow-clear
            :placeholder="t('toast.reconfirmPassword')"
          />
        </a-form-item>
      </template>

      <template v-else>
        <a-form-item
          v-if="loginMethod === 'phone'"
          required
          :label="t('placeholder.phoneNumber')"
        >
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
          required
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

        <a-form-item required name="verifyCode" :label="t('placeholder.verifyCode')">
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
      </template>

      <a-form-item class="submit-row">
        <a-button type="primary" html-type="submit" block>
          {{ isConfirm ? t("confirm") : t("placeholder.nextStep") }}
        </a-button>
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { LeftOutlined } from "@ant-design/icons-vue";
import { message } from "ant-design-vue";
import md5 from "md5";
import { onBeforeUnmount, reactive, ref, watch } from "vue";

import { resetPassword, sendSms, verifyCode } from "@/api/login";
import { ts as t } from "@/i18n";

import { areaCode } from "../areaCode";

const props = defineProps<{
  loginMethod: "phone" | "email";
}>();

const emit = defineEmits<{
  changeFormType: [type: 0 | 1 | 2];
}>();

const countdown = ref(0);
const isConfirm = ref(false);
const formState = reactive({
  phoneNumber: "",
  email: "",
  areaCode: "+86",
  verifyCode: "",
  password: "",
  password2: "",
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

const validatePassword2 = async () => {
  if (!formState.password2 || formState.password === formState.password2) {
    return Promise.resolve();
  }
  return Promise.reject(new Error(t("toast.passwordsDifferent")));
};

const normalizeAccountParams = (params: {
  email?: string;
  phoneNumber?: string;
  areaCode?: string;
}) => {
  if (props.loginMethod === "phone") {
    delete params.email;
  }
  if (props.loginMethod === "email") {
    delete params.phoneNumber;
    delete params.areaCode;
  }
};

const sendSmsHandle = async () => {
  const params: API.Login.SendSmsParams = {
    phoneNumber: formState.phoneNumber,
    email: formState.email,
    areaCode: formState.areaCode,
    usedFor: 3,
  };
  normalizeAccountParams(params);
  await sendSms(params);
  countdown.value = 60;
};

const onFinish = async () => {
  if (!formState.verifyCode) {
    return;
  }
  if (!isConfirm.value) {
    const params: API.Login.VerifyCodeParams = {
      ...formState,
      usedFor: 2,
    };
    normalizeAccountParams(params);
    await verifyCode(params);
    isConfirm.value = true;
    return;
  }

  const params: API.Login.ResetParams = {
    ...formState,
    password: md5(formState.password),
  };
  normalizeAccountParams(params);
  await resetPassword(params);
  message.success(t("toast.updatePasswordSuccess"));
  emit("changeFormType", 0);
};

const back = () => {
  emit("changeFormType", 0);
};
</script>

<style scoped lang="scss">
.back-link {
  cursor: pointer;
  color: #9ca3af;
  font-size: 14px;

  span {
    margin-left: 4px;
  }
}

.modify-title {
  margin-top: 24px;
  font-size: 24px;
  font-weight: 500;
  line-height: 32px;
}

.modify-body {
  margin-top: 24px;
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

.submit-row {
  margin-top: 80px;
}
</style>
