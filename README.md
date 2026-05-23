# openim-vue-web-demo

[中文文档](./README.zh-CN.md)

Community Vue 3 + Vite web-only migration of OpenIM `openim-electron-demo` v3.8.3, preserving Web API and WASM SDK call flows.

This project is a browser-only Vue implementation migrated from [`openimsdk/openim-electron-demo`](https://github.com/openimsdk/openim-electron-demo). The migration baseline is the original React + Electron demo at version `v3.8.3`. It is intended for developers who want to build or customize an OpenIM Web chat application with Vue while keeping the original Web API and `@openim/wasm-client-sdk` integration patterns.

> This is not an official OpenIM Vue repository. It is a community migration and compatibility-oriented demo.

## Credits and upstream

- Upstream project: [`openimsdk/openim-electron-demo`](https://github.com/openimsdk/openim-electron-demo)
- Upstream organization: [OpenIM](https://github.com/openimsdk)
- Migration baseline: `openim-electron-demo` `v3.8.3`
- SDK package: [`@openim/wasm-client-sdk`](https://www.npmjs.com/package/@openim/wasm-client-sdk)

Thanks to the OpenIM team and community for the original React/Electron demo, SDKs, and server ecosystem.

## What changed from the upstream demo

The upstream `openim-electron-demo` provides a React Web client plus Electron desktop capability. This repository keeps the browser-side demo goal but rebuilds it as a Vue project:

- Vue 3 + Vite implementation.
- Web-only runtime; Electron desktop packaging is intentionally not included.
- Uses `@openim/wasm-client-sdk`.
- Keeps the OpenIM REST API, chat API, WebSocket, WASM asset, login, contact, group, conversation, message, and call flows aligned with the upstream demo where currently implemented.

## Tech stack

- Vue 3
- Vite
- TypeScript
- Pinia
- Vue Router
- Ant Design Vue
- Sass
- Axios
- `@openim/wasm-client-sdk`
- LiveKit client packages used by the migrated audio/video call flow

## Runtime requirements

| Runtime | Version |
| --- | --- |
| Node.js | 18+ recommended |
| npm | 9+ recommended |
| Browser | Latest Chrome / Chromium recommended |
| OpenIM Server | Compatible with the `v3.8.3` demo API and SDK flow |

For audio/video calls in browsers, use `localhost` during local development or deploy over HTTPS because camera and microphone access are restricted by browser security policies.

## Quick start

### 1. Clone

```bash
git clone https://github.com/murongruolan/openim-vue-web-demo.git
cd openim-vue-web-demo
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure server addresses

Edit `.env`:

```bash
VITE_BASE_HOST=your-server-ip

VITE_WS_URL=ws://$VITE_BASE_HOST:10001
VITE_API_URL=http://$VITE_BASE_HOST:10002
VITE_CHAT_URL=http://$VITE_BASE_HOST:10008

# VITE_BASE_DOMAIN=your-server-domain

# VITE_WS_URL=wss://$VITE_BASE_DOMAIN/msg_gateway
# VITE_API_URL=https://$VITE_BASE_DOMAIN/api
# VITE_CHAT_URL=https://$VITE_BASE_DOMAIN/chat
```

If you use the default OpenIM deployment ports, normally only `VITE_BASE_HOST` needs to be changed. For domain and HTTPS deployment, follow the OpenIM nginx/domain configuration from the official documentation and switch to the HTTPS/WSS variables above.

### 4. Start the development server

```bash
npm run dev
```

Open:

```text
http://localhost:5174
```

Unlike the upstream Electron demo, this command only starts the browser Web client.

## Build

```bash
npm run build
```

The production artifacts are generated in:

```text
dist/
```

Preview the production build locally:

```bash
npm run preview
```

Default preview address:

```text
http://localhost:4174
```

## Static WASM assets

The WASM SDK needs the following static assets to be served from the site root:

```text
public/openIM.wasm
public/sql-wasm.wasm
public/wasm_exec.js
```

If you deploy behind a CDN or gateway, ensure these files are served correctly. For production, gzip or CDN acceleration is recommended because `openIM.wasm` is large.

## Project structure

```text
.
├── public/                 # Static assets required by the web client and WASM SDK
│   ├── openIM.wasm
│   ├── sql-wasm.wasm
│   └── wasm_exec.js
├── src/
│   ├── api/                # Chat/demo HTTP APIs
│   ├── assets/             # UI images and static UI assets
│   ├── components/         # Reusable Vue components
│   ├── config/             # App version constants
│   ├── i18n/               # Localized text resources
│   ├── im/                 # OpenIM SDK initialization, listeners, and helpers
│   ├── layout/             # Main application layout
│   ├── pages/              # Login, chat, contact, common modal pages
│   ├── routes/             # Vue Router configuration
│   ├── stores/             # Pinia stores
│   └── utils/              # Storage, events, request, and common utilities
├── .env                    # OpenIM API/chat/WebSocket endpoint configuration
├── package.json
└── vite.config.ts
```

## Current feature scope

This repository focuses on the Vue Web migration of the main browser flows:

- Phone and email login/register/forgot-password flows.
- Web API calls used by the demo login and business user information flow.
- WASM SDK login and connection flow.
- Conversation list and unread state.
- Single chat and group chat message flows.
- Text, image, video, file, emoji, voice, and card message UI paths migrated where implemented.
- Contact list, friend applications, friend search/add/accept/refuse flows.
- Group list, group applications, group creation, invite, kick, transfer owner, leave/disband flows.
- User card, group card, profile edit, account settings, about dialog, blacklist entry.
- One-to-one audio/video call UI and SDK signaling path migrated for the Web client.

The goal is compatibility rather than redesign. Desktop-only Electron features from the upstream project are intentionally excluded.

## FAQ

### Why not include Electron?

This repository is intended to provide a browser-only Vue migration. Electron packaging, desktop IPC, tray, native log upload, and desktop installer flows are outside the scope.

### Why keep the original API and SDK call shapes?

The migration goal is to make secondary development easier while preserving compatibility with OpenIM server/chat APIs and the WASM SDK call chain used by the original demo.

### WASM loading is slow after deployment. What should I do?

Enable gzip/brotli compression for `.wasm` files and consider CDN acceleration. Also ensure your server sends the correct static file responses for `openIM.wasm`, `sql-wasm.wasm`, and `wasm_exec.js`.

## License

This project is licensed under the GNU Affero General Public License v3.0 (AGPL-3.0). See [LICENSE](./LICENSE).

Because this project is derived from [`openimsdk/openim-electron-demo`](https://github.com/openimsdk/openim-electron-demo), upstream copyright and license notices should be preserved when redistributing or modifying this work.
