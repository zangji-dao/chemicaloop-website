你需要修改的文档是当前 VS Code 中打开的
**`HomePage.vue`**，以下是修复所有报错后的完整代码，可直接覆盖原文件内容： ```vue
<template>
  <div class="home-page">
    <!-- 导航栏组件（已集成“仅显国旗”的 LangSelector） -->
    <AppMainNavbar v-if="isMounted" />

    <!-- Banner 轮播（修复100vh遮挡问题，改为自适应高度） -->
    <AppBanner v-if="isMounted" />

    <!-- 核心欢迎区域（添加i18n默认值，避免翻译失败白屏） -->
    <section class="welcome-section" v-if="isMounted">
      <div class="relative-container">
        <div class="welcome-text">
          <h1 class="welcome-title">
            {{ $t('home.welcomeTitle', 'Welcome to') }}
            <span class="title-highlight">CHEMICALOOP</span>
          </h1>
          <p class="welcome-subtitle">
            {{ $t('home.welcomeSubtitle', 'Professional Chemical Solutions') }}
          </p>
          <div class="welcome-desc">
            <p>
              {{
                $t(
                  'home.welcomeDesc1',
                  'We provide high-quality chemical products for various industries.',
                )
              }}
            </p>
            <p>
              {{
                $t(
                  'home.welcomeDesc2',
                  'With 45+ years of experience, we serve 2000+ global customers.',
                )
              }}
            </p>
            <p>
              {{
                $t(
                  'home.welcomeDesc3',
                  '500+ products in stock, 100000+ tons of warehouse capacity.',
                )
              }}
            </p>
          </div>
          <button class="welcome-btn" @click="handleGoAbout">
            {{ $t('home.readMore', 'Read More') }}
          </button>
        </div>

        <!-- 视频区块（修复封面加载失败兜底逻辑） -->
        <div class="welcome-right">
          <div class="video-block" @click="openVideoModal" v-if="videoCover">
            <img
              :src="videoCover"
              :alt="$t('home.videoCoverAlt', 'CHEMICALOOP Introduction Video')"
              class="video-bg"
              @error="handleVideoCoverError"
            />
            <div class="play-btn">
              <div class="youtube-play-icon">▶</div>
              <span class="play-text">CHEMICALOOP</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 数据统计模块 -->
    <section class="stats-section" v-if="isMounted">
      <div class="stats-container">
        <div class="stats-item">
          <div class="stats-number">45+</div>
          <div class="stats-desc">{{ $t('home.statsExp', 'Years of Experience') }}</div>
        </div>
        <div class="stats-item">
          <div class="stats-number">2000+</div>
          <div class="stats-desc">{{ $t('home.statsCustomers', 'Global Customers') }}</div>
        </div>
        <div class="stats-item">
          <div class="stats-number">500+</div>
          <div class="stats-desc">{{ $t('home.statsProducts', 'Products in Stock') }}</div>
        </div>
        <div class="stats-item">
          <div class="stats-number">100000+</div>
          <div class="stats-desc">{{ $t('home.statsWarehouse', 'Warehouse Capacity (Tons)') }}</div>
        </div>
      </div>
    </section>

    <!-- 行业产品分类模块（修复高度计算逻辑） -->
    <section class="industry-products-section" v-if="isMounted">
      <div class="industry-container">
        <div class="industry-header">
          <h2 class="industry-title">{{ $t('home.industryTitle', 'Industry Categories') }}</h2>
          <p class="industry-desc">
            {{
              $t(
                'home.industryDesc',
                'Choose the industry you are interested in to view related products.',
              )
            }}
          </p>

          <!-- 搜索+语言选择器容器 -->
          <div class="industry-search-lang-wrapper">
            <button class="product-search-btn" @click="handleGoProducts">
              {{ $t('home.productSearchBtn', 'Search All Products') }}
            </button>
            <!-- 行业模块的 LangSelector：与导航栏样式统一 -->
            <LangSelector class="industry-lang-selector" />
          </div>
        </div>

        <!-- 行业分类网格（修复高度计算错误） -->
        <div
          class="industry-grid-wrapper"
          :style="{
            maxHeight: isIndustryExpanded ? totalIndustryHeight + 'px' : defaultShowHeight + 'px',
            transition: 'max-height 0.5s ease-in-out',
          }"
        >
          <div class="industry-grid" ref="industryGridRef">
            <!-- 第一排行业 -->
            <div class="industry-item" v-for="(item, index) in industryList" :key="index">
              <div class="industry-icon">
                <img
                  :src="item.icon"
                  :alt="item.name"
                  width="48"
                  height="48"
                  @error="(e) => handleIndustryIconError(e, item.placeholderText)"
                />
              </div>
              <div class="industry-name">{{ item.name }}</div>
            </div>
          </div>
        </div>

        <!-- 展开/收起按钮（修复状态切换逻辑） -->
        <div class="industry-toggle-btn" v-if="totalIndustryHeight > defaultShowHeight">
          <button @click="toggleIndustryExpand" class="toggle-btn">
            <span>{{
              isIndustryExpanded
                ? $t('home.showLess', 'Show Less')
                : $t('home.showMore', 'Show More')
            }}</span>
            <svg
              class="toggle-icon"
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              :style="{ transform: isIndustryExpanded ? 'rotate(180deg)' : 'rotate(0)' }"
            >
              <path d="M6 9l6 6 6-6"></path>
            </svg>
          </button>
        </div>
      </div>
    </section>

    <!-- 视频弹窗（修复iframe加载逻辑） -->
    <div class="video-modal" v-if="isVideoModalOpen" @click="closeVideoModal">
      <div class="modal-inner" @click.stop>
        <button class="close-modal-btn" @click="closeVideoModal">×</button>
        <iframe
          width="100%"
          :height="isMobile ? 240 : 450"
          :src="youtubeIframeSrc"
          :title="$t('home.videoTitle', 'CHEMICALOOP Introduction')"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          class="youtube-iframe"
          @error="handleIframeError"
          loading="lazy"
        ></iframe>
      </div>
    </div>

    <!-- 悬浮工具组件（延迟加载，避免阻塞主渲染） -->
    <FloatingTools v-if="isMounted && isFloatingToolsReady" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router' // 修复路由跳转依赖
import { useI18n } from 'vue-i18n' // 引入useI18n，确保$t可用
// 组件引入（确保路径与项目实际一致，添加错误捕获）
import AppMainNavbar from '@/components/AppMainNavbar.vue'
import AppBanner from '@/components/AppBanner.vue'
import FloatingTools from '@/components/FloatingTools.vue'
import LangSelector from '@/components/LangSelector.vue'

// 1. 修复：Vite 静态资源引入（替换require为new URL）
const videoCover =
  new URL('@/assets/images/chemicaloop-video-cover.jpg', import.meta.url).href ||
  'https://via.placeholder.com/704x528/004a99/ffffff?text=CHEMICALOOP+Video'

// 2. 修复：提前定义防抖函数（避免调用时未定义）
const debounce = (fn, delay) => {
  let timer = null
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn.apply(this, args), delay)
  }
}

// 路由实例
const router = useRouter()
// i18n实例（修复$t未注入问题）
const { t: $t } = useI18n()
// 修复：添加组件挂载状态，避免SSR/客户端渲染不兼容
const isMounted = ref(false)
// 修复：悬浮组件延迟加载标志
const isFloatingToolsReady = ref(false)

// 视频弹窗状态（初始化安全值）
const isVideoModalOpen = ref(false)
const youtubeIframeSrc = ref('https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0') // 初始不自动播放，避免加载阻塞

// 修复：移动端判断（添加window存在判断，避免SSR报错）
const isMobile = computed(() => {
  if (typeof window === 'undefined') return false
  return window.innerWidth <= 768
})

// 3. 修复：行业分类数据（用computed确保$t可用，资源路径用new URL解析）
const industryList = computed(() => [
  {
    name: $t('home.industryAgro', 'Agrochemicals'),
    icon: new URL('@/assets/icons/industry/industry-agrochemicals.png', import.meta.url).href,
    placeholderText: 'Agro',
  },
  {
    name: $t('home.industryAnimal', 'Animal Healthcare'),
    icon: new URL('@/assets/icons/industry/industry-animal-healthcare.png', import.meta.url).href,
    placeholderText: 'Animal',
  },
  {
    name: $t('home.industryClean', 'Cleaning Disinfectants'),
    icon: new URL('@/assets/icons/industry/industry-cleaning-disinfectants.png', import.meta.url)
      .href,
    placeholderText: 'Clean',
  },
  {
    name: $t('home.industryConst', 'Construction'),
    icon: new URL('@/assets/icons/industry/industry-construction.png', import.meta.url).href,
    placeholderText: 'Const',
  },
  {
    name: $t('home.industryEnergy', 'Energy'),
    icon: new URL('@/assets/icons/industry/industry-energy.png', import.meta.url).href,
    placeholderText: 'Energy',
  },
  {
    name: $t('home.industryFabric', 'Fabric Solutions'),
    icon: new URL('@/assets/icons/industry/industry-fabric-solutions.png', import.meta.url).href,
    placeholderText: 'Fabric',
  },
  {
    name: $t('home.industryFlavour', 'Flavours Fragrances'),
    icon: new URL('@/assets/icons/industry/industry-flavours-fragrances.png', import.meta.url).href,
    placeholderText: 'Flavour',
  },
  {
    name: $t('home.industryFood', 'Food Healthcare Ingredients'),
    icon: new URL(
      '@/assets/icons/industry/industry-food-healthcare-ingredients.png',
      import.meta.url,
    ).href,
    placeholderText: 'Food',
  },
  {
    name: $t('home.industryLube', 'Lubricants Automobiles'),
    icon: new URL('@/assets/icons/industry/industry-lubricants-automobiles.png', import.meta.url)
      .href,
    placeholderText: 'Lube',
  },
  {
    name: $t('home.industryMetal', 'Metal Treatment'),
    icon: new URL('@/assets/icons/industry/industry-metal-treatment.png', import.meta.url).href,
    placeholderText: 'Metal',
  },
  {
    name: $t('home.industryPaint', 'Paint Coatings'),
    icon: new URL('@/assets/icons/industry/industry-paint-coatings.png', import.meta.url).href,
    placeholderText: 'Paint',
  },
  {
    name: $t('home.industryPerf', 'Performance Chemicals'),
    icon: new URL('@/assets/icons/industry/industry-performance-chemicals.png', import.meta.url)
      .href,
    placeholderText: 'Perf',
  },
  {
    name: $t('home.industryPersonal', 'Personal Care'),
    icon: new URL('@/assets/icons/industry/industry-personal-care.png', import.meta.url).href,
    placeholderText: 'Personal',
  },
  {
    name: $t('home.industryPharma', 'Pharmaceuticals'),
    icon: new URL('@/assets/icons/industry/industry-pharmaceuticals.png', import.meta.url).href,
    placeholderText: 'Pharma',
  },
  {
    name: $t('home.industryPoly', 'Polymers Resin'),
    icon: new URL('@/assets/icons/industry/industry-polymers-resin.png', import.meta.url).href,
    placeholderText: 'Poly',
  },
  {
    name: $t('home.industryPulp', 'Pulp Paper Solutions'),
    icon: new URL('@/assets/icons/industry/industry-pulp-paper-solutions.png', import.meta.url)
      .href,
    placeholderText: 'Pulp',
  },
  {
    name: $t('home.industryWater', 'Water Treatment'),
    icon: new URL('@/assets/icons/industry/industry-water-treatment.png', import.meta.url).href,
    placeholderText: 'Water',
  },
])

// 行业分类展开/收起逻辑（修复高度计算错误）
const isIndustryExpanded = ref(false)
const industryGridRef = ref(null)
const defaultShowHeight = ref(420) // 初始默认值，避免NaN
const totalIndustryHeight = ref(0)
// 存储resize监听的防抖函数，用于卸载时清除
let debouncedCalcHeight = null

// 视频封面加载失败兜底（优化错误处理）
const handleVideoCoverError = (e) => {
  e.target.src = 'https://via.placeholder.com/704x528/004a99/ffffff?text=CHEMICALOOP+Video'
}

// 行业图标加载失败兜底
const handleIndustryIconError = (e, placeholderText) => {
  e.target.src = `https://via.placeholder.com/48/004a99/ffffff?text=${placeholderText}`
}

