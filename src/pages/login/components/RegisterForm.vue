<template>
  <div class="register-form">
    <div class="back-link" @click="back">
      <LeftOutlined />
      <span>{{ t("placeholder.getBack") }}</span>
    </div>

    <div class="register-title">
      <span v-if="registerForm === 0">{{ t("placeholder.register") }}</span>
      <span v-if="registerForm === 1">{{ t(verifyTitle) }}</span>
      <span v-if="registerForm === 2">{{ t("placeholder.setInfo") }}</span>
    </div>

    <div v-show="registerForm === 1" class="verify-desc">
      <span>{{ t("placeholder.pleaseEnterSendTo") }}</span>
      <span class="receiver">{{ receiver }}</span>
      <span>{{ t("placeholder.verifyValidity") }}</span>
    </div>

    <a-form
      ref="formRef"
      :model="formState"
      layout="vertical"
      autocomplete="off"
      class="register-body"
      @finish="onFinish"
    >
      <a-form-item
        v-if="loginMethod === 'phone'"
        v-show="registerForm === 0"
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
        v-show="registerForm === 0"
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

      <a-form-item v-show="registerForm === 1" class="verify-code-item">
        <div class="code-row">
          <a-input
            v-for="(_, index) in code"
            :key="index"
            :ref="(input: unknown) => setInputRef(input, index)"
            v-model:value="code[index]"
            type="text"
            :maxlength="1"
            class="code-input"
            @change="handleInputChange(index)"
            @keyup="handleInputKeyUp(index, $event)"
          />
        </div>
        <div class="resend-line">
          <template v-if="countdown > 0">
            <span class="blue-text">{{ countdown }}s </span>
            <span>{{ t("placeholder.regain") + t("placeholder.verifyCode") }}</span>
          </template>
          <template v-else>
            <span class="resend-action" @click="sendSmsHandle">{{ t("placeholder.regain") }}</span>
            <span>{{ t("placeholder.verifyCode") }}</span>
          </template>
        </div>
      </a-form-item>

      <template v-if="registerForm === 2">
        <a-form-item
          name="nickname"
          :label="t('placeholder.nickName')"
          :rules="[{ required: true }]"
        >
          <a-input
            v-model:value="formState.nickname"
            allow-clear
            spellcheck="false"
            :placeholder="t('toast.inputNickName')"
          />
        </a-form-item>

        <a-form-item
          name="password"
          :label="t('placeholder.password')"
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
          class="confirm-password-item"
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

      <a-form-item>
        <a-button type="primary" html-type="submit" block>
          {{ registerForm === 2 ? t("confirm") : t("placeholder.nextStep") }}
        </a-button>
      </a-form-item>
    </a-form>
  </div>
</template>

<script setup lang="ts">
import { LeftOutlined } from "@ant-design/icons-vue";
import { message } from "ant-design-vue";
import md5 from "md5";
import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";

import { register, sendSms, verifyCode as verifySmsCode } from "@/api/login";
import { ts as t } from "@/i18n";
import { setAreaCode, setEmail, setIMProfile, setPhoneNumber } from "@/utils/storage";

import { areaCode } from "../areaCode";

type FocusableInput = { focus?: () => void };

const props = defineProps<{
  loginMethod: "phone" | "email";
}>();

const emit = defineEmits<{
  changeFormType: [type: 0 | 1 | 2];
}>();

