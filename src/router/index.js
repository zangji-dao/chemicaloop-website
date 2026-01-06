import { createRouter, createWebHistory } from 'vue-router'
// 引入正确命名的布局组件
import DefaultLayout from '@/layouts/DefaultLayout.vue'

// 按需引入页面组件（避免首屏加载过慢）
const Home = () => import('@/views/Home.vue')
const Products = () => import('@/views/Products.vue')
const About = () => import('@/views/About.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      // 根路由路径
      path: '/',
      // 布局路由名称（规范命名：大驼峰+Layout）
      name: 'DefaultLayout',
      // 挂载默认布局组件
      component: DefaultLayout,
      // 子路由：所有页面都渲染到DefaultLayout的<router-view>中
      children: [
        {
          path: '', // 根路径匹配首页
          name: 'Home', // 首页路由名称
          component: Home
        },
        {
          path: 'products', // 产品页路径
          name: 'Products', // 产品页路由名称
          component: Products
        },
        {
          path: 'about', // 关于页路径
          name: 'About', // 关于页路由名称
          component: About
        }
      ]
    }
  ]
})

export default router
