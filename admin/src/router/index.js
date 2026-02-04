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
  // 如果页面不需要登录（如登录页），直接放行
  if (to.meta.noNeedAuth) {
    next();
    return;
  }

  // 检查 token 是否存在
  const token = localStorage.getItem("token");
  if (!token) {
    next("/login");
    return;
  }

  // 如果用户信息中有 role，进行权限检查
  const userInfo = JSON.parse(localStorage.getItem("userInfo") || "{}");
  if (to.meta.role && userInfo.role && !to.meta.role.includes(userInfo.role)) {
    alert("No permission to access!");
    next(from.path);
    return;
  }

  next();
});

export default router;
