# openim-vue-web-demo

[English](./README.md)

基于 OpenIM `openim-electron-demo` v3.8.3 迁移的社区 Vue 3 + Vite 浏览器端版本，尽量保留原 Web API 与 WASM SDK 调用方式。

本项目是从 [`openimsdk/openim-electron-demo`](https://github.com/openimsdk/openim-electron-demo) 迁移而来的浏览器端 Vue 实现。迁移基线为原项目 React + Electron 版本 `v3.8.3`。项目目标是为希望使用 Vue 技术栈开发或二开 OpenIM Web 聊天应用的开发者提供一个可运行、接口调用方式尽量一致的参考实现。

> 本项目不是 OpenIM 官方 Vue 仓库，而是社区迁移版与兼容性导向的 Demo。

## 致谢与上游项目

- 原项目仓库：[`openimsdk/openim-electron-demo`](https://github.com/openimsdk/openim-electron-demo)
- 原项目组织：[OpenIM](https://github.com/openimsdk)
- 迁移基线：`openim-electron-demo` `v3.8.3`
- SDK 包：[`@openim/wasm-client-sdk`](https://www.npmjs.com/package/@openim/wasm-client-sdk)

感谢 OpenIM 团队与社区提供原 React/Electron Demo、SDK 和服务端生态。

## 与原项目的区别

原 `openim-electron-demo` 是 React Web 客户端加 Electron 桌面端能力。本仓库保留浏览器端 Demo 目标，但使用 Vue 技术栈重构：

- 使用 Vue 3 + Vite。
- 仅保留 Web 浏览器端运行能力，不包含 Electron 桌面端打包。
- 使用 `@openim/wasm-client-sdk`。
- 当前已实现部分尽量保持 OpenIM REST API、chat API、WebSocket、WASM 资源、登录、联系人、群组、会话、消息、音视频通话等调用方式与原项目一致。

## 技术栈

- Vue 3
- Vite
- TypeScript
- Pinia
- Vue Router
- Ant Design Vue
- Sass
- Axios
- `@openim/wasm-client-sdk`
- LiveKit client 相关包，用于已迁移的一对一音视频通话链路

## 运行环境

| 环境 | 版本 |
| --- | --- |
| Node.js | 推荐 18+ |
| npm | 推荐 9+ |
| 浏览器 | 推荐最新版 Chrome / Chromium |
| OpenIM Server | 需兼容 `v3.8.3` Demo API 与 SDK 调用方式 |

如果需要在浏览器端使用音视频通话，请在本地 `localhost` 调试，或部署到 HTTPS 站点。这是浏览器摄像头、麦克风权限策略限制。

## 快速开始

### 1. 拉取代码

```bash
git clone https://github.com/murongruolan/openim-vue-web-demo.git
cd openim-vue-web-demo
```

### 2. 安装依赖

```bash
npm install
```

### 3. 修改服务端地址

编辑 `.env`：

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

如果没有修改 OpenIM 服务端默认端口，通常只需要修改 `VITE_BASE_HOST`。如果需要域名和 HTTPS 部署，请参考 OpenIM 官方 nginx/domain 配置，并切换到上方 HTTPS/WSS 配置项。

### 4. 启动开发服务

```bash
npm run dev
```

访问：

```text
http://localhost:5174
```

与原 Electron Demo 不同，本项目的 `npm run dev` 只启动浏览器 Web 客户端，不会启动 Electron 桌面端。

## 构建

```bash
npm run build
```

构建产物位于：

```text
dist/
```

本地预览生产构建：

```bash
npm run preview
```

默认预览地址：

```text
http://localhost:4174
```

## WASM 静态资源

WASM SDK 需要以下静态资源可以从站点根路径访问：

```text
public/openIM.wasm
public/sql-wasm.wasm
public/wasm_exec.js
```

如果通过 CDN、网关或静态资源服务器部署，请确认这些文件可以正确访问。生产环境建议对 `.wasm` 文件开启 gzip/brotli 压缩或 CDN 加速，因为 `openIM.wasm` 文件较大。

## 项目结构

```text
.
├── public/                 # Web 客户端和 WASM SDK 所需静态资源
│   ├── openIM.wasm
│   ├── sql-wasm.wasm
│   └── wasm_exec.js
├── src/
│   ├── api/                # chat/demo HTTP API
│   ├── assets/             # UI 图片和静态资源
│   ├── components/         # Vue 通用组件
│   ├── config/             # 应用版本常量
│   ├── i18n/               # 多语言资源
│   ├── im/                 # OpenIM SDK 初始化、事件监听和辅助方法
│   ├── layout/             # 主布局
│   ├── pages/              # 登录、聊天、通讯录、公共弹窗页面
│   ├── routes/             # Vue Router 配置
│   ├── stores/             # Pinia 状态
│   └── utils/              # 存储、事件、请求和通用工具
├── .env                    # OpenIM API/chat/WebSocket 地址配置
├── package.json
└── vite.config.ts
```

## 当前功能范围

本仓库聚焦原 Demo 浏览器端主链路的 Vue 迁移：

- 手机号、邮箱登录/注册/忘记密码流程。
- Demo 登录和业务用户信息相关 Web API 调用。
- WASM SDK 登录与连接流程。
- 会话列表与未读状态。
- 单聊和群聊消息流程。
- 文本、图片、视频、文件、表情、语音、名片等消息 UI 链路迁移。
- 通讯录、好友申请、搜索好友、添加好友、同意/拒绝好友申请。
- 群组列表、群申请、创建群聊、邀请、踢人、转让群主、退群/解散。
- 用户名片、群名片、编辑资料、账号设置、关于我们、黑名单入口。
- Web 端一对一音视频通话 UI 与 SDK 信令链路迁移。

本项目目标是兼容性，不是重新设计 UI。原项目中仅 Electron 桌面端使用的能力已被排除。

## 常见问题

### 为什么不包含 Electron？

本仓库定位是浏览器端 Vue 迁移版本。Electron 打包、桌面 IPC、托盘、原生日志上传、桌面安装包等能力不在当前范围内。

### 为什么强调保留原 API 和 SDK 入参模型？

迁移目标是降低 Vue 技术栈开发者的二开成本，同时保持与 OpenIM 服务端/chat API 和 WASM SDK 调用方式的兼容性。

### 发布 Web 端后 WASM 加载慢怎么办？

建议为 `.wasm` 文件开启 gzip/brotli 压缩，并考虑 CDN 加速。同时确保 `openIM.wasm`、`sql-wasm.wasm`、`wasm_exec.js` 可以被部署环境正确返回。

## 授权许可

本项目使用 GNU Affero General Public License v3.0（AGPL-3.0）授权，详见 [LICENSE](./LICENSE)。

由于本项目基于 [`openimsdk/openim-electron-demo`](https://github.com/openimsdk/openim-electron-demo) 迁移，分发或修改本项目时应保留上游版权和许可证声明。
