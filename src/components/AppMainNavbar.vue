<template>
  <div class="app-main-navbar">
    <!-- PC端独立Logo（固定定位，仅PC端显示，滚动时切换颜色） -->
    <div class="pc-logo-standalone" ref="logoRef">
      <img
        :src="isScrolled ? blueLogo : whiteLogo"
        alt="Chemicaloop Logo"
        class="pc-logo-img"
        @error="handleLogoError"
        loading="lazy"
      />
    </div>

    <!-- 移动端顶部栏（仅移动端显示，包含Logo、搜索框、操作按钮） -->
    <div class="mobile-top-bar">
      <div class="mobile-top-bar-inner">
        <!-- 移动端Logo容器 -->
        <div class="mobile-logo-container">
          <img
            :src="whiteLogo"
            alt="Chemicaloop Logo"
            class="mobile-logo-img"
            @error="handleLogoError"
            loading="lazy"
          />
        </div>

        <!-- 移动端搜索框区域 -->
        <div class="mobile-search-wrap">
          <div class="mobile-search-input-wrap" @click="focusSearchInput">
            <input
              ref="searchInputRef"
              class="mobile-search-input"
              type="text"
              placeholder="搜索..."
              @click.stop
              :aria-label="`移动端搜索框`"
            />
            <button
              class="mobile-search-btn"
              @click.stop="handleSearchClick"
              :aria-label="`执行搜索`"
            >
              <img
                src="@/assets/icons/search-dark.png"
                alt="Search Icon"
                class="mobile-search-icon"
                @error="handleIconError"
                loading="lazy"
              />
            </button>
          </div>
        </div>

        <!-- 移动端右侧操作区：语言选择器 + 菜单按钮 -->
        <div class="mobile-right-actions">
          <!-- 修复1：注释未导入的组件，避免编译报错 -->
          <!-- <LangSelector class="mobile-lang-selector" /> -->
          <button
            class="mobile-menu-btn"
            @click.stop="handleMenuClick"
            :aria-label="isMobileMenuOpen ? '关闭菜单' : '打开菜单'"
          >
            <img
              src="@/assets/icons/menu-icon.png"
              alt="Mobile Menu Icon"
              class="mobile-menu-icon-img"
              @error="handleIconError"
              loading="lazy"
            />
          </button>
        </div>
      </div>
    </div>

    <!-- 移动端导航菜单（弹出式，仅菜单打开时显示） -->
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

    <!-- 移动端菜单遮罩（半透明背景，点击关闭菜单） -->
    <div class="mobile-mask" v-show="isMobileMenuOpen" @click="closeMobileMenu"></div>

    <!-- PC端导航栏容器（仅PC端显示，包含顶部信息栏和主导航） -->
    <div class="pc-nav-wrapper">
      <!-- PC端顶部信息栏（蓝色背景，包含联系方式、社交图标、搜索框、语言选择器） -->
      <div class="pc-top-header">
        <div class="pc-top-header-inner">
          <!-- 右侧整体区域：联系方式 + 搜索框 + 语言选择器 -->
          <div class="pc-right-area">
            <!-- 联系方式整合容器：社交图标 + 电话/邮箱 -->
            <div class="pc-contact-social-wrap">
              <!-- 社交图标组（带分隔符） -->
              <div class="pc-social-links">
                <a
                  href="#"
                  class="pc-social-icon"
                  target="_blank"
                  rel="noopener noreferrer"
                  :aria-label="`前往X平台`"
                >
                  <img
                    src="@/assets/icons/x.png"
                    alt="X Icon"
                    class="pc-icon-img"
                    @error="handleIconError"
                    loading="lazy"
                  />
                </a>
                <span>|</span>
                <a
                  href="#"
                  class="pc-social-icon"
                  target="_blank"
                  rel="noopener noreferrer"
                  :aria-label="`前往LinkedIn平台`"
                >
                  <img
                    src="@/assets/icons/linkedin.png"
                    alt="LinkedIn Icon"
                    class="pc-icon-img"
                    @error="handleIconError"
                    loading="lazy"
                  />
                </a>
                <span>|</span>
                <a
                  href="#"
                  class="pc-social-icon"
                  target="_blank"
                  rel="noopener noreferrer"
                  :aria-label="`前往Facebook平台`"
                >
                  <img
                    src="@/assets/icons/facebook.png"
                    alt="Facebook Icon"
                    class="pc-icon-img"
                    @error="handleIconError"
                    loading="lazy"
                  />
                </a>
                <span>|</span>
                <a
                  href="#"
                  class="pc-social-icon"
                  target="_blank"
                  rel="noopener noreferrer"
                  :aria-label="`前往Instagram平台`"
                >
                  <img
                    src="@/assets/icons/instagram.png"
                    alt="Instagram Icon"
                    class="pc-icon-img"
                    @error="handleIconError"
                    loading="lazy"
                  />
                </a>
                <span>|</span>
                <a
                  href="#"
                  class="pc-social-icon"
                  target="_blank"
                  rel="noopener noreferrer"
                  :aria-label="`前往YouTube平台`"
                >
                  <img
                    src="@/assets/icons/youtube.png"
                    alt="YouTube Icon"
                    class="pc-icon-img"
                    @error="handleIconError"
                    loading="lazy"
                  />
                </a>
                <span>|</span>
              </div>

              <!-- 电话/邮箱联系方式 -->
              <div class="pc-contact-info">
                <a
                  href="tel:+86.15585606688"
                  class="pc-contact-text"
                  :aria-label="`电话联系：+86.15585606688`"
                  >+86.15585606688</a
                >
                <span>|</span>
                <a
                  href="mailto:support@chemicaloop.com"
                  class="pc-contact-text"
                  :aria-label="`邮件联系：support@chemicaloop.com`"
                  >support@chemicaloop.com</a
                >
              </div>
            </div>

            <!-- 搜索框 + 语言选择器容器 -->
            <div class="pc-search-lang-wrap">
              <div class="pc-product-search">
                <input
                  type="text"
                  placeholder="Product Search"
                  class="pc-search-input"
                  :aria-label="`PC端产品搜索框`"
                />
                <button
                  class="pc-search-btn"
                  @click="handlePcSearchClick"
                  :aria-label="`执行产品搜索`"
                >
                  <img
                    src="@/assets/icons/search-white.png"
                    alt="Search Icon"
                    class="global-search-icon"
                    @error="handleIconError"
                    loading="lazy"
                  />
                </button>
              </div>
              <!-- 修复2：注释未导入的组件，避免编译报错 -->
              <!-- <LangSelector class="pc-lang-selector" /> -->
            </div>
          </div>
        </div>
      </div>

      <!-- PC端主导航（滚动时切换背景色，包含主导航菜单） -->
      <div class="pc-main-nav" :class="{ 'is-scrolled': isScrolled }">
        <div class="pc-main-nav-inner">
          <ul class="pc-nav-menu">
            <li class="nav-item" :class="{ 'nav-active': $route.path === '/home' }">
              <router-link
                to="/home"
                class="pc-nav-link"
                active-class="link-active"
                :aria-label="`前往首页`"
                >HOME</router-link
              >
            </li>
            <li class="nav-item" :class="{ 'nav-active': $route.path === '/about' }">
              <router-link
                to="/about"
                class="pc-nav-link"
                active-class="link-active"
                :aria-label="`前往关于我们页面`"
                >ABOUT US</router-link
              >
            </li>
            <li class="nav-item" :class="{ 'nav-active': $route.path === '/products' }">
              <router-link
                to="/products"
                class="pc-nav-link"
                active-class="link-active"
                :aria-label="`前往产品页面`"
                >PRODUCTS</router-link
              >
            </li>
            <li class="nav-item" :class="{ 'nav-active': $route.path === '/news' }">
              <router-link
                to="/news"
                class="pc-nav-link"
                active-class="link-active"
                :aria-label="`前往新闻页面`"
                >NEWS</router-link
              >
            </li>
            <li class="nav-item" :class="{ 'nav-active': $route.path === '/contact' }">
              <router-link
                to="/contact"
                class="pc-nav-link"
                active-class="link-active"
                :aria-label="`前往联系我们页面`"
                >CONTACT US</router-link
              >
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
// 导入语言选择器组件（请确保该组件路径正确，若没有可注释掉）
// import LangSelector from '@/components/LangSelector.vue'

