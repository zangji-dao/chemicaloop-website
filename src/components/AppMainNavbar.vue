<template>
  <div class="app-main-navbar">
    <!-- PC端独立Logo -->
    <div class="pc-logo-standalone" ref="logoRef">
      <img
        :src="isScrolled ? blueLogo : whiteLogo"
        alt="Chemicaloop Logo"
        class="pc-logo-img"
        @error="handleLogoError"
        loading="eager"
      />
    </div>

    <!-- 移动端顶部栏 -->
    <div class="mobile-top-bar">
      <div class="mobile-top-bar-inner">
        <div class="mobile-logo-container">
          <img
            :src="whiteLogo"
            alt="Chemicaloop Logo"
            class="mobile-logo-img"
            @error="handleLogoError"
            loading="lazy"
          />
        </div>
        <div class="mobile-search-wrap">
          <div
            class="mobile-search-input-wrap"
            @click="focusSearchInput"
            :class="{ active: isSearchFocused }"
          >
            <input
              ref="searchInputRef"
              class="mobile-search-input"
              type="text"
              placeholder="product search..."
              @click.stop
              @focus="handleSearchFocus"
              @blur="handleSearchBlur"
              :aria-label="'search input field'"
            />
            <button
              class="mobile-search-btn"
              @click.stop="handleSearchClick"
              :aria-label="'execute search'"
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
        <div class="mobile-right-actions">
          <!-- 移动端语言选择器 -->
          <LangSelector
            ref="mobileLangRef"
            class="mobile-lang-selector"
            @langClick="closeMobileMenu"
            @langChange="closeMobileMenu"
            @select="closeMobileMenu"
            :class="{
              'lang-dropdown-hidden': isMobileMenuOpen || isSearchFocused,
            }"
          />
          <!-- 菜单按钮 -->
          <button
            class="mobile-menu-btn"
            @click.stop="handleMenuClick"
            :aria-label="isMobileMenuOpen ? 'close menu' : 'open menu'"
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

    <!-- 移动端导航菜单 -->
    <div class="mobile-nav-menu" :class="{ 'menu-show': isMobileMenuOpen && !isSearchFocused }">
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

    <!-- 移动端菜单遮罩 -->
    <div
      class="mobile-mask"
      :class="{ 'mask-show': isMobileMenuOpen && !isSearchFocused }"
      @click="closeMobileMenu"
    ></div>

    <!-- PC端导航栏容器 -->
    <div class="pc-nav-wrapper">
      <div class="pc-top-header">
        <div class="pc-top-header-inner">
          <div class="pc-right-area">
            <div class="pc-contact-social-wrap">
              <div class="pc-social-links">
                <a
                  href="#"
                  class="pc-social-icon"
                  target="_blank"
                  rel="noopener noreferrer"
                  :aria-label="'go to X platform'"
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
                  :aria-label="'go to LinkedIn platform'"
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
                  :aria-label="'go to Facebook platform'"
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
                  :aria-label="'go to Instagram platform'"
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
                  :aria-label="'go to YouTube platform'"
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
              <div class="pc-contact-info">
                <a
                  href="tel:+86.15585606688"
                  class="pc-contact-text"
                  :aria-label="'contact by phone: +86.15585606688'"
                  >+86.15585606688</a
                >
                <span>|</span>
                <a
                  href="mailto:support@chemicaloop.com"
                  class="pc-contact-text"
                  :aria-label="'contact by email: support@chemicaloop.com'"
                  >support@chemicaloop.com</a
                >
              </div>
            </div>
            <div class="pc-search-lang-wrap">
              <div class="pc-product-search">
                <input
                  ref="pcSearchInputRef"
                  type="text"
                  placeholder="Product Search"
                  class="pc-search-input"
                  :aria-label="'PC product search box'"
                />
                <button
                  class="pc-search-btn"
                  @click="handlePcSearchClick"
                  :aria-label="'execute product search'"
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
              <!-- PC端语言选择器：新增ref用于关闭 -->
              <LangSelector ref="pcLangRef" class="pc-lang-selector" />
            </div>
          </div>
        </div>
      </div>

      <div class="pc-main-nav" :class="{ 'is-scrolled': isScrolled }">
        <div class="pc-main-nav-inner">
          <ul class="pc-nav-menu">
            <li class="nav-item" :class="{ 'nav-active': $route.path === '/home' }">
              <router-link
                to="/home"
                class="pc-nav-link"
                active-class="link-active"
                :aria-label="'go to home page'"
                >HOME</router-link
              >
            </li>
            <li class="nav-item" :class="{ 'nav-active': $route.path === '/about' }">
              <router-link
                to="/about"
                class="pc-nav-link"
                active-class="link-active"
                :aria-label="'go to about us page'"
                >ABOUT US</router-link
              >
            </li>
            <li class="nav-item" :class="{ 'nav-active': $route.path === '/products' }">
              <router-link
                to="/products"
                class="pc-nav-link"
                active-class="link-active"
                :aria-label="'go to products page'"
                >PRODUCTS</router-link
              >
            </li>
            <li class="nav-item" :class="{ 'nav-active': $route.path === '/news' }">
              <router-link
                to="/news"
                class="pc-nav-link"
                active-class="link-active"
                :aria-label="'go to news page'"
                >NEWS</router-link
              >
            </li>
            <li class="nav-item" :class="{ 'nav-active': $route.path === '/contact' }">
              <router-link
                to="/contact"
                class="pc-nav-link"
                active-class="link-active"
                :aria-label="'go to contact us page'"
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
import LangSelector from '@/components/LangSelector.vue'
import whiteLogoImg from '@/assets/logo-white-bg.png'
import blueLogoImg from '@/assets/logo-blue-bg.png'

