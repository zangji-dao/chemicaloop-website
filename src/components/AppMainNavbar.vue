<template>
  <div class="app-main-navbar">
    <!-- 1. PC端Logo（固定定位） -->
    <div class="pc-logo-standalone" ref="logoRef">
      <img
        :src="isScrolled ? blueLogo : whiteLogo"
        alt="Chemicaloop Logo"
        class="pc-logo-img"
        @error="handleLogoError"
      />
    </div>

    <!-- 2. 移动端顶部栏 -->
    <div class="mobile-top-bar">
      <div class="mobile-top-bar-inner">
        <!-- 左侧：Logo -->
        <div class="mobile-logo-container">
          <img
            :src="whiteLogo"
            alt="Chemicaloop Logo"
            class="mobile-logo-img"
            @error="handleLogoError"
          />
        </div>

        <!-- 中间：搜索框 -->
        <div class="mobile-search-wrap">
          <div class="mobile-search-input-wrap" @click="focusSearchInput">
            <input
              ref="searchInputRef"
              class="mobile-search-input"
              type="text"
              placeholder="搜索..."
              @click.stop
            />
            <button class="mobile-search-btn" @click.stop="handleSearchClick">
              <img src="@/assets/icons/search-dark.png" alt="Search" class="mobile-search-icon" @error="handleIconError" />
            </button>
          </div>
        </div>

        <!-- 右侧：语言选择器 + Menu按钮（移动端仅这一个LangSelector） -->
        <div class="mobile-right-actions">
          <LangSelector class="mobile-lang-selector" />
          <button class="mobile-menu-btn" @click.stop="handleMenuClick">
            <img src="@/assets/icons/menu-icon.png" alt="Mobile Menu" class="mobile-menu-icon-img" @error="handleIconError" />
          </button>
        </div>
      </div>
    </div>

    <!-- 3. 移动端菜单 -->
    <div class="mobile-nav-menu" v-show="isMobileMenuOpen">
      <ul class="mobile-nav-list">
        <li @click="closeMobileMenu">
          <router-link to="/home" class="mobile-nav-link" active-class="active">HOME</router-link>
        </li>
        <li @click="closeMobileMenu">
          <router-link to="/about" class="mobile-nav-link" active-class="active">ABOUT US</router-link>
        </li>
        <li @click="closeMobileMenu">
          <router-link to="/products" class="mobile-nav-link" active-class="active">PRODUCTS</router-link>
        </li>
        <li @click="closeMobileMenu">
          <router-link to="/news" class="mobile-nav-link" active-class="active">NEWS</router-link>
        </li>
        <li @click="closeMobileMenu">
          <router-link to="/contact" class="mobile-nav-link" active-class="active">CONTACT US</router-link>
        </li>
      </ul>
    </div>

    <!-- 4. 移动端菜单遮罩 -->
    <div class="mobile-mask" v-show="isMobileMenuOpen" @click="closeMobileMenu"></div>

    <!-- 5. PC端导航栏 -->
    <div class="pc-nav-wrapper">
      <div class="pc-top-header">
        <div class="pc-top-header-inner">
          <!-- 右侧：联系方式（社交+电话/邮箱） + 搜索框 + 语言选择器（核心修改） -->
          <div class="pc-right-area">
            <!-- 整合：社交图标 + 电话/邮箱 作为完整的联系方式区域 -->
            <div class="pc-contact-social-wrap">
              <!-- 社交图标 -->
              <div class="pc-social-links">
                <a href="#" class="pc-social-icon" target="_blank" rel="noopener">
                  <img src="@/assets/icons/x.png" alt="X" class="pc-icon-img" @error="handleIconError" />
                </a>
                <span>|</span>
                <a href="#" class="pc-social-icon" target="_blank" rel="noopener">
                  <img src="@/assets/icons/linkedin.png" alt="LinkedIn" class="pc-icon-img" @error="handleIconError" />
                </a>
                <span>|</span>
                <a href="#" class="pc-social-icon" target="_blank" rel="noopener">
                  <img src="@/assets/icons/facebook.png" alt="Facebook" class="pc-icon-img" @error="handleIconError" />
                </a>
                <span>|</span>
                <a href="#" class="pc-social-icon" target="_blank" rel="noopener">
                  <img src="@/assets/icons/instagram.png" alt="Instagram" class="pc-icon-img" @error="handleIconError" />
                </a>
                <span>|</span>
                <a href="#" class="pc-social-icon" target="_blank" rel="noopener">
                  <img src="@/assets/icons/youtube.png" alt="YouTube" class="pc-icon-img" @error="handleIconError" />
                </a>
                <span>|</span>
              </div>
              <!-- 电话/邮箱 -->
              <div class="pc-contact-info">
                <a href="tel:+86.15585606688" class="pc-contact-text">+86.15585606688</a>
                <span>|</span>
                <a href="mailto:support@chemicaloop.com" class="pc-contact-text">support@chemicaloop.com</a>
              </div>
            </div>

            <!-- 搜索框 + 语言选择器 -->
            <div class="pc-search-lang-wrap">
              <div class="pc-product-search">
                <input type="text" placeholder="Product Search" class="pc-search-input" />
                <button class="pc-search-btn" @click="handlePcSearchClick">
                  <img src="@/assets/icons/search-white.png" alt="Search Icon" class="global-search-icon" @error="handleIconError" />
                </button>
              </div>
              <LangSelector class="pc-lang-selector" />
            </div>
          </div>
        </div>
      </div>

      <!-- PC端主导航 -->
      <div class="pc-main-nav" :class="{ 'is-scrolled': isScrolled }">
        <div class="pc-main-nav-inner">
          <ul class="pc-nav-menu">
            <li class="nav-item" :class="{ 'nav-active': $route.path === '/home' }">
              <router-link to="/home" class="pc-nav-link" active-class="link-active">HOME</router-link>
            </li>
            <li class="nav-item" :class="{ 'nav-active': $route.path === '/about' }">
              <router-link to="/about" class="pc-nav-link" active-class="link-active">ABOUT US</router-link>
            </li>
            <li class="nav-item" :class="{ 'nav-active': $route.path === '/products' }">
              <router-link to="/products" class="pc-nav-link" active-class="link-active">PRODUCTS</router-link>
            </li>
            <li class="nav-item" :class="{ 'nav-active': $route.path === '/news' }">
              <router-link to="/news" class="pc-nav-link" active-class="link-active">NEWS</router-link>
            </li>
            <li class="nav-item" :class="{ 'nav-active': $route.path === '/contact' }">
              <router-link to="/contact" class="pc-nav-link" active-class="link-active">CONTACT US</router-link>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRoute } from 'vue-router'
