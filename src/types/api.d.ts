declare namespace API {
  namespace Login {
    type SendSmsParams = {
      email?: string;
      phoneNumber?: string;
      areaCode?: string;
      deviceID?: string;
      usedFor: 1 | 2 | 3;
      invitationCode?: string;
    };

    type VerifyCodeParams = {
      email?: string;
      phoneNumber?: string;
      areaCode?: string;
      verifyCode: string;
      usedFor: 1 | 2 | 3;
    };

    type LoginParams = {
      email?: string;
      phoneNumber?: string;
      areaCode?: string;
      password?: string;
      verifyCode?: string;
      platform?: number;
    };

    type DemoRegisterType = {
      verifyCode: string;
      autoLogin: boolean;
      user: {
        nickname: string;
        faceURL: string;
        areaCode?: string;
        phoneNumber?: string;
        password: string;
        email?: string;
      };
      platform?: number;
    };

    type ResetParams = {
      email?: string;
      phoneNumber?: string;
      areaCode?: string;
      verifyCode: string;
      password: string;
      password2?: string;
    };

    type AuthResponse = {
      chatToken: string;
      imToken: string;
      userID: string;
    };
  }
}
