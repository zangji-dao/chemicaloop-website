\以下是保持原有结构不变、优化注释规范并移除冗余强制样式的完整代码，注释清晰描述各模块功能，同时修复潜在兼容性问题：
```vue
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
          <LangSelector class="mobile-lang-selector" />
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
          <router-link to="/about" class="mobile-nav-link" active-class="active"
            >ABOUT US</router-link
          >
        </li>
        <li @click="closeMobileMenu">
          <router-link to="/products" class="mobile-nav-link" active-class="active"
            >PRODUCTS</router-link
          >
        </li>
        <li @click="closeMobileMenu">
          <router-link to="/news" class="mobile-nav-link" active-class="active">NEWS</router-link>
        </li>
        <li @click="closeMobileMenu">
          <router-link to="/contact" class="mobile-nav-link" active-class="active"
            >CONTACT US</router-link
          >
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
              <LangSelector class="pc-lang-selector" />
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
// 导入语言选择器组件（仅导入一次）
import LangSelector from '@/components/LangSelector.vue'

// 资源路径配置（适配Vite模块导入规则）
const whiteLogo = ref(new URL('@/assets/logo-white-bg.png', import.meta.url).href)
const blueLogo = ref(new URL('@/assets/logo-blue-bg.png', import.meta.url).href)

// 核心状态管理
const route = useRoute()
const isScrolled = ref(false) // 页面滚动状态（控制Logo颜色和导航栏样式切换）
const isMobileMenuOpen = ref(false) // 移动端菜单显示状态
const logoRef = ref(null) // PC端Logo元素引用
const searchInputRef = ref(null) // 移动端搜索框元素引用

// 常量配置（集中管理，便于后续修改）
const PC_MIN_WIDTH_THRESHOLD = 768 // PC端最小宽度阈值
let scrollTimer = null // 滚动防抖定时器

/**
 * Logo加载失败兜底处理
 * @param {Event} e - 图片加载错误事件
 */
const handleLogoError = (e) => {
  e.target.src = 'https://via.placeholder.com/120x60/004a99/ffffff?text=CHEMICALOOP'
}

/**
 * 图标加载失败兜底处理
 * @param {Event} e - 图标加载错误事件
 */
const handleIconError = (e) => {
  e.target.src = 'https://via.placeholder.com/16x16/ffffff/004a99?text=icon'
}

/**
 * 移动端搜索框聚焦方法
 */
const focusSearchInput = () => {
  searchInputRef.value?.focus()
}

/**
 * 滚动事件处理（控制Logo颜色切换）
 */
const handleScroll = () => {
  if (typeof window !== 'undefined') {
    // 滚动距离超过50px时切换Logo颜色
    isScrolled.value = window.scrollY > 50
  }
}

/**
 * 滚动防抖处理（避免频繁触发滚动事件）
 */
const debouncedScroll = () => {
  clearTimeout(scrollTimer)
  scrollTimer = setTimeout(handleScroll, 30)
}

/**
 * 移动端菜单切换（打开/关闭）
 */
const handleMenuClick = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
  // 控制页面滚动锁定/解锁
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
  // 可扩展：添加搜索接口请求或路由跳转逻辑
}

/**
 * PC端搜索功能
 */
const handlePcSearchClick = () => {
  const input = document.querySelector('.pc-search-input')
  const value = input?.value || ''
  console.log('PC端搜索内容：', value)
  // 可扩展：添加搜索接口请求或路由跳转逻辑
}

// 路由监听：路由变化时关闭移动端菜单并更新滚动状态
watch(
  () => route.path,
  () => {
    closeMobileMenu()
    handleScroll()
  },
  { immediate: true }, // 初始加载时立即执行
)

// 生命周期：组件挂载时绑定滚动事件
onMounted(() => {
  nextTick(handleScroll) // 组件渲染完成后初始化滚动状态
  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', debouncedScroll)
  }
})

// 生命周期：组件卸载时清理资源
onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', debouncedScroll)
  }
  clearTimeout(scrollTimer) // 清除定时器，避免内存泄漏
  if (typeof document !== 'undefined') {
    document.body.style.overflow = 'auto' // 恢复页面滚动
  }
})
</script>

<style lang="scss" scoped>
/* 引入全局字体（Inter无衬线字体，适配导航场景） */
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Inter:wght@300;400;600;700&display=swap');

// 全局样式变量（统一主题和尺寸，便于维护）
$main-sans-font: 'Inter', sans-serif;
$primary-color: #004a99; // 主色调（蓝色）
$white: #ffffff; // 白色
$light-gray: #f5f5f5; // 浅灰色
$dark-gray: #333; // 深灰色
$secondary-color: #2c3e50; // 辅助色（深灰）
$nav-height: 80px; // 移动端导航栏高度
$pc-nav-top-height: 60px; // PC端顶部信息栏高度
$pc-nav-main-height: 50px; // PC端主导航高度
$search-wrap-height: 40px; // 搜索框高度
$gap-sm: 0.5rem; // 小间距
$gap-md: 1rem; // 中间距
$transition-duration: 0.3s; // 过渡动画时长
$transition-timing: ease; // 过渡动画曲线

/* 全局重置：统一盒模型和基础样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/**
 * 导航栏外层容器
 * 功能：统一包裹所有导航相关元素，设置基础层级和字体
 */
.app-main-navbar {
  width: 100%;
  z-index: 9999;
  font-family: $main-sans-font;
  line-height: 1;
  position: relative;
}

/**
 * PC端独立Logo
 * 功能：固定在左侧，滚动时切换Logo颜色，仅PC端显示
 */
.pc-logo-standalone {
  position: fixed;
  top: 0;
  left: 100px;
  z-index: 9999;
  padding: 10px 0;
  height: fit-content;
  line-height: 0; // 消除inline元素默认间距

  .pc-logo-img {
    width: clamp(80px, 8vw, 160px);
    height: auto;
    display: block;
    object-fit: contain;
    transition: all $transition-duration $transition-timing;
  }

  // 中等屏幕适配（768px-1078px）
  @media (max-width: 1078px) and (min-width: 768px) {
    left: 10px;
    .pc-logo-img {
      width: clamp(60px, 6vw, 120px);
    }
  }

  // 移动端隐藏（<=767px）
  @media (max-width: 767px) {
    display: none;
  }
}

/**
 * 移动端顶部栏
 * 功能：移动端导航入口，包含Logo、搜索框、语言选择器、菜单按钮
 */
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

  // 移动端Logo容器
  .mobile-logo-container {
    flex-shrink: 0;
    width: 80px;

    .mobile-logo-img {
      height: 50px;
      display: block;
      object-fit: contain;
    }
  }

  // 移动端搜索框区域
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

  // 移动端右侧操作区
  .mobile-right-actions {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    flex-shrink: 0;
  }

  // 移动端语言选择器（样式穿透）
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

  // 移动端菜单按钮
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

  // 移动端显示（<=767px）
  @media (max-width: 767px) {
    display: flex;
  }
}

/**
 * 移动端导航菜单
 * 功能：弹出式菜单，包含所有导航链接，点击菜单项关闭菜单
 */
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

  // 菜单显示状态（v-show触发）
  &[v-show='true'] {
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

      //  hover和激活状态
      &:hover,
      &.active {
        color: $primary-color;
        background-color: rgba(0, 74, 153, 0.05);
      }
    }
  }
}

/**
 * 移动端菜单遮罩
 * 功能：半透明背景，点击关闭菜单，防止点击穿透
 */
.mobile-mask {
  position: fixed;
  top: $nav-height;
  left: 0;
  width: 100%;
  height: calc(100vh - $nav-height);
  background: rgba(0, 0, 0, 0.5);
  z-index: 9998;
  display: none;

  // 遮罩显示状态（v-show触发）
  &[v-show='true'] {
    display: block;
  }
}

/**
 * PC端导航栏容器
 * 功能：包裹PC端顶部信息栏和主导航，仅PC端显示
 */
.pc-nav-wrapper {
  width: 100%;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9998;
  font-family: $main-sans-font;

  // 移动端隐藏（<=767px）
  @media (max-width: 767px) {
    display: none;
  }
}

/**
 * PC端顶部信息栏
 * 功能：显示社交图标、联系方式、搜索框、语言选择器，蓝色背景
 */
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
    justify-content: flex-end; // 整体右对齐（Logo固定在左侧）
    gap: $gap-md;
    flex-wrap: wrap;
  }

  // 社交+联系方式整合容器
  .pc-contact-social-wrap {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    flex-shrink: 1;
    flex-wrap: wrap;
  }

  // 社交图标样式
  .pc-social-links {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    flex-shrink: 1;
    overflow: visible;

    .pc-social-icon {
      transition: transform 0.2s $transition-timing;
      line-height: 0;

      // hover缩放效果
      &:hover {
        transform: scale(1.1);
      }

      .pc-icon-img {
        height: clamp(12px, 1.2vw, 16px);
        width: auto;
        display: block;
        filter: brightness(0) invert(1); // 白色图标（适配蓝色背景）
      }
    }

    span {
      color: $white;
      opacity: 0.9;
      margin: 0 2px;
      font-size: clamp(9px, 0.7vw, 12px);
    }

    // 中等屏幕适配（768px-1078px）
    @media (max-width: 1078px) and (min-width: 768px) {
      gap: 0.5rem;
    }
  }

  // 电话/邮箱样式
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

  // 右侧整体容器（联系方式+搜索+语言）
  .pc-right-area {
    display: flex;
    align-items: center;
    gap: $gap-md;
    flex-shrink: 0;
    flex-wrap: wrap;
  }

  // 搜索框+语言选择器容器
  .pc-search-lang-wrap {
    display: flex;
    align-items: center;
    gap: $gap-sm;
    flex-shrink: 0;
  }

  // PC端搜索框
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

  // PC端搜索按钮
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
      filter: brightness(0) invert(1); // 白色图标
    }
  }

  // PC端语言选择器（样式穿透）
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

      // 滚动状态下的语言选择器样式
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

/**
 * PC端主导航
 * 功能：显示主导航菜单，滚动时切换背景色（透明→白色）
 */
.pc-main-nav {
  background-color: transparent;
  height: $pc-nav-main-height;
  display: flex;
  align-items: center;
  padding: 0 20px;
  transition: all $transition-duration $transition-timing;

  // 滚动状态样式（白色背景+阴影）
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

      // 非滚动状态（透明背景）- 白色文字
      &:not(.pc-main-nav.is-scrolled) .pc-nav-link {
        color: $white;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
      }

      // 滚动状态（白色背景）- 蓝色文字
      .pc-main-nav.is-scrolled & .pc-nav-link {
        color: $primary-color;
        text-shadow: 0 1px 2px rgba(0, 74, 153, 0.2);
      }

      // 导航项hover/active装饰线（上下两条）
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
      }

      &::before {
        top: 10px;
      }

      &::after {
        bottom: 10px;
      }

      // hover和active时显示装饰线
      &:hover::before,
      &:hover::after,
      &.nav-active::before,
      &.nav-active::after {
        opacity: 1;
      }

      // 非滚动状态装饰线颜色（白色）
      &:not(.pc-main-nav.is-scrolled):hover::before,
      &:not(.pc-main-nav.is-scrolled):hover::after,
      &:not(.pc-main-nav.is-scrolled).nav-active::before,
      &:not(.pc-main-nav.is-scrolled).nav-active::after {
        background-color: $white;
      }

      // 滚动状态装饰线颜色（蓝色）
      .pc-main-nav.is-scrolled &:hover::before,
      .pc-main-nav.is-scrolled &:hover::after,
      .pc-main-nav.is-scrolled &.nav-active::before,
      .pc-main-nav.is-scrolled &.nav-active::after {
        background-color: $primary-color;
      }
    }

    // 中等屏幕适配（768px-1078px）
    @media (max-width: 1078px) and (min-width: 768px) {
      gap: clamp(15px, 1.5vw, 30px);
    }
  }
}
</style>