// 仅在Navbar中导入一次LangSelector
import LangSelector from '@/components/LangSelector.vue'

// 资源路径适配Vite
const whiteLogo = ref(new URL('@/assets/logo-white-bg.png', import.meta.url).href)
const blueLogo = ref(new URL('@/assets/logo-blue-bg.png', import.meta.url).href)

// 核心状态
const route = useRoute()
const isScrolled = ref(false)
const isMobileMenuOpen = ref(false)
const logoRef = ref(null)
const searchInputRef = ref(null)

// 常量
const PC_MIN_WIDTH_THRESHOLD = 768
let scrollTimer = null

// 图片加载失败兜底
const handleLogoError = (e) => {
  e.target.src = 'https://via.placeholder.com/120x60/004a99/ffffff?text=CHEMICALOOP'
}
const handleIconError = (e) => {
  e.target.src = 'https://via.placeholder.com/16x16/ffffff/004a99?text=icon'
}

// 搜索框聚焦
const focusSearchInput = () => {
  searchInputRef.value?.focus()
}

// 滚动防抖
const handleScroll = () => {
  if (typeof window !== 'undefined') {
    isScrolled.value = window.scrollY > 50
  }
}
const debouncedScroll = () => {
  clearTimeout(scrollTimer)
  scrollTimer = setTimeout(handleScroll, 30)
}

// 移动端菜单控制
const handleMenuClick = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
  if (typeof document !== 'undefined') {
    document.body.style.overflow = isMobileMenuOpen.value ? 'hidden' : 'auto'
  }
}
const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
  if (typeof document !== 'undefined') {
    document.body.style.overflow = 'auto'
  }
}

// 搜索功能
const handleSearchClick = () => {
  const value = searchInputRef.value?.value || ''
  console.log('移动端搜索内容：', value)
}
const handlePcSearchClick = () => {
  const input = document.querySelector('.pc-search-input')
  const value = input?.value || ''
  console.log('PC端搜索内容：', value)
}