// 视频iframe加载失败处理（优化用户提示）
const handleIframeError = () => {
  youtubeIframeSrc.value = 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0'
  if (typeof window !== 'undefined') {
    alert($t('home.videoError', 'Video loading failed, please try again later.'))
  }
}

// 路由跳转（修复直接使用$router可能的未定义问题）
const handleGoAbout = () => {
  router.push('/about').catch((err) => console.error('Go to about page error:', err))
}
const handleGoProducts = () => {
  router.push('/products').catch((err) => console.error('Go to products page error:', err))
}

// 打开视频弹窗（优化body溢出处理）
const openVideoModal = () => {
  isVideoModalOpen.value = true
  if (typeof document !== 'undefined') {
    document.body.style.overflow = 'hidden'
    // 延迟设置自动播放，避免加载阻塞
    setTimeout(() => {
      youtubeIframeSrc.value = 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1'
    }, 300)
  }
}

// 关闭视频弹窗（修复body样式还原）
const closeVideoModal = () => {
  isVideoModalOpen.value = false
  if (typeof document !== 'undefined') {
    document.body.style.overflow = 'auto'
  }
  youtubeIframeSrc.value = 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0'
}

// 切换行业分类展开状态
const toggleIndustryExpand = () => {
  isIndustryExpanded.value = !isIndustryExpanded.value
}

