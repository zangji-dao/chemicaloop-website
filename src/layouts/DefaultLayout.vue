<template>
  <div class="app-layout">
    <!-- 头部导航 -->
    <header class="app-header">
      <div class="header-left">
        <!-- Logo 点击跳回首页 -->
        <router-link to="/" class="logo-link">
          <h1 class="logo">{{ $t('nav.home') }}</h1>
        </router-link>
        <nav class="nav-list">
          <router-link to="/">{{ $t('nav.home') }}</router-link>
          <router-link to="/products">{{ $t('nav.products') }}</router-link>
          <router-link to="/about">{{ $t('nav.about') }}</router-link>
          <router-link to="/contact">{{ $t('nav.contact') }}</router-link>
        </nav>
        <!-- 移动端汉堡菜单（预留，需配合JS实现折叠） -->
        <div class="hamburger" v-show="isMobile">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
      <div class="header-right">
        <!-- 全局语言选择器 -->
        <LangSelector />
      </div>
    </header>

    <!-- 页面内容 -->
    <main class="app-main">
      <router-view />
    </main>

    <!-- 底部 -->
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
import { ref, onMounted, onUnmounted } from 'vue'

// 移动端标识（可选：用于控制汉堡菜单显示/隐藏）
const isMobile = ref(window.innerWidth <= 576)

// 监听窗口大小变化，更新移动端标识
const handleResize = () => {
  isMobile.value = window.innerWidth <= 576
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.app-layout {
  /* 布局 CSS 变量 */
  --header-height: 60px;
  --header-height-mobile: 56px;
  --primary-color: #004a99;
  --text-color: #333;
  --text-color-light: #666;
  --border-color: #e5e7eb;
  --spacing: 20px;
  --spacing-mobile: 10px;
  --gap-nav: 20px;
  --gap-nav-mobile: 12px;
  --transition-duration: 0.2s;

  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 var(--spacing);
  height: var(--header-height);
  border-bottom: 1px solid var(--border-color);
  overflow: hidden;
  transition: border-color var(--transition-duration) ease;
}

.header-left {
  display: flex;
  align-items: center;
  gap: var(--spacing);
}

/* Logo 样式 */
.logo-link {
  text-decoration: none;
  color: inherit;
}

.logo {
  font-size: 1.2rem;
  font-weight: 700;
  white-space: nowrap;
  margin: 0;
}

/* 导航列表样式 */
.nav-list {
  display: flex;
  gap: var(--gap-nav);
}

.nav-list a {
  text-decoration: none;
  color: var(--text-color);
  transition:
    color var(--transition-duration) ease,
    border-bottom var(--transition-duration) ease;
  border-bottom: 2px solid transparent;
  white-space: nowrap;
}

/* 路由激活样式 */
.nav-list a.router-link-exact-active {
  color: var(--primary-color);
  border-bottom: 2px solid var(--primary-color);
}

/* 导航 hover 样式 */
.nav-list a:hover {
  color: var(--primary-color);
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
  background-color: var(--text-color);
  border-radius: 1px;
  transition: transform var(--transition-duration) ease;
}

.app-main {
  flex: 1;
  padding: var(--spacing);
}

.app-footer {
  padding: var(--spacing);
  text-align: center;
  border-top: 1px solid var(--border-color);
  transition: border-color var(--transition-duration) ease;
  color: var(--text-color-light);
}

.footer-links {
  display: flex;
  justify-content: center;
  gap: var(--gap-nav);
  margin-top: 10px;
}

.footer-links a {
  text-decoration: none;
  color: inherit;
  transition: color var(--transition-duration) ease;
}

.footer-links a:hover {
  color: var(--primary-color);
}

/* RTL 布局适配 */
[dir='rtl'] .app-header {
  flex-direction: row-reverse;
}

[dir='rtl'] .nav-list {
  flex-direction: row-reverse;
}

[dir='rtl'] .footer-links {
  flex-direction: row-reverse;
}

/* 移动端适配（768px 以下） */
@media (max-width: 768px) {
  .app-header {
    padding: 0 var(--spacing-mobile);
    height: var(--header-height-mobile);
  }

  .header-left {
    gap: var(--spacing-mobile);
  }

  .nav-list {
    gap: var(--gap-nav-mobile);
    font-size: 0.9rem;
  }

  .app-main {
    padding: var(--spacing-mobile);
  }

  .app-footer {
    padding: 15px var(--spacing-mobile);
    font-size: 0.9rem;
  }
}

/* 小屏适配（576px 以下，隐藏横向导航，显示汉堡菜单） */
@media (max-width: 576px) {
  .nav-list {
    display: none;
  }

  .hamburger {
    display: flex;
  }
}
</style>