// 路由监听
watch(() => route.path, () => {
  closeMobileMenu()
  handleScroll()
}, { immediate: true })

// 生命周期
onMounted(() => {
  nextTick(handleScroll)
  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', debouncedScroll)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', debouncedScroll)
  }
  clearTimeout(scrollTimer)
  if (typeof document !== 'undefined') {
    document.body.style.overflow = 'auto'
  }
})
</script>

<style lang="scss" scoped>
/* 全局字体 */
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Inter:wght@300;400;600;700&display=swap');

// 全局变量
$main-sans-font: 'Inter', sans-serif;
$primary-color: #004a99;
$white: #ffffff;
$light-gray: #f5f5f5;
$dark-gray: #333;
$secondary-color: #2c3e50;
$nav-height: 80px;
$pc-nav-top-height: 60px;
$pc-nav-main-height: 50px;
$search-wrap-height: 40px;
$gap-sm: 0.5rem;
$gap-md: 1rem;
$transition-duration: 0.3s;
$transition-timing: ease;

/* 全局重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 外层容器 */
.app-main-navbar {
  width: 100%;
  z-index: 99999 !important;
  font-family: $main-sans-font;
  line-height: 1;
  position: relative;
}

/* 1. PC端Logo */
.pc-logo-standalone {
  position: fixed;
  top: 0;
  left: 20px;
  z-index: 99999;
  padding: 10px 0;
  height: fit-content;
  line-height: 0;
  display: block;

  .pc-logo-img {
    width: clamp(80px, 8vw, 160px);
    height: auto;
    display: block !important;
    object-fit: contain;
    transition: all $transition-duration $transition-timing;
  }

  @media (max-width: 1078px) and (min-width: 768px) {
    left: 10px;
    .pc-logo-img {
      width: clamp(60px, 6vw, 120px);
    }
  }
  @media (max-width: 767px) {
    display: none !important;
  }
}

/* 2. 移动端顶部栏 */
.mobile-top-bar {
  display: none !important;
  align-items: center;
  background-color: $white;
  height: $nav-height;
  border-bottom: 1px solid #eee;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 99999;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  padding: 0 15px;

  .mobile-top-bar-inner {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $gap-sm;
  }

  .mobile-logo-container {
    flex-shrink: 0;
    width: 80px;

    .mobile-logo-img {
      height: 50px;
      display: block !important;
      object-fit: contain;
    }
  }

  .mobile-search-wrap {
    flex: 1;
    display: flex;
    align-items: center;

    .mobile-search-input-wrap {
      width: 100%;
      height: $search-wrap-height;
      border: 1px solid #aaa;
      border-radius: 8px;
      background-color: $light-gray;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding: 0 12px;
      position: relative;
    }

    .mobile-search-input {
      position: absolute;
      left: 12px;
      top: 0;
      height: 100%;
      width: calc(100% - 40px);
      border: none;
      background: transparent;
      outline: none;
      font-size: 14px;
      color: $dark-gray;

      &::placeholder {
        color: #999;
      }
    }

    .mobile-search-btn {
      width: 28px;
      height: 28px;
      border: none;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 1;

      .mobile-search-icon {
        height: 20px;
        width: 20px;
        display: block;
        object-fit: contain;
      }
    }
  }

  /* 移动端右侧操作区：语言选择器 + 菜单按钮 */
  .mobile-right-actions {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    flex-shrink: 0;
  }

  /* 移动端语言选择器（仅一个） */
  .mobile-lang-selector {
    :deep(.lang-selector-container) {
      .lang-trigger {
        padding: 0.3rem 0.4rem;
        gap: 0.2rem;
        background-color: rgba(0, 74, 153, 0.1);
        border: 1px solid transparent;
        border-radius: 4px;

        .lang-flag {
          width: 20px;
          height: 14px;
          object-fit: cover;
          border-radius: 2px;
          border: 1px solid #e0e0e0;
        }

        .lang-arrow {
          font-size: 0.7rem;
          color: $primary-color;
        }
      }

      .lang-dropdown {
        width: 56px;
        left: auto;
        right: 0;
        top: calc(100% + 2px);
        background-color: $white;
        border: 1px solid $primary-color;

        .lang-option {
          justify-content: center;
          padding: 0.4rem 0;

          &:hover, &.selected {
            background-color: rgba(0, 74, 153, 0.1);
          }

          .lang-flag {
            width: 20px;
            height: 14px;
            border: 1px solid #e0e0e0;
          }
        }
      }
    }
  }

  .mobile-menu-btn {
    width: 40px;
    height: 40px;
    border: none;
    background: transparent;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;

    .mobile-menu-icon-img {
      height: 24px;
      width: 24px;
      display: block;
      object-fit: contain;
    }
  }

  @media (max-width: 767px) {
    display: flex !important;
  }
}