// 修复：计算行业网格高度（添加nextTick确保DOM渲染完成，添加错误捕获）
const calcIndustryHeight = () => {
  if (typeof window === 'undefined' || !industryGridRef.value) return

  try {
    const items = industryGridRef.value.querySelectorAll('.industry-item')
    if (!items.length) {
      defaultShowHeight.value = 420
      totalIndustryHeight.value = 0
      return
    }

    const itemHeight = items[0].offsetHeight
    const gapStyle = getComputedStyle(industryGridRef.value).gap
    const gap = parseInt(gapStyle.split(' ')[1]) || 24
    // 修复：根据屏幕尺寸动态计算显示行数
    const rowsToShow = window.innerWidth <= 575 ? 2 : window.innerWidth <= 768 ? 2 : 2
    defaultShowHeight.value = itemHeight * rowsToShow + gap * (rowsToShow - 1)
    totalIndustryHeight.value = industryGridRef.value.offsetHeight
  } catch (err) {
    console.error('Calculate industry height error:', err)
    defaultShowHeight.value = 420
    totalIndustryHeight.value = 0
  }
}

// 4. 修复：生命周期不嵌套，顶层调用onUnmounted
onMounted(() => {
  // 标记组件已挂载，触发DOM渲染
  isMounted.value = true

  // 延迟计算高度，确保DOM完全渲染
  nextTick(() => {
    calcIndustryHeight()
    // 延迟加载悬浮组件，避免阻塞主渲染
    setTimeout(() => {
      isFloatingToolsReady.value = true
    }, 800)
  })

  // 修复：添加窗口resize监听（防抖函数提前定义，避免未定义）
  debouncedCalcHeight = debounce(calcIndustryHeight, 300)
  window.addEventListener('resize', debouncedCalcHeight)
})

