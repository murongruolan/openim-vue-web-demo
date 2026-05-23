import axios from "axios";
import { v4 as uuidv4 } from "uuid";

import { getChatToken, getIMToken } from "@/utils/storage";

// Source: src/utils/request.ts
// Contract: docs/web-api-interface.md#1-基础信息
const tokenErrorCodeList = [1501, 1503, 1504, 1505];

export const createRequest = (baseURL: string, imToken = true) => {
  const request = axios.create({
    baseURL,
    timeout: 25000,
  });

  request.interceptors.request.use(async (config) => {
    const token = imToken ? await getIMToken() : await getChatToken();
    if (config.headers.token === undefined && token) {
      config.headers.token = token;
    }
    config.headers.operationID = uuidv4();
    return config;
  });

  request.interceptors.response.use((response) => {
    if (tokenErrorCodeList.includes(response.data.errCode)) {
      return Promise.reject(response.data);
    }
    if (response.data.errCode !== 0) {
      return Promise.reject(response.data);
    }
    return response.data;
  });

  return request;
};