/* 3. 移动端菜单 */
.mobile-nav-menu {
  position: fixed;
  top: $nav-height;
  right: 0;
  width: 260px;
  height: calc(100vh - $nav-height);
  background: $white;
  z-index: 9999;
  box-shadow: -2px 0 15px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  display: none;

  &[v-show="true"] {
    display: block;
  }

  .mobile-nav-list {
    list-style: none;
    padding: 20px 0;
  }

  .mobile-nav-list li {
    border-bottom: 1px solid $light-gray;

    .mobile-nav-link {
      display: block;
      padding: 15px 20px;
      color: $dark-gray;
      text-decoration: none;
      font-size: 16px;
      transition: color $transition-duration $transition-timing;

      &:hover, &.active {
        color: $primary-color;
        background-color: rgba(0, 74, 153, 0.05);
      }
    }
  }
}

.mobile-mask {
  position: fixed;
  top: $nav-height;
  left: 0;
  width: 100%;
  height: calc(100vh - $nav-height);
  background: rgba(0, 0, 0, 0.5);
  z-index: 9998;
  display: none;

  &[v-show="true"] {
    display: block;
  }
}

/* 4. PC端导航栏 */
.pc-nav-wrapper {
  width: 100%;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
  font-family: $main-sans-font;
  display: block !important;

  @media (max-width: 767px) {
    display: none !important;
  }
}