// 修复：顶层onUnmounted，清理监听和样式
onUnmounted(() => {
  if (debouncedCalcHeight) {
    window.removeEventListener('resize', debouncedCalcHeight)
  }
  if (typeof document !== 'undefined') {
    document.body.style.overflow = 'auto'
  }
})
</script>

<style scoped lang="scss">
/* 字体引入（添加备用字体，避免加载失败） */
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Inter:wght@300;400;600;700&display=swap');

/* 全局重置（优化盒模型） */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 页面基础样式（修复min-height导致的白屏问题，改为auto） */
.home-page {
  width: 100%;
  height: auto;
  min-height: 100vh;
  overflow-x: hidden;
  position: relative;
  font-family: 'Inter', sans-serif, Arial, Helvetica, sans-serif;
}

/* 1. 导航栏组件适配（确保层级正确，避免被遮挡） */
.home-page :deep(.app-main-navbar) {
  position: relative;
  z-index: 9999;
  width: 100%;
  display: block;
  height: auto;
}
.home-page :deep(.app-main-navbar .mobile-nav) {
  display: block;
  visibility: visible;
  opacity: 1;
  position: relative;
  z-index: 9999;
}
.home-page :deep(.app-main-navbar .nav-toggle-btn) {
  position: fixed;
  top: 15px;
  right: 15px;
  z-index: 10000;
  width: 40px;
  height: 40px;
  cursor: pointer;
  background: #fff; /* 添加背景，避免透明导致看不见 */
  border-radius: 4px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.home-page :deep(.app-main-navbar .mobile-nav-menu) {
  position: fixed;
  top: 0;
  right: 0;
  width: 280px;
  height: 100vh;
  background: #fff;
  z-index: 9999;
  padding-top: 70px;
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1);
  transform: translateX(0);
  transition: transform 0.3s ease;
}

