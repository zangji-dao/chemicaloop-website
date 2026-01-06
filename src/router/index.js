import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/components/Layout.vue' // 你的布局组件

// 对应你的页面文件名（AboutPage.vue、ContactPage.vue 等）
import HomePage from '@/views/HomePage.vue'
import AboutPage from '@/views/AboutPage.vue'
import ProductsPage from '@/views/ProductsPage.vue'
import NewsPage from '@/views/NewsPage.vue'
import ContactPage from '@/views/ContactPage.vue'

const routes = [
  {
    path: '/',
    component: Layout, // 父组件用 Layout 布局
    children: [
      // 子路由对应你的页面
      { path: '', component: HomePage }, // 访问 / → 渲染 HomePage.vue
      { path: 'about', component: AboutPage }, // 访问 /about → 渲染 AboutPage.vue
      { path: 'products', component: ProductsPage }, // 访问 /products → 渲染 ProductsPage.vue
      { path: 'news', component: NewsPage }, // 访问 /news → 渲染 NewsPage.vue
      { path: 'contact', component: ContactPage }, // 访问 /contact → 渲染 ContactPage.vue
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
