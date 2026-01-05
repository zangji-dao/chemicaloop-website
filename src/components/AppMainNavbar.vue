<template>
  <div class="app-main-navbar">
    <!-- 1. PC端Logo（固定定位，不随导航滚动偏移） -->
    <div class="pc-logo-standalone" ref="logoRef" v-show="!isMobileLayout">
      <img :src="isScrolled ? blueLogo : whiteLogo" alt="Chemicaloop Logo" class="pc-logo-img" />
    </div>

    <!-- 2. 移动端顶部栏（适配320px~767px屏幕，国旗在搜索框右侧） -->
    <div class="mobile-top-bar" v-show="isMobileLayout">
      <div class="mobile-top-bar-inner">
        <!-- 左侧：Logo（固定宽度，不挤压其他元素） -->
        <div class="mobile-logo-container">
          <img :src="whiteLogo" alt="Chemicaloop Logo" class="mobile-logo-img" />
        </div>

        <!-- 中间：搜索框 + 国旗（flex布局确保同行，搜索框占满剩余空间） -->
        <div class="mobile-search-lang-wrap">
          <!-- 搜索框（flex:1 占满空间，不被国旗挤压） -->
          <div class="mobile-search-wrapper">
            <div class="mobile-search-input-wrap" @click="focusSearchInput">
              <input
                ref="searchInputRef"
                class="mobile-search-input"
                type="text"
                placeholder="搜索..."
                @click.stop
              />
              <button class="mobile-search-btn" @click.stop="handleSearchClick">
                <img src="@/assets/icons/search-dark.png" alt="Search" class="mobile-search-icon" />
              </button>
            </div>
          </div>

          <!-- 移动端国旗（固定尺寸，在搜索框右侧，不换行） -->
          <LangSelector class="mobile-lang-selector" />
        </div>

        <!-- 右侧：Menu按钮（固定尺寸，与国旗间距固定） -->
        <button class="mobile-menu-btn" @click.stop="handleMenuClick">
          <img src="@/assets/icons/menu-icon.png" alt="Mobile Menu" class="mobile-menu-icon-img" />
        </button>
      </div>
    </div>

    <!-- 3. 移动端菜单（仅作导航，移除重复的语言选择器，避免冗余） -->
    <div class="mobile-nav-menu" v-show="isMobileLayout && isMobileMenuOpen">
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

    <!-- 4. 移动端菜单遮罩（防止滚动穿透） -->
    <div
      class="mobile-mask"
      v-show="isMobileLayout && isMobileMenuOpen"
      @click="closeMobileMenu"
    ></div>

    <!-- 5. PC端导航栏（适配768px~1920px+屏幕，国旗在搜索框右侧） -->
    <div class="pc-nav-wrapper" v-show="!isMobileLayout">
      <!-- PC端顶部栏（社交链接 + 搜索框 + 国旗） -->
      <div class="pc-top-header">
        <div class="pc-top-header-inner">
          <!-- 左侧：社交链接（自适应宽度，不挤压右侧） -->
          <div class="pc-social-links">
            <a href="#" class="pc-social-icon" target="_blank" rel="noopener">
              <img src="@/assets/icons/x.png" alt="X" class="pc-icon-img" />
            </a>
            <span>|</span>
            <a href="#" class="pc-social-icon" target="_blank" rel="noopener">
              <img src="@/assets/icons/linkedin.png" alt="LinkedIn" class="pc-icon-img" />
            </a>
            <span>|</span>
            <a href="#" class="pc-social-icon" target="_blank" rel="noopener">
              <img src="@/assets/icons/facebook.png" alt="Facebook" class="pc-icon-img" />
            </a>
            <span>|</span>
            <a href="#" class="pc-social-icon" target="_blank" rel="noopener">
              <img src="@/assets/icons/instagram.png" alt="Instagram" class="pc-icon-img" />
            </a>
            <span>|</span>
            <a href="#" class="pc-social-icon" target="_blank" rel="noopener">
              <img src="@/assets/icons/youtube.png" alt="YouTube" class="pc-icon-img" />
            </a>
            <span>|</span>
            <a href="tel:+86.15585606688" class="pc-contact-text">+86.15585606688</a>
            <span>|</span>
            <a href="mailto:support@chemicaloop.com" class="pc-contact-text"
              >support@chemicaloop.com</a
            >
          </div>

          <!-- 右侧：搜索框 + 国旗（flex布局，确保国旗在搜索框右侧，不换行） -->
          <div class="pc-search-lang-wrap">
            <!-- PC端搜索框（固定宽度范围，适配不同屏幕） -->
            <div class="pc-product-search">
              <input type="text" placeholder="Product Search" class="pc-search-input" />
              <button class="pc-search-btn" @click="handlePcSearchClick">
                <img
                  src="@/assets/icons/search-white.png"
                  alt="Search Icon"
                  class="global-search-icon"
                />
              </button>
            </div>

            <!-- PC端国旗（与搜索框间距固定，随滚动同步样式） -->
            <LangSelector class="pc-lang-selector" />
          </div>
        </div>
      </div>

      <!-- PC端主导航（滚动时样式切换，与国旗样式同步） -->
      <div class="pc-main-nav" :class="{ 'is-scrolled': isScrolled }">
        <div class="pc-main-nav-inner">
          <ul class="pc-nav-menu">
            <li class="nav-item" :class="{ 'nav-active': $route.path === '/home' }">
              <router-link to="/home" class="pc-nav-link" active-class="link-active"
                >HOME</router-link
              >
            </li>
            <li class="nav-item" :class="{ 'nav-active': $route.path === '/about' }">
              <router-link to="/about" class="pc-nav-link" active-class="link-active"
                >ABOUT US</router-link
              >
            </li>
            <li class="nav-item" :class="{ 'nav-active': $route.path === '/products' }">
              <router-link to="/products" class="pc-nav-link" active-class="link-active"
                >PRODUCTS</router-link
              >
            </li>
            <li class="nav-item" :class="{ 'nav-active': $route.path === '/news' }">
              <router-link to="/news" class="pc-nav-link" active-class="link-active"
                >NEWS</router-link
              >
            </li>
            <li class="nav-item" :class="{ 'nav-active': $route.path === '/contact' }">
              <router-link to="/contact" class="pc-nav-link" active-class="link-active"
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
// 导入仅显国旗样式的LangSelector组件（确保组件内已隐藏文字）
import LangSelector from '@/components/LangSelector.vue'
// 导入Logo资源
import whiteLogoImg from '@/assets/logo-white-bg.png'
import blueLogoImg from '@/assets/logo-blue-bg.png'