// Logo路径响应式管理
const whiteLogo = ref(whiteLogoImg)
const blueLogo = ref(blueLogoImg)

// 路由与状态管理
const route = useRoute()
const isScrolled = ref(false)
const isMobileMenuOpen = ref(false)
const isSearchFocused = ref(false)
// 语言选择器Ref：移动端 + PC端
const mobileLangRef = ref(null)
const pcLangRef = ref(null) // 新增PC端语言选择器ref
const logoRef = ref(null)
const searchInputRef = ref(null)
const pcSearchInputRef = ref(null)

// 常量配置
const PC_MIN_WIDTH_THRESHOLD = 768 // 移动端/PC端切换断点
let isCurrentMobile = ref(false) // 当前是否为移动端
const SCROLL_THRESHOLD = 5
let scrollTimer = null

/**
 * Logo加载失败兜底
 */
const handleLogoError = (e) => {
  e.target.src = 'https://via.placeholder.com/120x60/004a99/ffffff?text=LOGO'
}

/**
 * 图标加载失败兜底
 */
const handleIconError = (e) => {
  e.target.src = 'https://via.placeholder.com/16x16/ffffff/004a99?text=ICON'
}

/**
 * 移动端搜索框聚焦
 */
const focusSearchInput = () => {
  searchInputRef.value?.focus()
}

/**
 * 搜索框聚焦：关闭语言选择器下拉 + 关闭菜单
 */
const handleSearchFocus = () => {
  isSearchFocused.value = true
  // 关闭移动端语言选择器下拉
  if (mobileLangRef.value && typeof mobileLangRef.value.closeDropdown === 'function') {
    mobileLangRef.value.closeDropdown()
  }
  // 关闭PC端语言选择器下拉（如果存在）
  if (pcLangRef.value && typeof pcLangRef.value.closeDropdown === 'function') {
    pcLangRef.value.closeDropdown()
  }
  if (isMobileMenuOpen.value) {
    closeMobileMenu()
  }
}

/**
 * 搜索框失焦：恢复状态
 */
const handleSearchBlur = () => {
  setTimeout(() => {
    isSearchFocused.value = false
  }, 200)
}

/**
 * 滚动事件处理
 */
const handleScroll = () => {
  if (typeof window !== 'undefined') {
    isScrolled.value = window.scrollY > SCROLL_THRESHOLD
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
  // 关闭所有语言选择器下拉
  if (mobileLangRef.value && typeof mobileLangRef.value.closeDropdown === 'function') {
    mobileLangRef.value.closeDropdown()
  }
  if (pcLangRef.value && typeof pcLangRef.value.closeDropdown === 'function') {
    pcLangRef.value.closeDropdown()
  }

  // 切换菜单显隐
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
    document.body.offsetHeight
  }
}

/**
 * 移动端搜索处理
 */
const handleSearchClick = () => {
  const value = searchInputRef.value?.value?.trim() || ''
  if (!value) {
    alert('请输入搜索内容')
    return
  }
  console.log('移动端搜索内容：', value)
}

/**
 * PC端搜索处理
 */
const handlePcSearchClick = () => {
  const value = pcSearchInputRef.value?.value?.trim() || ''
  if (!value) {
    alert('Please enter search content')
    return
  }
  console.log('PC端搜索内容：', value)
}

/**
 * 检测当前设备类型 + 切换时关闭所有展开内容
 */
