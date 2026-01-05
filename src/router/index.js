import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    redirect: '/home',
  },
  {
    path: '/home',
    name: 'home',
    component: () => import('../views/HomePage.vue'),
  },
  {
    path: '/about',
    name: 'about',
    component: () => import('../views/AboutPage.vue'),
  },
  {
    path: '/products',
    name: 'products',
    component: () => import('../views/ProductsPage.vue'),
  },
  {
    path: '/news',
    name: 'news',
    component: () => import('../views/NewsPage.vue'),
  },
  {
    path: '/contact',
    name: 'contact',
    component: () => import('../views/ContactPage.vue'),
  },
  // 404 兜底路由
  {
    path: '/:pathMatch(.*)*',
    redirect: '/home',
    // 若有 404 页面，可替换为：
    // component: () => import('../views/NotFoundPage.vue')
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  // 滚动行为配置
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  },
})

// 全局前置守卫（可选，按需启用）
router.beforeEach((to, from, next) => {
  // 可添加权限控制、加载提示等逻辑
  next()
})

export default router