// 核心状态管理（确保多端适配逻辑正确）
const route = useRoute()
const isScrolled = ref(false) // 导航滚动状态（控制样式切换）
const whiteLogo = ref(whiteLogoImg)
const blueLogo = ref(blueLogoImg)
const isMobileMenuOpen = ref(false) // 移动端菜单显隐
const isMobileLayout = ref(false) // 移动端/PC端布局标记
const logoRef = ref(null)
const searchInputRef = ref(null)

// 适配常量（统一多端尺寸标准）
const PC_MIN_WIDTH_THRESHOLD = 768 // PC端最小宽度（低于此值为移动端）
let scrollTimer = null
let resizeObserver = null

// 1. 移动端搜索框聚焦（适配软键盘弹出）
const focusSearchInput = () => {
  searchInputRef.value?.focus()
}

// 2. 布局切换逻辑（窗口 resize 时实时更新）
const checkLayoutBreakpoint = () => {
  nextTick(() => {
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : PC_MIN_WIDTH_THRESHOLD
    isMobileLayout.value = screenWidth < PC_MIN_WIDTH_THRESHOLD
    if (isMobileMenuOpen.value) closeMobileMenu() // 布局切换时关闭菜单，避免错位
  })
}

// 3. 滚动事件（防抖处理，避免频繁触发样式切换）
const handleScroll = () => {
  isScrolled.value = window.scrollY > 50
}
const debouncedScroll = () => {
  clearTimeout(scrollTimer)
  scrollTimer = setTimeout(handleScroll, 30)
}

// 4. 移动端菜单控制（防止滚动穿透）
const handleMenuClick = () => {
  if (!isMobileLayout.value) return
  isMobileMenuOpen.value = !isMobileMenuOpen.value
  document.body.style.overflow = isMobileMenuOpen.value ? 'hidden' : 'auto'
}
const closeMobileMenu = () => {
  isMobileMenuOpen.value = false
  document.body.style.overflow = 'auto'
}

