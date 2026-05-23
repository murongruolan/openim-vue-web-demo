<template>
  <main class="bootstrap-page">
    <section class="bootstrap-card">
      <h1>OpenCorp-Base Vue Web</h1>
      <p>Vue + Vite Web-only 1:1 迁移工程骨架。</p>
      <ul>
        <li>VITE_API_URL: {{ apiURL }}</li>
        <li>VITE_WS_URL: {{ wsURL }}</li>
        <li>VITE_CHAT_URL: {{ chatURL }}</li>
        <li>SDK initialized: {{ sdkReadyText }}</li>
      </ul>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed } from "vue";

import { IMSDK } from "@/im/sdk";

const apiURL = import.meta.env.VITE_API_URL;
const wsURL = import.meta.env.VITE_WS_URL;
const chatURL = import.meta.env.VITE_CHAT_URL;
const sdkReadyText = computed(() => String(Boolean(IMSDK)));
</script>

<style scoped lang="scss">
.bootstrap-page {
  display: flex;
  min-height: 100vh;
  align-items: center;
  justify-content: center;
  background: #f7f8fa;
}

.bootstrap-card {
  width: min(560px, calc(100vw - 48px));
  padding: 24px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 8px 24px rgb(0 0 0 / 8%);
}

h1 {
  margin: 0 0 12px;
  color: #1f2329;
  font-size: 22px;
}

p {
  margin: 0 0 16px;
  color: #646a73;
}

ul {
  margin: 0;
  padding-left: 18px;
  color: #1f2329;
  line-height: 1.9;
}
</style>
