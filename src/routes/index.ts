import { createRouter, createWebHashHistory } from "vue-router";

import { getChatToken, getIMToken, getIMUserID } from "@/utils/storage";

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: "/",
      component: () => import("@/layout/MainContentLayout.vue"),
      redirect: "/chat",
      children: [
        {
          path: "chat",
          component: () => import("@/pages/chat/ChatPage.vue"),
          children: [
            {
              path: "",
              name: "EmptyChat",
              component: () => import("@/pages/chat/EmptyChat.vue"),
            },
            {
              path: ":conversationID",
              name: "QueryChat",
              component: () => import("@/pages/chat/ChatDetailPage.vue"),
            },
          ],
        },
        {
          path: "contact",
          component: () => import("@/pages/contact/ContactPage.vue"),
          children: [
            {
              path: "",
              name: "MyFriends",
              component: () => import("@/pages/contact/MyFriends.vue"),
            },
            {
              path: "myGroups",
              name: "MyGroups",
              component: () => import("@/pages/contact/MyGroups.vue"),
            },
            {
              path: "newFriends",
              name: "NewFriends",
              component: () => import("@/pages/contact/NewFriends.vue"),
            },
            {
              path: "groupNotifications",
              name: "GroupNotifications",
              component: () => import("@/pages/contact/GroupNotifications.vue"),
            },
          ],
        },
      ],
    },
    {
      path: "/login",
      name: "Login",
      component: () => import("@/pages/login/LoginPage.vue"),
    },
  ],
});

router.beforeEach(async (to) => {
  if (to.path === "/login") return true;

  const [imToken, imUserID, chatToken] = await Promise.all([
    getIMToken(),
    getIMUserID(),
    getChatToken(),
  ]);

  if (!imToken || !imUserID) {
    return "/login";
  }

  if (to.path.startsWith("/chat") || to.path.startsWith("/contact") || to.path === "/") {
    to.meta.imProfile = { imToken, userID: imUserID, chatToken: chatToken ?? "" };
  }
  return true;
});

export default router;
