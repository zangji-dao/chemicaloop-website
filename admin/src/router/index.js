import { createRouter, createWebHistory } from "vue-router";
// 导入所有页面组件
import LoginView from "@/views/LoginView.vue";
import MainLayout from "@/layout/MainLayout.vue";
import Dashboard from "@/views/Dashboard.vue";
import ContentManage from "@/views/ContentManage.vue";
import SystemConfig from "@/views/SystemConfig.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: "/", redirect: "/login" }, // 根路径跳登录
    // 登录页
    {
      path: "/login",
      name: "login",
      component: LoginView,
      meta: { noNeedAuth: true },
    },
    // 后台主布局（嵌套所有后台页面）
    {
      path: "/home",
      name: "MainLayout",
      component: MainLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: "",
          name: "Dashboard",
          component: Dashboard,
          meta: { role: ["admin", "editor"] },
        },
        {
          path: "content",
          name: "ContentManage",
          component: ContentManage,
          meta: { role: ["admin", "editor"] },
        },
        {
          path: "system",
          name: "SystemConfig",
          component: SystemConfig,
          meta: { role: ["admin"] },
        },
      ],
    },
    { path: "/:pathMatch(.*)*", redirect: "/login" }, // 404跳登录
  ],
});

// 登录拦截逻辑
router.beforeEach((to, from, next) => {
  if (to.meta.noNeedAuth) {
    next();
    return;
  }

  const token = localStorage.getItem("token");
  if (!token) {
    next("/login");
    return;
  }

  const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
  if (to.meta.role && to.meta.role.includes(userInfo.role)) {
    next();
  } else {
    alert("No permission to access!");
    next(from.path);
  }
});

export default router;