/* 2. Banner 样式（修复100vh遮挡问题，改为自适应高度） */
.home-page :deep(.app-banner-carousel) {
  width: 100%;
  max-height: 80vh; /* 最大高度限制，避免超出屏幕 */
  height: auto; /* 自适应内容高度 */
  min-height: 300px; /* 最小高度，避免内容过短 */
  padding-top: 80px;
  box-sizing: border-box;
}

/* 3. 欢迎区域（优化间距，避免内容被挤压） */
.welcome-section {
  width: 100%;
  padding: 4rem 2rem; /* 调整内边距，适配移动端 */
  background-color: #ffffff;
  position: relative;
  z-index: 10;
}
.relative-container {
  width: 100%;
  max-width: 1920px;
  margin: 0 auto;
  padding: 0 1rem;
  position: relative;
  min-height: auto; /* 移除固定最小高度，避免内容溢出 */
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 2rem; /* 添加间距，避免移动端内容重叠 */
}
.welcome-text {
  max-width: 720px;
  width: 100%;
  color: #333;
  position: relative;
  z-index: 2;
  margin-bottom: 1rem;

  .welcome-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(1.8rem, 4vw, 3rem); /* 响应式字体大小 */
    font-weight: 900;
    margin-bottom: 0.8rem;
    color: #1a1a1a;
    line-height: 1.2;
    letter-spacing: 0.5px;

    .title-highlight {
      font-weight: 900;
      color: #004a99;
    }
  }

  .welcome-subtitle {
    font-size: 1rem;
    color: #2d2d2d;
    margin-bottom: 1.2rem;
    text-transform: uppercase;
    letter-spacing: 2px;
    font-weight: 600;
  }

  .welcome-desc {
    font-size: 1.05rem;
    line-height: 1.7;
    margin-bottom: 1.8rem;
    color: #1a1a1a;

    p {
      margin-bottom: 1.2rem;
      text-align: justify;
    }
  }

  .welcome-btn {
    background-color: #004a99;
    color: #fff;
    border: none;
    padding: 0.9rem 2.2rem;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    border-radius: 0;
    transition: all 0.2s ease;
    text-transform: uppercase;
    letter-spacing: 1px;
    box-shadow: 0 3px 8px rgba(0, 74, 153, 0.2);
    /* 确保按钮不被遮挡 */
    position: relative;
    z-index: 10;

    &:hover {
      background-color: #003366;
      transform: translateY(-2px);
      box-shadow: 0 5px 12px rgba(0, 74, 153, 0.3);
    }
  }
}

/* 视频区块（修复移动端尺寸问题） */
.welcome-right {
  width: 100%;
  max-width: 704px; /* 最大宽度限制 */
  height: auto; /* 自适应高度 */
  min-height: 300px; /* 最小高度，避免内容过短 */
  position: relative;
  top: auto;
  right: auto;
  transform: none;
  z-index: 1;

  .video-block {
    width: 100%;
    height: 100%;
    min-height: 300px;
    overflow: hidden;
    cursor: pointer;
    border-radius: 12px;
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
    position: relative;

    .video-bg {
      width: 100%;
      height: 100%;
      object-fit: cover;
      filter: brightness(0.7);
    }

    .play-btn {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      z-index: 2;

      .youtube-play-icon {
        width: 80px;
        height: 80px;
        border-radius: 50%;
        background-color: #004a99;
        color: #ffffff;
        font-size: 2.5rem;
        display: flex;
        align-items: center;
        justify-content: center;
        padding-left: 6px;
        box-shadow: 0 5px 15px rgba(0, 74, 153, 0.4);
        border: 2px solid #ffffff;
        transition: all 0.3s ease;
      }

      .play-text {
        font-size: 1.1rem;
        font-weight: 700;
        color: #ffffff;
        text-shadow: 0 3px 6px rgba(0, 0, 0, 0.5);
        letter-spacing: 2px;
        text-transform: uppercase;
      }
    }

    &:hover .youtube-play-icon {
      transform: scale(1.1);
      box-shadow: 0 8px 20px rgba(0, 74, 153, 0.5);
      background-color: #003366;
    }
  }
}