.pc-top-header {
  background-color: $primary-color;
  height: $pc-nav-top-height;
  display: flex;
  align-items: center;
  color: $white;
  padding: 0 20px;
  transition: all $transition-duration $transition-timing;
  overflow: visible;

  .pc-top-header-inner {
    width: 100%;
    max-width: 1920px;
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: flex-end; /* 整体右对齐（Logo已固定左侧） */
    gap: $gap-md;
    flex-wrap: wrap;
  }

  /* 核心：社交+联系方式 整合容器 */
  .pc-contact-social-wrap {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    flex-shrink: 1;
    flex-wrap: wrap;
  }

  /* 社交图标样式（整合后） */
  .pc-social-links {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    flex-shrink: 1;
    overflow: visible;

    .pc-social-icon {
      transition: transform 0.2s $transition-timing;
      line-height: 0;

      &:hover {
        transform: scale(1.1);
      }

      .pc-icon-img {
        height: clamp(12px, 1.2vw, 16px);
        width: auto;
        display: block !important;
        filter: brightness(0) invert(1);
      }
    }

    span {
      color: $white;
      opacity: 0.9;
      margin: 0 2px;
      font-size: clamp(9px, 0.7vw, 12px);
    }

    @media (max-width: 1078px) and (min-width: 768px) {
      gap: 0.5rem;
    }
  }

  /* 电话/邮箱样式（整合后） */
  .pc-contact-info {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    flex-shrink: 1;

    .pc-contact-text {
      color: $white;
      text-decoration: none;
      margin: 0 2px;
      font-size: clamp(9px, 0.7vw, 12px);
      white-space: nowrap;
      overflow: visible;
    }

    span {
      color: $white;
      opacity: 0.9;
      margin: 0 2px;
      font-size: clamp(9px, 0.7vw, 12px);
    }
  }

  /* 右侧整体容器（联系方式+搜索+语言） */
  .pc-right-area {
    display: flex;
    align-items: center;
    gap: $gap-md;
    flex-shrink: 0;
    flex-wrap: wrap;
  }

  .pc-search-lang-wrap {
    display: flex;
    align-items: center;
    gap: $gap-sm;
    flex-shrink: 0;
  }

  .pc-product-search {
    width: clamp(180px, 14vw, 280px);
    height: clamp(32px, 2.5vw, 38px);
    display: flex;
    align-items: center;
    background-color: rgba(255, 255, 255, 0.2);
    border: 1px solid $white;
    border-radius: 2px;
    position: relative;
    overflow: hidden;

    .pc-search-input {
      flex: 1;
      border: none;
      background: transparent;
      outline: none;
      padding: 0 clamp(8px, 0.8vw, 12px);
      color: $white;
      font-size: clamp(12px, 1vw, 14px);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .pc-search-input::placeholder {
      color: rgba(255, 255, 255, 0.7);
    }

    .pc-search-btn {
      width: clamp(32px, 2.5vw, 38px);
      height: 100%;
      border: none;
      background: rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;

      .global-search-icon {
        height: clamp(14px, 1.2vw, 16px);
        width: auto;
        display: block !important;
        object-fit: contain;
      }
    }
  }

  /* PC端语言选择器（仅一个） */
  .pc-lang-selector {
    :deep(.lang-selector-container) {
      .lang-trigger {
        padding: 0.3rem 0.5rem;
        gap: 0.2rem;
        background-color: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 4px;

        .lang-flag {
          width: 20px;
          height: 14px;
          object-fit: cover;
          border-radius: 2px;
          border: 1px solid rgba(255, 255, 255, 0.5);
        }

        .lang-arrow {
          font-size: 0.7rem;
          color: $white;
        }
      }

      .lang-dropdown {
        width: 56px;
        top: calc(100% + 2px);
        left: 0;
        background-color: $secondary-color;
        border: 1px solid $primary-color;

        .lang-option {
          justify-content: center;
          padding: 0.4rem 0;

          &:hover, &.selected {
            background-color: $primary-color;
          }

          .lang-flag {
            width: 20px;
            height: 14px;
            border: 1px solid $white;
          }
        }
      }

      .pc-main-nav.is-scrolled & :deep(.lang-trigger) {
        background-color: rgba(0, 74, 153, 0.1);
        border-color: rgba(0, 74, 153, 0.2);

        .lang-arrow {
          color: $primary-color;
        }
        .lang-flag {
          border-color: rgba(0, 74, 153, 0.2);
        }
      }
    }
  }
}

.pc-main-nav {
  background-color: transparent;
  height: $pc-nav-main-height;
  display: flex;
  align-items: center;
  padding: 0 20px;
  transition: all $transition-duration $transition-timing;

  &.is-scrolled {
    background-color: $white;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  }

  .pc-main-nav-inner {
    width: 100%;
    max-width: 1920px;
    margin: 0 auto;
    display: flex;
    justify-content: flex-end;
    align-items: center;
  }

  .pc-nav-menu {
    list-style: none;
    display: flex;
    gap: clamp(20px, 2vw, 60px);
    align-items: center;

    .nav-item {
      position: relative;
      padding: 0 5px;

      .pc-nav-link {
        text-decoration: none;
        font-weight: 700;
        font-size: clamp(12px, 0.9vw, 16px);
        transition: color $transition-duration $transition-timing;
      }

      &:not(.pc-main-nav.is-scrolled) .pc-nav-link {
        color: $white;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
      }

      &.pc-main-nav.is-scrolled .pc-nav-link {
        color: $primary-color;
        text-shadow: 0 1px 2px rgba(0, 74, 153, 0.2);
      }

      &::before, &::after {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        height: 2px;
        border-radius: 1px;
        transition: all $transition-duration $transition-timing;
        opacity: 0;
      }

      &::before { top: 10px; }
      &::after { bottom: 10px; }

      &:hover::before, &:hover::after, &.nav-active::before, &.nav-active::after {
        opacity: 1;
      }

      &:not(.pc-main-nav.is-scrolled):hover::before,
      &:not(.pc-main-nav.is-scrolled):hover::after,
      &:not(.pc-main-nav.is-scrolled).nav-active::before,
      &:not(.pc-main-nav.is-scrolled).nav-active::after {
        background-color: $white;
      }

      &.pc-main-nav.is-scrolled:hover::before,
      &.pc-main-nav.is-scrolled:hover::after,
      &.pc-main-nav.is-scrolled.nav-active::before,
      &.pc-main-nav.is-scrolled.nav-active::after {
        background-color: $primary-color;
      }
    }

    @media (max-width: 1078px) and (min-width: 768px) {
      gap: clamp(15px, 1.5vw, 30px);
    }
  }
}
</style>
