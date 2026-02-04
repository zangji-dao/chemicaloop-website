<!-- src/layouts/DefaultLayout.vue -->
<template>
  <!-- 布局根容器：控制整体垂直排布 & 占满视口高度 -->
  <div class="default-layout">
    <!-- 头部导航组件：全局公共导航 -->
    <AppMainNavbar />
    <!-- 主内容渲染区：所有业务页面通过路由渲染到此处 -->
    <main class="layout-content">
      <router-view />
    </main>
    <!-- 尾部组件：全局公共尾部 -->
    <AppFooter />
    <!-- 浮动工具组件：全局悬浮元素（如回到顶部、全局弹窗等） -->
    <FloatingTools />
  </div>
</template>

<script setup>
// 导入全局布局组件（路径需匹配实际文件位置）
import AppMainNavbar from '@/components/AppMainNavbar.vue' // 头部导航
import AppFooter from '@/components/AppFooter.vue'         // 尾部
import FloatingTools from '@/components/FloatingTools.vue' // 浮动工具
</script>

<style scoped>
/* 布局容器核心样式：保证页面占满视口 + 垂直排布 */
.default-layout {
  min-height: 100vh; /* 占满屏幕高度，避免尾部上移 */
  display: flex;
  flex-direction: column; /* 头部→内容→尾部 垂直排列 */
  overflow-x: hidden; /* 禁止横向滚动 */
}

/* 主内容区：自动填充头部/尾部外的剩余空间 */
.layout-content {
  flex: 1; /* 核心：占满剩余高度 */
  padding: 0px; /* 通用内边距，所有业务页面生效 */
  box-sizing: border-box; /* 防止内边距撑大容器 */
  position: relative;
   overflow-x: hidden;
  overflow-y: visible;

}
</style>