// 资源路径配置（适配Vite模块导入规则，若图片不存在可注释/替换）
const whiteLogo = ref(new URL('@/assets/logo-white-bg.png', import.meta.url).href)
const blueLogo = ref(new URL('@/assets/logo-blue-bg.png', import.meta.url).href)

// 核心状态管理
const route = useRoute()
const isScrolled = ref(false) // 页面滚动状态（控制Logo颜色和导航栏样式切换）
const isMobileMenuOpen = ref(false) // 移动端菜单显示状态
const logoRef = ref(null) // PC端Logo元素引用
const searchInputRef = ref(null) // 移动端搜索框元素引用

// 常量配置
const PC_MIN_WIDTH_THRESHOLD = 768 // PC端最小宽度阈值
let scrollTimer = null // 滚动防抖定时器

/**
 * Logo加载失败兜底处理
 */
const handleLogoError = (e) => {
  e.target.src = 'https://via.placeholder.com/120x60/004a99/ffffff?text=LOGO'
}

/**
 * 图标加载失败兜底处理
 */
const handleIconError = (e) => {
  e.target.src = 'https://via.placeholder.com/16x16/ffffff/004a99?text=ICON'
}

/**
 * 移动端搜索框聚焦方法
 */
const focusSearchInput = () => {
  searchInputRef.value?.focus()
}