const checkDeviceType = () => {
  const newIsMobile = window.innerWidth < PC_MIN_WIDTH_THRESHOLD

  // 1. 移动端 → PC端：关闭移动端菜单、移动端语言下拉
  if (isCurrentMobile.value && !newIsMobile) {
    closeMobileMenu()
    mobileLangRef.value?.closeDropdown()
    isSearchFocused.value = false
    document.body.style.overflow = 'auto'
  }

  // 2. PC端 → 移动端：关闭PC端语言下拉
  if (!isCurrentMobile.value && newIsMobile) {
    pcLangRef.value?.closeDropdown()
  }

  isCurrentMobile.value = newIsMobile
}

/**
 * 窗口尺寸变化防抖处理
 */
let resizeTimer = null
const debouncedResize = () => {
  clearTimeout(resizeTimer)
  resizeTimer = setTimeout(checkDeviceType, 100)
}

// 路由监听
watch(
  () => route.path,
  () => {
    closeMobileMenu()
    // 关闭所有语言选择器下拉
    mobileLangRef.value?.closeDropdown()
    pcLangRef.value?.closeDropdown()
    handleScroll()
  },
  { immediate: true },
)

// 生命周期
onMounted(() => {
  nextTick(handleScroll)
  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', debouncedScroll)
    window.addEventListener('resize', debouncedResize)
    // 初始化设备类型
    checkDeviceType()
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', debouncedScroll)
    window.removeEventListener('resize', debouncedResize)
  }
  clearTimeout(scrollTimer)
  clearTimeout(resizeTimer)
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
  z-index: 99999 !important;
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
      transition: all $transition-duration $transition-timing;

      &.active {
        width: calc(100% + 20px);
        border-color: $primary-color;
        box-shadow: 0 0 0 2px rgba(0, 74, 153, 0.2);
      }
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
      transition: all $transition-duration $transition-timing;

      &::placeholder {
        color: #999;
      }

      &:focus {
        width: calc(100% - 45px);
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
    z-index: 99999 !important;
  }

  // 移动端语言选择器样式
  .mobile-lang-selector {
    display: inline-block !important;
    transition: all $transition-duration $transition-timing;

    &.lang-dropdown-hidden {
      :deep(*) {
        &[class*='dropdown'],
        &[class*='menu'] {
          display: none !important;
          visibility: hidden !important;
          opacity: 0 !important;
        }
      }
    }

    :deep(.lang-selector-container) {
      display: flex !important;
      align-items: center;
      gap: 4px;
      color: $primary-color !important;
      font-size: 14px !important;
      z-index: 99999 !important;
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

/* 移动端导航菜单 */
.mobile-nav-menu {
  position: fixed;
  top: $nav-height;
  right: 0;
  width: 260px;
  height: calc(100vh - $nav-height);
  background: $white;
  z-index: 9999 !important;
  box-shadow: -2px 0 15px rgba(0, 0, 0, 0.1);
  overflow-y: auto;
  display: none !important;

  &.menu-show {
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

/* 移动端菜单遮罩 */
.mobile-mask {
  position: fixed;
  top: $nav-height;
  left: 0;
  width: 100%;
  height: calc(100vh - $nav-height);
  background: rgba(0, 0, 0, 0.5);
  z-index: 9998 !important;
  display: none !important;

  &.mask-show {
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
      font-size: clamp(12px, 1vw, 14px);
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
    display: inline-block !important;
    margin-left: 10px !important;
    :deep(.lang-selector-container) {
      display: flex !important;
      align-items: center;
      gap: 4px;
      color: $white !important;
      font-size: 12px !important;
      z-index: 99999 !important;
    }
  }
}

/* PC端主导航 */
.pc-main-nav {
  background-color: transparent !important;
  height: $pc-nav-main-height;
  display: flex;
  align-items: center;
  padding: 0 20px;
  transition: all $transition-duration $transition-timing;

  &.is-scrolled {
    background-color: $white !important;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08) !important;
    .pc-lang-selector :deep(.lang-selector-container) {
      color: $primary-color !important;
    }
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

      .pc-nav-link {
        text-decoration: none;
        font-weight: 700;
        font-size: clamp(12px, 0.9vw, 16px);
        color: $white !important;
        text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8) !important;
        transition: color $transition-duration $transition-timing;
      }

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
        background-color: $white !important;
      }

      &::before {
        top: 0;
      }
      &::after {
        bottom: 0;
      }

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

// 穿透样式：滚动后导航链接颜色调整
:deep(.pc-main-nav.is-scrolled .nav-item .pc-nav-link) {
  color: $primary-color !important;
  text-shadow: 0 1px 2px rgba(0, 74, 153, 0.2) !important;
}

:deep(.pc-main-nav.is-scrolled .nav-item::before),
:deep(.pc-main-nav.is-scrolled .nav-item::after) {
  background-color: $primary-color !important;
}
</style>