const router = useRouter();
const registerForm = ref(0);
const countdown = ref(0);
const code = ref(["", "", "", "", "", ""]);
const inputRefs = ref<FocusableInput[]>([]);
const formState = reactive({
  email: "",
  phoneNumber: "",
  areaCode: "+86",
  nickname: "",
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

const isEmail = computed(() => props.loginMethod === "email");
const verifyTitle = computed(() =>
  !isEmail.value ? "placeholder.verifyPhoneNumber" : "placeholder.verifyEmail",
);
const receiver = computed(() =>
  isEmail.value ? formState.email : `${formState.areaCode} ${formState.phoneNumber}`,
);
const verifyCode = computed(() => code.value.join(""));

const setInputRef = (input: unknown, index: number) => {
  if (input) {
    inputRefs.value[index] = input as FocusableInput;
  }
};

const handleInputChange = (index: number) => {
  const value = code.value[index] ?? "";
  if (value.length === 1 && index < code.value.length - 1) {
    inputRefs.value[index + 1]?.focus?.();
  }
  if (code.value.every((item) => item.length > 0)) {
    onFinish();
  }
};

const handleInputKeyUp = (index: number, event: KeyboardEvent) => {
  const keyPressed = event.keyCode || event.which;
  if (keyPressed === 8 && index > 0) {
    code.value[index - 1] = "";
    inputRefs.value[index - 1]?.focus?.();
  }
  if (keyPressed === 8 || keyPressed === 46) {
    code.value[index] = "";
  }
};

const sendSmsHandle = async () => {
  const params: API.Login.SendSmsParams = {
    email: formState.email,
    phoneNumber: formState.phoneNumber,
    areaCode: formState.areaCode,
    usedFor: 1,
  };
  normalizeAccountParams(params);
  await sendSms(params);
  countdown.value = 60;
};

const validatePassword2 = async () => {
  if (!formState.password2 || formState.password === formState.password2) {
    return Promise.resolve();
  }
  return Promise.reject(new Error(t("toast.passwordsDifferent")));
};

const back = () => {
  emit("changeFormType", 0);
  registerForm.value = 0;
  code.value = ["", "", "", "", "", ""];
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

const onFinish = async () => {
  if (registerForm.value === 0) {
    const pattern = /^1\d{10}$/;
    if (formState.phoneNumber && !pattern.test(formState.phoneNumber)) {
      message.error(t("toast.inputCorrectPhoneNumber"));
      return;
    }
    const params: API.Login.SendSmsParams = {
      usedFor: 1,
      email: formState.email,
      phoneNumber: formState.phoneNumber,
      areaCode: formState.areaCode,
    };
    normalizeAccountParams(params);
    await sendSms(params);
    countdown.value = 60;
    registerForm.value = 1;
    await nextTick();
    inputRefs.value[0]?.focus?.();
    return;
  }

  if (registerForm.value === 1) {
    if (!verifyCode.value) {
      return;
    }
    const params: API.Login.VerifyCodeParams = {
      email: formState.email,
      phoneNumber: formState.phoneNumber,
      areaCode: formState.areaCode,
      verifyCode: verifyCode.value,
      usedFor: 1,
    };
    normalizeAccountParams(params);
    await verifySmsCode(params);
    registerForm.value = 2;
    return;
  }

  if (registerForm.value === 2) {
    setAreaCode(formState.areaCode);
    if (formState.phoneNumber) {
      setPhoneNumber(formState.phoneNumber);
    }
    if (formState.email) {
      setEmail(formState.email);
    }

    const user: API.Login.DemoRegisterType["user"] = {
      nickname: formState.nickname,
      faceURL: "",
      areaCode: formState.areaCode,
      phoneNumber: formState.phoneNumber,
      password: md5(formState.password),
      email: formState.email,
    };
    normalizeAccountParams(user);

    const res = await register({
      verifyCode: verifyCode.value,
      autoLogin: true,
      user,
    });
    message.success(t("toast.registerSuccess"));
    const { chatToken, imToken, userID } = res.data;
    setIMProfile({ chatToken, imToken, userID });
    router.push("/chat");
  }
};
</script>

<style scoped lang="scss">
.register-form {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.back-link {
  cursor: pointer;
  color: #9ca3af;
  font-size: 14px;

  span {
    margin-left: 4px;
  }
}

.register-title {
  margin-top: 16px;
  font-size: 24px;
  font-weight: 500;
  line-height: 32px;
}

.verify-desc {
  margin-top: 16px;
  color: #9ca3af;
  letter-spacing: 0.05em;
}

.receiver,
.blue-text,
.resend-action {
  color: #2563eb;
}

.register-body {
  margin-top: 16px;
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

.verify-code-item {
  margin-top: 32px;
  margin-bottom: 56px;
}

.code-row {
  display: flex;
  justify-content: center;
}

.code-input {
  width: 44px;
  height: 44px;
  margin-right: 4px;
  text-align: center;
  font-size: 24px;
}

.resend-line {
  margin-top: 16px;
  color: #9ca3af;
}

.resend-action {
  cursor: pointer;
}

.confirm-password-item {
  margin-bottom: 32px;
}
</style>
