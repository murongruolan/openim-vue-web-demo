import { createApp } from "vue";
import { createPinia } from "pinia";
import Antd from "ant-design-vue";
import "ant-design-vue/dist/reset.css";

import App from "./App.vue";
import "./im/sdk";
import "./i18n";
import router from "./routes";
import "./styles/global.scss";
import "./styles/antd.scss";
import "./styles/svg.scss";

const app = createApp(App);

app.use(createPinia());
app.use(router);
app.use(Antd);

app.mount("#app");
