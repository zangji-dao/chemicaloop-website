<template>
  <div class="app-layout">
    <!-- 头部导航：单行结构（Logo+导航链接+语言选择器+汉堡菜单） -->
    <header class="app-header">
      <div class="header-left">
        <router-link to="/" class="logo-link">
          <h1 class="logo">{{ $t('nav.home') }}</h1>
        </router-link>
        <nav class="nav-list">
          <router-link to="/" class="nav-link">{{ $t('nav.home') }}</router-link>
          <router-link to="/products" class="nav-link">{{ $t('nav.products') }}</router-link>
          <router-link to="/about" class="nav-link">{{ $t('nav.about') }}</router-link>
          <router-link to="/contact" class="nav-link">{{ $t('nav.contact') }}</router-link>
        </nav>
        <!-- 移动端汉堡菜单 -->
        <div class="hamburger" v-if="isMobile" @click="toggleNav" :class="{ active: isNavOpen }">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
      <div class="header-right">
        <LangSelector />
        <!-- 语言选择器组件（确保已引入） -->
      </div>
    </header>

    <!-- 移动端展开导航（默认隐藏） -->
    <div class="mobile-nav" v-show="isNavOpen">
      <nav class="mobile-nav-list">
        <router-link to="/" @click="toggleNav" class="mobile-nav-link">{{
          $t('nav.home')
        }}</router-link>
        <router-link to="/products" @click="toggleNav" class="mobile-nav-link">{{
          $t('nav.products')
        }}</router-link>
        <router-link to="/about" @click="toggleNav" class="mobile-nav-link">{{
          $t('nav.about')
        }}</router-link>
        <router-link to="/contact" @click="toggleNav" class="mobile-nav-link">{{
          $t('nav.contact')
        }}</router-link>
      </nav>
    </div>

    <!-- 主内容区：关键！确保Banner与导航无缝衔接 -->
    <main class="app-main">
      <router-view />
      <!-- 所有页面（首页、产品页等）渲染到这里 -->
    </main>

    <!-- 页脚 -->
    <footer class="app-footer">
      <div class="footer-copyright">{{ $t('footer.copyright') }}</div>
      <div class="footer-links">
        <a>{{ $t('footer.privacy') }}</a>
        <a>{{ $t('footer.terms') }}</a>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
// 确保引入 LangSelector 组件（路径根据你的项目调整）
import LangSelector from '@/components/LangSelector.vue'

// 移动端判断（≤576px 显示汉堡菜单）
const isMobile = computed(() => {
  if (typeof window === 'undefined') return false // 兼容 SSR
  return window.innerWidth <= 576
})

// 汉堡菜单展开/收起状态
const isNavOpen = ref(false)
const toggleNav = () => {
  isNavOpen.value = !isNavOpen.value
}

// 窗口缩放时自动关闭移动端导航
const handleResize = () => {
  if (window.innerWidth > 576) {
    isNavOpen.value = false
  }
}

// 监听窗口大小变化
onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
/* 全局重置：清除默认间距，确保无缝衔接 */
* {
  margin: 0 !important;
  padding: 0 !important;
  box-sizing: border-box !important;
}

/* 布局容器：垂直排列，占满全屏高度 */
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow-x: hidden;
}

/* 导航栏：单行布局，无多余间距 */
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px !important; /* 仅左右内边距，上下为0 */
  height: 60px !important; /* 固定高度，确保与Banner衔接 */
  background: #fff; /* 不透明背景，避免Banner穿透 */
  border-bottom: 1px solid #e5e7eb; /* 可选：底部浅边框，不影响间距 */
  z-index: 999; /* 导航栏在上方，不被覆盖 */
}

/* 导航栏左侧（Logo+导航链接） */
.header-left {
  display: flex;
  align-items: center;
  gap: 25px; /* Logo与导航链接的间距 */
}

/* Logo样式 */
.logo-link {
  text-decoration: none;
  color: #333;
  display: flex;
  align-items: center;
}
.logo {
  font-size: 1.3rem;
  font-weight: 700;
  white-space: nowrap;
}

/* 桌面端导航链接 */
.nav-list {
  display: flex;
  align-items: center;
  gap: 20px; /* 导航链接之间的间距 */
}
.nav-link {
  text-decoration: none;
  color: #333;
  font-size: 15px;
  transition: color 0.2s;
  padding: 4px 0 !important;
  border-bottom: 2px solid transparent;
}
/* 激活链接样式 */
.nav-link.router-link-exact-active {
  color: #004a99;
  border-bottom: 2px solid #004a99;
}
.nav-link:hover {
  color: #004a99;
}

/* 汉堡菜单样式（移动端） */
.hamburger {
  display: none;
  width: 24px;
  height: 24px;
  flex-direction: column;
  justify-content: center;
  gap: 4px;
  cursor: pointer;
}
.hamburger span {
  width: 100%;
  height: 2px;
  background: #333;
  transition:
    transform 0.2s,
    opacity 0.2s;
}
/* 汉堡菜单激活状态（变成叉号） */
.hamburger.active span:nth-child(1) {
  transform: translateY(6px) rotate(45deg);
}
.hamburger.active span:nth-child(2) {
  opacity: 0;
}
.hamburger.active span:nth-child(3) {
  transform: translateY(-6px) rotate(-45deg);
}

/* 导航栏右侧（语言选择器） */
.header-right {
  display: flex;
  align-items: center;
}

/* 移动端展开导航样式 */
.mobile-nav {
  position: fixed;
  top: 60px; /* 与导航栏高度一致，紧贴下方 */
  left: 0;
  width: 100%;
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  padding: 15px 20px !important;
  z-index: 998;
}
.mobile-nav-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
.mobile-nav-link {
  text-decoration: none;
  color: #333;
  font-size: 15px;
  padding: 8px 0 !important;
  border-bottom: 1px solid #f5f5f5;
}
.mobile-nav-link.router-link-exact-active {
  color: #004a99;
  border-bottom-color: #004a99;
}

/* 主内容区：关键！无顶部间距，确保Banner紧贴导航 */
.app-main {
  flex: 1;
  width: 100%;
  background: #f9f9f9;
}

/* 页脚样式 */
.app-footer {
  padding: 20px !important;
  text-align: center;
  border-top: 1px solid #e5e7eb;
  color: #666;
  background: #fff;
}
.footer-links {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 10px !important;
}
.footer-links a {
  text-decoration: none;
  color: #666;
  transition: color 0.2s;
}
.footer-links a:hover {
  color: #004a99;
}

/* 响应式适配 */
@media (max-width: 768px) {
  .app-header {
    padding: 0 10px !important;
    height: 56px !important;
  }
  .header-left {
    gap: 15px;
  }
  .nav-list {
    gap: 15px;
    font-size: 0.9rem;
  }
  .mobile-nav {
    top: 56px !important; /* 适配移动端导航栏高度 */
  }
}

@media (max-width: 576px) {
  .nav-list {
    display: none; /* 隐藏桌面端导航链接 */
  }
  .hamburger {
    display: flex; /* 显示汉堡菜单 */
  }
}
</style>
