import { getSDK } from "@openim/wasm-client-sdk";

// Source: src/layout/MainContentWrap.tsx
// Contract: docs/vue-rebuild-1to1-contract.md#6.1-基础工程与静态资源
// Keep wasm paths aligned with the old Web runtime: /openIM.wasm and /sql-wasm.wasm.
export const IMSDK = getSDK({
  coreWasmPath: "/openIM.wasm",
  sqlWasmPath: "/sql-wasm.wasm",
  debug: true,
});
