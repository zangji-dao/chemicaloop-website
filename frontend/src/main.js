import { createApp } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import App from './App.vue'
import i18n from './i18n'
import LangSelector from './components/LangSelector.vue'
import DefaultLayout from './layouts/DefaultLayout.vue'

// 匹配实际views目录的路由配置
const routes = [
  {
    path: '/',
    component: DefaultLayout,
    children: [
      { path: '', component: () => import('./views/HomePage.vue') },
      { path: '/products', component: () => import('./views/ProductsPage.vue') },
      { path: '/about', component: () => import('./views/AboutPage.vue') },
      { path: '/contact', component: () => import('./views/ContactPage.vue') },
      { path: '/news', component: () => import('./views/NewsPage.vue') },
    ],
  },
  // 404 兜底路由
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
    // 若有 404 页面，替换为：
    // component: () => import('./views/NotFoundPage.vue')
  },
]

const router = createRouter({
  // 适配 Vite 基础路径
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  // 路由滚动行为
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  },
})

// 创建App并全局配置
const app = createApp(App)

// 全局错误处理器
app.config.errorHandler = (err, instance, info) => {
  console.error('全局运行时错误：', err)
  console.error('错误组件实例：', instance)
  console.error('错误详情：', info)
  // 可选：用户友好提示
  // if (typeof window !== 'undefined') {
  //   alert('系统异常，请刷新页面重试！')
  // }
}

// 全局注入依赖
app.use(i18n)
app.use(router)

// 全局注册组件（可选：添加 App 前缀避免冲突）
app.component('LangSelector', LangSelector)
app.component('DefaultLayout', DefaultLayout)
// 带前缀写法：
// app.component('AppLangSelector', LangSelector)
// app.component('AppDefaultLayout', DefaultLayout)

// 等待路由就绪后挂载（可选，提升稳定性）
router.isReady().then(() => {
  app.mount('#app')
})

// 若不需要等待路由就绪，直接挂载：
// app.mount('#app')