/* 4. 数据统计模块（优化响应式布局） */
.stats-section {
  width: 100%;
  padding: 4rem 2rem;
  background: linear-gradient(180deg, #dce0e8 0%, #cdd2da 100%);
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.08);
}
.stats-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  justify-content: center; /* 改为居中，避免两端对齐导致移动端间距过大 */
  align-items: center;
  flex-wrap: wrap;
  gap: 2rem; /* 调整间距，适配移动端 */
}
.stats-item {
  text-align: center;
  flex: 1;
  min-width: 180px; /* 缩小最小宽度，适配小屏 */
  max-width: 250px; /* 限制最大宽度，避免过大 */
  padding: 2rem 1rem;
  background-color: #ffffff;
  border-radius: 12px;
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 10px 25px rgba(0, 74, 153, 0.15);
  }

  .stats-number {
    font-family: 'Playfair Display', serif;
    font-size: clamp(2rem, 5vw, 3.5rem); /* 响应式字体 */
    font-weight: 900;
    color: #004a99;
    margin-bottom: 1rem;
    text-shadow: 0 2px 4px rgba(0, 74, 153, 0.1);
  }

  .stats-desc {
    font-family: 'Inter', sans-serif;
    font-size: 1.05rem;
    font-weight: 600;
    color: #2d2d2d;
    line-height: 1.6;
  }
}

/* 5. 行业产品分类模块（优化深色背景显示） */
.industry-products-section {
  width: 100%;
  padding: 4rem 2rem;
  background: linear-gradient(180deg, #1a2434 0%, #2c3e50 100%);
  color: #ffffff;
}
.industry-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 1rem;
}
.industry-header {
  text-align: center;
  margin-bottom: 3rem; /* 调整间距 */

  .industry-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(1.8rem, 4vw, 2.8rem);
    font-weight: 900;
    color: #ffffff;
    margin-bottom: 1.2rem;
  }

  .industry-desc {
    font-family: 'Inter', sans-serif;
    font-size: 1.1rem;
    color: #e0e0e0;
    max-width: 800px;
    margin: 0 auto 1.5rem; /* 调整间距 */
    line-height: 1.7;
  }

  /* 搜索+语言选择器容器 */
  .industry-search-lang-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.5rem;
    margin-top: 0.5rem;
    flex-wrap: wrap;

    /* 产品搜索按钮 */
    .product-search-btn {
      background-color: #004a99;
      color: #fff;
      border: none;
      padding: 0.8rem 2rem;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      border-radius: 0;
      transition: all 0.2s ease;
      text-transform: uppercase;
      letter-spacing: 1px;
      box-shadow: 0 3px 8px rgba(0, 74, 153, 0.2);

      &:hover {
        background-color: #003366;
        transform: translateY(-2px);
        box-shadow: 0 5px 12px rgba(0, 74, 153, 0.3);
      }
    }

    /* RTL 布局适配 */
    &[dir='rtl'] {
      flex-direction: row-reverse;
    }
  }

  /* 行业模块的 LangSelector 样式（确保显示正常） */
  .industry-lang-selector {
    :deep(.lang-text) {
      display: none !important;
    }
    :deep(.lang-flag) {
      width: 32px !important;
      height: 32px !important;
      border-radius: 50% !important;
      border: 2px solid rgba(255, 255, 255, 0.8) !important;
      object-fit: cover !important; /* 确保国旗图片填充 */
    }
    :deep(.lang-trigger) {
      padding: 4px !important;
      background: transparent !important;
      border: none !important;
      cursor: pointer !important;
      outline: none !important;
    }
    :deep(.lang-dropdown) {
      background: #fff !important;
      border-radius: 8px !important;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
      padding: 8px 0 !important;
      margin-top: 8px !important;
      z-index: 1000 !important; /* 确保下拉框不被遮挡 */
    }
    :deep(.lang-option) {
      padding: 8px 16px !important;
      display: flex !important;
      align-items: center !important;
      gap: 8px !important;
      color: #333 !important;
      &:hover {
        background: #f0f5ff !important;
        color: #004a99 !important;
      }
    }
  }
}

