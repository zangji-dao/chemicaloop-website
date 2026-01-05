<template>
  <div id="app">
    <!-- 路由加载状态提示 -->
    <div
      v-if="isRouteLoading"
      style="display: flex; justify-content: center; align-items: center; min-height: 100vh"np
    >
      <div style="font-size: 1.2rem; color: var(--primary-color)">Loading...</div>
    </div>
    <!-- 路由视图 -->
    <router-view v-else />

    <!-- 预留全局组件挂载点 -->
    <div class="global-components-container"></div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
// 路由加载状态标识
const isRouteLoading = ref(false)

// 监听路由开始跳转，显示加载状态
router.beforeEach((to, from, next) => {
  isRouteLoading.value = true
  next()
})

// 监听路由跳转完成，隐藏加载状态（延迟避免闪屏）
router.afterEach(() => {
  setTimeout(() => {
    isRouteLoading.value = false
  }, 200)
})
</script>

<style>
/* 根元素全局 CSS 变量 */
:root {
  /* 主题颜色 */
  --primary-color: #004a99;
  --secondary-color: #2c3e50;
  --text-color: #333;
  --text-color-light: #666;
  --background-color: #ffffff;
  --background-color-gray: #f5f7fa;
  --error-color: #e74c3c;
  --success-color: #2ecc71;

  /* 字体大小 */
  --font-xs: 0.875rem;
  --font-sm: 1rem;
  --font-md: 1.125rem;
  --font-lg: 1.25rem;
  --font-xl: 1.5rem;
  --font-xxl: 2rem;

  /* 间距大小 */
  --spacing-xs: 0.5rem;
  --spacing-sm: 1rem;
  --spacing-md: 1.5rem;
  --spacing-lg: 2rem;
  --spacing-xl: 3rem;

  /* 其他样式 */
  --border-radius: 4px;
  --transition-duration: 0.2s;
}

/* 全局基础样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

[dir='rtl'] {
  direction: rtl;
  text-align: right;
}

[dir='ltr'] {
  direction: ltr;
  text-align: left;
}

html,
body {
  font-family: 'Inter', sans-serif, Arial, Helvetica, sans-serif;
  font-size: 16px;
  color: var(--text-color);
  background-color: var(--background-color);
  min-height: 100vh;
  overflow-x: hidden;
}

ul,
ol {
  list-style: none;
}

a {
  text-decoration: none;
  color: inherit;
  transition: color var(--transition-duration) ease;
}

a:hover {
  color: var(--primary-color);
}

/* 全局滚动条样式（Webkit 内核） */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: var(--background-color-gray);
  border-radius: var(--border-radius);
}

::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: var(--border-radius);
  transition: background var(--transition-duration) ease;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--primary-color);
}

/* 全局滚动条样式（Firefox 内核） */
* {
  scrollbar-width: thin;
  scrollbar-color: #c1c1c1 var(--background-color-gray);
}

/* 全局组件容器样式 */
.global-components-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* 不阻挡页面点击事件 */
  z-index: 9999; /* 确保全局组件在最上层 */
}
</style>
