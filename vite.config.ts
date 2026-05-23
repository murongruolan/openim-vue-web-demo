import path from "node:path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// Source: docs/vue-rebuild-1to1-contract.md#6.1-基础工程与静态资源
// Web-only Vue project. Electron plugins and Electron build logic are intentionally excluded.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        silenceDeprecations: ["legacy-js-api"],
      },
    },
  },
  plugins: [vue()],
  server: {
    host: "0.0.0.0",
    port: 5174,
  },
  clearScreen: false,
  build: {
    sourcemap: false,
    cssCodeSplit: true,
    chunkSizeWarningLimit: 500,
  },
});