// 5. 搜索功能（多端统一逻辑）
const handleSearchClick = () => {
  const value = searchInputRef.value?.value || ''
  console.log('移动端搜索内容：', value)
  // 可扩展：$router.push(`/search?keyword=${value}`)
}
const handlePcSearchClick = () => {
  const input = document.querySelector('.pc-search-input')
  const value = input?.value || ''
  console.log('PC端搜索内容：', value)
  // 可扩展：$router.push(`/search?keyword=${value}`)
}

// 6. 路由监听（切换页面时重置状态）
watch(
  () => route.path,
  () => {
    closeMobileMenu()
    handleScroll()
    nextTick(checkLayoutBreakpoint)
  },
  { immediate: true },
)

// 7. 生命周期（确保多端适配初始化正确）
onMounted(() => {
  nextTick(() => {
    checkLayoutBreakpoint()
    closeMobileMenu()
  })
  window.addEventListener('scroll', debouncedScroll)
  window.addEventListener('resize', checkLayoutBreakpoint)
  // 监听Logo尺寸变化（适配特殊布局）
  if (logoRef.value) {
    resizeObserver = new ResizeObserver(() => checkLayoutBreakpoint())
    resizeObserver.observe(logoRef.value)
  }
})

onUnmounted(() => {
  window.removeEventListener('scroll', debouncedScroll)
  window.removeEventListener('resize', checkLayoutBreakpoint)
  clearTimeout(scrollTimer)
  resizeObserver?.disconnect()
})
</script>

<style lang="scss" scoped>
/* 引入全局字体（确保多端字体统一） */
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Inter:wght@300;400;600;700&display=swap');

// 全局变量（统一多端样式标准，避免混乱）
$main-sans-font: 'Inter', sans-serif;
$primary-color: #004a99; // 主题蓝（多端统一）
$white: #ffffff;
$light-gray: #f5f5f5;
$dark-gray: #333;
// 尺寸变量（多端适配核心，按比例定义）
$nav-height: 80px; // 移动端顶部栏高度
$pc-nav-top-height: 60px; // PC端顶部栏高度
$pc-nav-main-height: 50px; // PC端主导航高度
$search-wrap-height: 40px; // 移动端搜索框高度
// 间距变量（统一多端间距，避免拥挤/松散）
$gap-sm: 0.5rem; // 小间距（国旗与搜索框）
$gap-md: 1rem; // 中等间距（元素间）
// 动画变量（多端过渡效果统一）
$transition-duration: 0.3s;
$transition-timing: ease;

/* 全局重置（确保多端默认样式一致） */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 外层容器（固定z-index，避免被其他元素遮挡） */
.app-main-navbar {
  width: 100%;
  z-index: 9999;
  font-family: $main-sans-font;
  line-height: 1;
}

/* ———— 1. PC端Logo适配（固定定位，不随滚动偏移） ———— */
.pc-logo-standalone {
  position: fixed;
  top: 0;
  left: 20px;
  z-index: 99999; // 高于导航，避免被遮挡
  padding: 10px 0;
  height: fit-content;
  line-height: 0;

  .pc-logo-img {
    width: clamp(80px, 8vw, 160px); // 自适应宽度（最小80px，最大160px）
    height: auto;
    display: block;
    object-fit: contain;
    transition: all $transition-duration $transition-timing;
  }

  // 小屏PC端（768px~1078px）适配：缩小Logo
  @media (max-width: 1078px) and (min-width: 768px) {
    left: 10px;
    .pc-logo-img {
      width: clamp(60px, 6vw, 120px);
    }
  }
}