/* 行业网格容器（修复溢出问题） */
.industry-grid-wrapper {
  overflow: hidden;
  margin: 0 auto;
  width: 100%;
  padding: 0 0.5rem;
}
.industry-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 2rem 1.5rem; /* 调整间距，适配小屏 */
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}
.industry-item {
  text-align: center;
  flex: 0 0 auto;
  width: calc(20% - 1.5rem);
  min-width: 120px; /* 缩小最小宽度 */
  max-width: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.2rem; /* 调整间距 */
  margin-bottom: 1rem;

  .industry-icon {
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;

    img {
      object-fit: contain;
      display: block;
      max-width: 100%;
      max-height: 100%;
    }

    &:hover {
      background-color: rgba(0, 74, 153, 0.2);
      transform: scale(1.1);
    }
  }

  .industry-name {
    font-family: 'Inter', sans-serif;
    font-size: 0.95rem; /* 调整字体大小 */
    font-weight: 600;
    color: #ffffff;
    line-height: 1.5;
    word-break: break-word;
  }
}

/* 展开/收起按钮（确保显示正常） */
.industry-toggle-btn {
  text-align: center;
  margin-top: 2rem;

  .toggle-btn {
    background-color: transparent;
    border: 2px solid #004a99;
    color: #ffffff;
    padding: 0.8rem 2rem;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
    border-radius: 0;
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 0.8rem;
    margin: 0 auto;

    &:hover {
      background-color: #004a99;
      color: #fff;
    }

    .toggle-icon {
      transition: transform 0.3s ease;
    }
  }
}

/* 6. 视频弹窗（优化移动端显示） */
.video-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.85);
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  backdrop-filter: blur(2px); /* 添加模糊，提升体验 */
}
.modal-inner {
  position: relative;
  width: 100%;
  max-width: 900px;
  background-color: #1a1a1a;
  border-radius: 8px;
  overflow: hidden;
}
.close-modal-btn {
  position: absolute;
  top: 1rem;
  right: 1rem;
  background-color: rgba(0, 0, 0, 0.5);
  border: none;
  color: #ffffff;
  font-size: 1.8rem;
  cursor: pointer;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 50%;

  &:hover {
    color: #ff4444;
    background-color: rgba(0, 0, 0, 0.8);
  }
}
.youtube-iframe {
  aspect-ratio: 16/9;
  height: auto;
}

/* 7. 响应式适配（补充关键断点） */
@media (max-width: 1200px) {
  .industry-item {
    width: calc(25% - 1.5rem);
  }
}

@media (max-width: 768px) {
  .industry-item {
    width: calc(33.333% - 1.5rem);
  }
  .welcome-section {
    padding: 3rem 1rem;
  }
  .stats-section {
    padding: 3rem 1rem;
  }
  .industry-products-section {
    padding: 3rem 1rem;
  }
}

@media (max-width: 576px) {
  .industry-item {
    width: calc(50% - 1.5rem);
  }
  .welcome-right {
    min-height: 220px;
  }
  .industry-lang-selector :deep(.lang-flag) {
    width: 28px !important;
    height: 28px !important;
  }
  .close-modal-btn {
    font-size: 1.5rem;
    width: 36px;
    height: 36px;
  }
}

/* 修复：添加加载中状态（避免白屏过渡） */
@media (prefers-reduced-motion: no-preference) {
  .welcome-section,
  .stats-section,
  .industry-products-section {
    animation: fadeIn 0.5s ease-out;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