/**
 * 滚动事件处理（控制Logo颜色切换）
 * 阈值调至5px，几乎滚动即触发
 */
const handleScroll = () => {
  if (typeof window !== 'undefined') {
    isScrolled.value = window.scrollY > 5
    console.log('滚动状态:', isScrolled.value) // 调试用：查看是否触发
  }
}

/**
 * 滚动防抖处理
 */
const debouncedScroll = () => {
  clearTimeout(scrollTimer)
  scrollTimer = setTimeout(handleScroll, 30)
}

/**
 * 移动端菜单切换
 */
const handleMenuClick = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
  if (typeof document !== 'undefined') {
    document.body.style.overflow = isMobileMenuOpen.value ? 'hidden' : 'auto'
  }
}

/**
 * 关闭移动端菜单
 */
const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
  if (typeof document !== 'undefined') {
    document.body.style.overflow = 'auto'
  }
}

/**
 * 移动端搜索功能
 */
const handleSearchClick = () => {
  const value = searchInputRef.value?.value || ''
  console.log('移动端搜索内容：', value)
}

/**
 * PC端搜索功能
 */
const handlePcSearchClick = () => {
  const input = document.querySelector('.pc-search-input')
  const value = input?.value || ''
  console.log('PC端搜索内容：', value)
}

// 路由监听：路由变化时关闭移动端菜单并更新滚动状态
watch(
  () => route.path,
  () => {
    closeMobileMenu()
    handleScroll()
  },
  { immediate: true }
)

// 生命周期：挂载时绑定滚动事件
onMounted(() => {
  nextTick(handleScroll)
  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', debouncedScroll)
  }
})

// 生命周期：卸载时清理
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
/* 引入全局字体 */
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Inter:wght@300;400;600;700&display=swap');

// 全局变量
$main-sans-font: 'Inter', sans-serif;
$primary-color: #004a99; // 主色：蓝色
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

.app-main-navbar {
  width: 100%;
  z-index: 9999;
  font-family: $main-sans-font;
  line-height: 1;
  position: relative;
}

/* PC端独立Logo */
.pc-logo-standalone {
  position: fixed;
  top: 0;
  left: 100px;
  z-index: 9999;
  padding: 10px 0;
  height: fit-content;
  line-height: 0;

  .pc-logo-img {
    width: clamp(80px, 8vw, 160px);
    height: auto;
    display: block;
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
    display: none;
  }
}

/* 移动端顶部栏 */
.mobile-top-bar {
  display: none;
  align-items: center;
  background-color: $white;
  height: $nav-height;
  border-bottom: 1px solid #eee;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
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
      display: block;
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

  .mobile-right-actions {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    flex-shrink: 0;
  }

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

          &:hover,
          &.selected {
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
    display: flex;
  }
}