/* ———— 2. 移动端顶部栏适配（320px~767px） ———— */
.mobile-top-bar {
  display: flex;
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
  padding: 0 15px; // 左右内边距，避免元素贴边

  .mobile-top-bar-inner {
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: $gap-sm; // 元素间最小间距，避免挤压
  }

  // 左侧Logo：固定宽度，不挤压其他元素
  .mobile-logo-container {
    flex-shrink: 0; // 禁止缩小
    width: 80px; // 固定宽度

    .mobile-logo-img {
      height: 50px;
      display: block;
      object-fit: contain;
    }
  }

  // 中间：搜索框 + 国旗容器（flex布局，确保同行）
  .mobile-search-lang-wrap {
    display: flex;
    align-items: center;
    gap: $gap-sm; // 搜索框与国旗间距
    flex: 1; // 占满剩余空间，确保右侧Menu按钮不挤压
  }

  // 移动端搜索框：占满容器空间，不被国旗挤压
  .mobile-search-wrapper {
    flex: 1; // 搜索框占满剩余空间
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
      width: calc(100% - 40px); // 预留搜索按钮空间
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

  // 移动端国旗：仅显国旗，固定尺寸，不换行
  .mobile-lang-selector {
    flex-shrink: 0; // 禁止缩小，避免变形
    :deep(.lang-selector-container) {
      // 隐藏语言文字，仅显国旗+箭头
      .lang-text,
      .lang-option-text {
        display: none !important;
      }

      // 触发器：紧凑布局，适配移动端
      .lang-trigger {
        padding: 0.3rem 0.4rem; // 缩小内边距
        gap: 0.2rem; // 国旗与箭头间距
        background-color: rgba(0, 74, 153, 0.1);
        border: 1px solid transparent;
        border-radius: 4px;

        .lang-flag {
          width: 20px;
          height: 14px;
          object-fit: cover;
          border-radius: 2px;
        }

        .lang-arrow {
          font-size: 0.7rem;
          color: $primary-color;
        }
      }

      // 下拉菜单：右对齐，避免超出屏幕
      .lang-dropdown {
        width: 56px; // 固定宽度，匹配触发器
        left: auto;
        right: 0; // 右对齐，防止小屏左侧溢出
        top: calc(100% + 2px);

        .lang-option {
          justify-content: center; // 国旗居中
          padding: 0.4rem 0; // 上下内边距，节省空间
        }
      }
    }
  }

  // 右侧Menu按钮：固定尺寸，不挤压
  .mobile-menu-btn {
    flex-shrink: 0;
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

  // 超小屏移动端（320px~375px）适配：进一步缩小间距
  @media (max-width: 375px) {
    .mobile-search-lang-wrap {
      gap: 0.3rem;
    }
    .mobile-lang-selector :deep(.lang-trigger) {
      padding: 0.2rem 0.3rem;
    }
    .mobile-lang-selector :deep(.lang-flag) {
      width: 18px;
      height: 12px;
    }
  }
}

/* ———— 3. 移动端菜单适配 ———— */
.mobile-nav-menu {
  position: fixed;
  top: $nav-height;
  right: 0;
  width: 260px; // 固定宽度，不随屏幕变化
  height: calc(100vh - $nav-height);
  background: $white;
  z-index: 999;
  box-shadow: -2px 0 15px rgba(0, 0, 0, 0.1);
  overflow-y: auto;

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

.mobile-mask {
  position: fixed;
  top: $nav-height;
  left: 0;
  width: 100%;
  height: calc(100vh - $nav-height);
  background: rgba(0, 0, 0, 0.5);
  z-index: 998;
}

/* ———— 4. PC端导航适配（768px+） ———— */
.pc-nav-wrapper {
  width: 100%;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 9999;
  font-family: $main-sans-font;
}

// PC端顶部栏（社交链接 + 搜索框 + 国旗）
.pc-top-header {
  background-color: $primary-color;
  height: $pc-nav-top-height;
  display: flex;
  align-items: center;
  color: $white;
  padding: 0 20px;
  transition: all $transition-duration $transition-timing;
  overflow: hidden;

  .pc-top-header-inner {
    width: 100%;
    max-width: 1920px; // 大屏最大宽度，避免元素过宽
    margin: 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between; // 左右布局，右侧搜索框+国旗靠右
    gap: $gap-md;
  }

  // 左侧社交链接：自适应宽度，超出时省略
  .pc-social-links {
    display: flex;
    align-items: center;
    gap: 0.8rem;
    flex-shrink: 1; // 允许缩小，避免挤压右侧
    overflow: hidden; // 隐藏超出部分

    .pc-social-icon {
      transition: transform 0.2s $transition-timing;
      line-height: 0;

      &:hover {
        transform: scale(1.1);
      }

      .pc-icon-img {
        height: clamp(12px, 1.2vw, 16px); // 自适应图标大小
        width: auto;
        display: block;
        filter: brightness(0) invert(1); // 白色图标
      }
    }

    span {
      color: $white;
      opacity: 0.9;
      margin: 0 2px;
      font-size: clamp(9px, 0.7vw, 12px);
    }

    .pc-contact-text {
      color: $white;
      text-decoration: none;
      margin: 0 2px;
      font-size: clamp(9px, 0.7vw, 12px);
      white-space: nowrap; // 不换行，避免错乱
      overflow: hidden;
      text-overflow: ellipsis; // 超出部分省略号
    }

    // 小屏PC端适配：缩小间距
    @media (max-width: 1078px) and (min-width: 768px) {
      gap: 0.5rem;
    }
  }

  // 右侧：搜索框 + 国旗容器（flex布局，确保同行）
  .pc-search-lang-wrap {
    display: flex;
    align-items: center;
    gap: $gap-sm; // 搜索框与国旗间距
    flex-shrink: 0; // 禁止缩小，避免变形
  }

  // PC端搜索框：固定宽度范围，适配不同屏幕
  .pc-product-search {
    width: clamp(180px, 14vw, 280px); // 最小180px，最大280px
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
        display: block;
        object-fit: contain;
      }
    }
  }

  // PC端国旗：仅显国旗，随滚动同步样式
  .pc-lang-selector {
    :deep(.lang-selector-container) {
      // 隐藏语言文字，仅显国旗+箭头
      .lang-text,
      .lang-option-text {
        display: none !important;
      }

      // 触发器：紧凑布局，适配PC端顶部栏
      .lang-trigger {
        padding: 0.3rem 0.5rem;
        gap: 0.2rem;
        background-color: rgba(255, 255, 255, 0.2);
        border: 1px solid rgba(255, 255, 255, 0.3);
        border-radius: 4px;
        transition: all $transition-duration $transition-timing;

        .lang-flag {
          width: 20px;
          height: 14px;
          object-fit: cover;
          border-radius: 2px;
        }

        .lang-arrow {
          font-size: 0.7rem;
          color: $white;
        }
      }

      // 下拉菜单：对齐触发器，避免错位
      .lang-dropdown {
        width: 56px;
        top: calc(100% + 2px);
        left: 0;
        background-color: #2c3e50;
        border: 1px solid $primary-color;
        border-top: none;
        border-radius: 0 0 4px 4px;

        .lang-option {
          justify-content: center;
          padding: 0.4rem 0;
          transition: background-color $transition-duration $transition-timing;

          &:hover,
          &.selected {
            background-color: $primary-color;
          }

          .lang-flag {
            width: 20px;
            height: 14px;
            object-fit: cover;
          }
        }
      }
    }

    // 滚动后（is-scrolled）样式同步：与导航栏背景色匹配
    .pc-main-nav.is-scrolled & :deep(.lang-trigger) {
      background-color: rgba(0, 74, 153, 0.1);
      border-color: rgba(0, 74, 153, 0.2);

      .lang-arrow {
        color: $primary-color;
      }
    }
  }
}

// PC端主导航（滚动样式切换）
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
    justify-content: flex-end; // 导航项靠右
    align-items: center;
  }

  .pc-nav-menu {
    list-style: none;
    display: flex;
    gap: clamp(20px, 2vw, 60px); // 自适应间距（最小20px，最大60px）
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

      // 滚动前（透明背景）样式
      &:not(.pc-main-nav.is-scrolled) {
        .pc-nav-link {
          color: $white;
          text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
        }

        &:hover::before,
        &:hover::after,
        &.nav-active::before,
        &.nav-active::after {
          background-color: $white;
        }
      }

      // 滚动后（白色背景）样式
      &.pc-main-nav.is-scrolled {
        .pc-nav-link {
          color: $primary-color;
          text-shadow: 0 1px 2px rgba(0, 74, 153, 0.2);
        }

        &:hover::before,
        &:hover::after,
        &.nav-active::before,
        &.nav-active::after {
          background-color: $primary-color;
        }
      }

      // 导航项上下边框动画
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

      &:hover::before,
      &:hover::after,
      &.nav-active::before,
      &.nav-active::after {
        opacity: 1;
      }
    }

    // 小屏PC端适配：缩小导航项间距
    @media (max-width: 1078px) and (min-width: 768px) {
      gap: clamp(15px, 1.5vw, 30px);
    }
  }
}

/* ———— 5. 多端隐藏逻辑（避免样式冲突） ———— */
// 移动端隐藏PC端元素
@media (max-width: 767px) {
  .pc-logo-standalone,
  .pc-nav-wrapper {
    display: none !important;
  }
}

// PC端隐藏移动端元素
@media (min-width: 768px) {
  .mobile-top-bar,
  .mobile-nav-menu,
  .mobile-mask {
    display: none !important;
  }
}
</style>