/* 移动端导航菜单 - 修复3：提升v-show样式优先级，解决不显示问题 */
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

  &[v-show='true'] {
    display: block !important;
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

      &:hover,
      &.active {
        color: $primary-color;
        background-color: rgba(0, 74, 153, 0.05);
      }
    }
  }
}

/* 移动端菜单遮罩 - 修复4：提升v-show样式优先级，解决不显示问题 */
.mobile-mask {
  position: fixed;
  top: $nav-height;
  left: 0;
  width: 100%;
  height: calc(100vh - $nav-height);
  background: rgba(0, 0, 0, 0.5);
  z-index: 9998;
  display: none;

  &[v-show='true'] {
    display: block !important;
  }
}

/* PC端导航栏容器 */
.pc-nav-wrapper {
  width: 100%;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9998;
  font-family: $main-sans-font;

  @media (max-width: 767px) {
    display: none;
  }
}

/* PC端顶部信息栏 */
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
    justify-content: flex-end;
    gap: $gap-md;
    flex-wrap: wrap;
  }

  .pc-contact-social-wrap {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    flex-shrink: 1;
    flex-wrap: wrap;
  }

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
        display: block;
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
    justify-content: space-between;
    background-color: rgba(255, 255, 255, 0.2);
    border: 1px solid $white;
    border-radius: 2px;
    position: relative;
    overflow: hidden;
  }

  .pc-search-input {
    flex-shrink: 1;
    border: none;
    background: transparent;
    outline: none;
    padding: 0 clamp(8px, 0.8vw, 12px);
    width: 100%;
    color: $white;
    font-size: clamp(12px, 1vw, 14px);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &::placeholder {
      color: rgba(255, 255, 255, 0.7);
    }
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
    flex-shrink: 0;

    .global-search-icon {
      height: 65%;
      width: 65%;
      display: block;
      object-fit: contain;
      filter: brightness(0) invert(1);
    }
  }

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

          &:hover,
          &.selected {
            background-color: $primary-color;
          }

          .lang-flag {
            width: 20px;
            height: 14px;
            border: 1px solid $white;
          }
        }
      }

      :deep(.pc-main-nav.is-scrolled) & .lang-trigger {
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

/* PC端主导航 - 核心样式 */
.pc-main-nav {
  background-color: transparent !important;
  height: $pc-nav-main-height;
  display: flex;
  align-items: center;
  padding: 0 20px;
  transition: all $transition-duration $transition-timing;

  // 滚动后强制白色背景
  &.is-scrolled {
    background-color: #ffffff !important;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08) !important;
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
      padding: 5px 5px;

      // 未滚动：文字强制白色
      .pc-nav-link {
        text-decoration: none;
        font-weight: 700;
        font-size: clamp(12px, 0.9vw, 16px);
        color: #ffffff !important;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8) !important;
        transition: color $transition-duration $transition-timing;
      }

      // 装饰线：未滚动强制白色
      &::before,
      &::after {
        content: '';
        position: absolute;
        left: 0;
        right: 0;
        height: 2px;
        border-radius: 1px;
        transition: all $transition-duration $transition-timing;
        opacity: 0;
        background-color: #ffffff !important;
      }

      &::before { top: 0; }
      &::after { bottom: 0; }

      // hover/选中显示装饰线
      &:hover::before,
      &:hover::after,
      &.nav-active::before,
      &.nav-active::after {
        opacity: 1 !important;
      }
    }

    @media (max-width: 1078px) and (min-width: 768px) {
      gap: clamp(15px, 1.5vw, 30px);
    }
  }
}

// ========== 终极修复：:deep() 穿透 scoped，强制滚动后变蓝 ==========
:deep(.pc-main-nav.is-scrolled .nav-item .pc-nav-link) {
  color: #004a99 !important;
  text-shadow: 0 1px 2px rgba(0, 74, 153, 0.2) !important;
}

:deep(.pc-main-nav.is-scrolled .nav-item::before),
:deep(.pc-main-nav.is-scrolled .nav-item::after) {
  background-color: #004a99 !important;
}
</style>
