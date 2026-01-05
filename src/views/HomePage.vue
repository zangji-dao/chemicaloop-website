<template>
  <div class="home-page">
    <!-- 导航栏组件（仅客户端挂载，避免SSR冲突） -->
    <AppMainNavbar v-if="isMounted" />

    <!-- Banner 轮播（适配导航栏高度，避免重复padding） -->
    <AppBanner
      v-if="isMounted"
      :navBarHeight="80"
      :autoplay="true"
      :autoplayInterval="5000"
    />

    <!-- 核心欢迎区域（i18n默认值兜底，避免翻译失败） -->
    <section class="welcome-section" v-if="isMounted">
      <div class="relative-container">
        <div class="welcome-text">
          <h1 class="welcome-title">
            {{ t('home.welcomeTitle', 'Welcome to') }}
            <span class="title-highlight">CHEMICALOOP</span>
          </h1>
          <p class="welcome-subtitle">
            {{ t('home.welcomeSubtitle', 'Professional Chemical Solutions') }}
          </p>
          <div class="welcome-desc">
            <p>{{ t('home.welcomeDesc1', 'We provide high-quality chemical products for various industries.') }}</p>
            <p>{{ t('home.welcomeDesc2', 'With 45+ years of experience, we serve 2000+ global customers.') }}</p>
            <p>{{ t('home.welcomeDesc3', '500+ products in stock, 100000+ tons of warehouse capacity.') }}</p>
          </div>
          <button class="welcome-btn" @click="handleGoAbout">
            {{ t('home.readMore', 'Read More') }}
          </button>
        </div>

        <!-- 视频区块（兜底图+加载状态） -->
        <div class="welcome-right">
          <div class="video-block" @click="openVideoModal" v-if="videoCover">
            <img
              :src="videoCover"
              :alt="t('home.videoCoverAlt', 'CHEMICALOOP Introduction Video')"
              class="video-bg"
              @error="handleVideoCoverError"
              loading="lazy"
            />
            <div class="play-btn">
              <div class="youtube-play-icon">▶</div>
              <span class="play-text">CHEMICALOOP</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 数据统计模块（响应式布局优化） -->
    <section class="stats-section" v-if="isMounted">
      <div class="stats-container">
        <div class="stats-item" v-for="(item, idx) in statsList" :key="idx">
          <div class="stats-number">{{ item.number }}</div>
          <div class="stats-desc">{{ t(item.key, item.default) }}</div>
        </div>
      </div>
    </section>

    <!-- 行业产品分类模块（修复高度计算+响应式网格） -->
    <section class="industry-products-section" v-if="isMounted">
      <div class="industry-container">
        <div class="industry-header">
          <h2 class="industry-title">{{ t('home.industryTitle', 'Industry Categories') }}</h2>
          <p class="industry-desc">
            {{ t('home.industryDesc', 'Choose the industry you are interested in to view related products.') }}
          </p>
          <div class="industry-search-lang-wrapper">
            <button class="product-search-btn" @click="handleGoProducts">
              {{ t('home.productSearchBtn', 'Search All Products') }}
            </button>
          </div>
        </div>

        <!-- 行业分类网格（动态高度+平滑过渡） -->
        <div
          class="industry-grid-wrapper"
          :style="{
            maxHeight: isIndustryExpanded ? `${totalIndustryHeight}px` : `${defaultShowHeight}px`,
            transition: 'max-height 0.5s ease-in-out',
          }"
        >
          <div class="industry-grid" ref="industryGridRef">
            <div
              class="industry-item"
              v-for="(item, index) in industryList"
              :key="index"
              @click="handleIndustryClick(item)"
            >
              <div class="industry-icon">
                <img
                  :src="item.icon"
                  :alt="item.name"
                  width="48"
                  height="48"
                  @error="(e) => handleIndustryIconError(e, item.placeholderText)"
                  loading="lazy"
                />
              </div>
              <div class="industry-name">{{ item.name }}</div>
            </div>
          </div>
        </div>

        <!-- 展开/收起按钮（仅高度超出时显示） -->
        <div class="industry-toggle-btn" v-if="totalIndustryHeight > defaultShowHeight">
          <button @click="toggleIndustryExpand" class="toggle-btn">
            <span>{{ isIndustryExpanded ? t('home.showLess', 'Show Less') : t('home.showMore', 'Show More') }}</span>
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
              :class="{ 'rotated': isIndustryExpanded }"
            >
              <path d="M6 9l6 6 6-6"></path>
            </svg>
          </button>
        </div>
      </div>
    </section>

    <!-- 视频弹窗（符合YouTube自动播放政策） -->
    <div class="video-modal" v-if="isVideoModalOpen" @click="closeVideoModal">
      <div class="modal-inner" @click.stop>
        <button class="close-modal-btn" @click="closeVideoModal">×</button>
        <iframe
          width="100%"
          :height="isMobile ? 240 : 450"
          :src="youtubeIframeSrc"
          :title="t('home.videoTitle', 'CHEMICALOOP Introduction')"
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          class="youtube-iframe"
          @error="handleIframeError"
          loading="lazy"
        ></iframe>
      </div>
    </div>

    <!-- 悬浮工具组件（延迟加载，不阻塞首屏） -->
    <FloatingTools v-if="isMounted && isFloatingToolsReady" />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

// 组件引入
import AppMainNavbar from '@/components/AppMainNavbar.vue'
import AppBanner from '@/components/AppBanner.vue'
import FloatingTools from '@/components/FloatingTools.vue'

// 初始化核心实例
const router = useRouter()
const { t } = useI18n() // 正确的i18n使用方式

// ========== 基础状态管理 ==========
// 组件挂载状态（避免SSR/客户端渲染冲突）
const isMounted = ref(false)
// 悬浮组件延迟加载
const isFloatingToolsReady = ref(false)

// ========== 视频相关 ==========
// 视频封面（Vite静态资源解析+兜底）
const videoCover = ref(
  new URL('@/assets/images/chemicaloop-video-cover.jpg', import.meta.url).href ||
  'https://via.placeholder.com/704x528/004a99/ffffff?text=CHEMICALOOP+Video'
)
// 视频弹窗状态
const isVideoModalOpen = ref(false)
// YouTube iframe地址（添加mute=1符合自动播放政策）
const youtubeIframeSrc = ref('https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0&mute=1')

// ========== 响应式判断 ==========
const isMobile = computed(() => {
  if (typeof window === 'undefined') return false
  return window.innerWidth <= 768
})

// ========== 数据统计配置 ==========
const statsList = ref([
  { number: '45+', key: 'home.statsExp', default: 'Years of Experience' },
  { number: '2000+', key: 'home.statsCustomers', default: 'Global Customers' },
  { number: '500+', key: 'home.statsProducts', default: 'Products in Stock' },
  { number: '100000+', key: 'home.statsWarehouse', default: 'Warehouse Capacity (Tons)' }
])

// ========== 行业分类配置 ==========
const industryList = computed(() => [
  {
    name: t('home.industryAgro', 'Agrochemicals'),
    icon: new URL('@/assets/icons/industry/industry-agrochemicals.png', import.meta.url).href,
    placeholderText: 'Agro',
    path: '/products/agrochemicals'
  },
  {
    name: t('home.industryAnimal', 'Animal Healthcare'),
    icon: new URL('@/assets/icons/industry/industry-animal-healthcare.png', import.meta.url).href,
    placeholderText: 'Animal',
    path: '/products/animal-healthcare'
  },
  {
    name: t('home.industryClean', 'Cleaning Disinfectants'),
    icon: new URL('@/assets/icons/industry/industry-cleaning-disinfectants.png', import.meta.url).href,
    placeholderText: 'Clean',
    path: '/products/cleaning-disinfectants'
  },
  {
    name: t('home.industryConst', 'Construction'),
    icon: new URL('@/assets/icons/industry/industry-construction.png', import.meta.url).href,
    placeholderText: 'Const',
    path: '/products/construction'
  },
  {
    name: t('home.industryEnergy', 'Energy'),
    icon: new URL('@/assets/icons/industry/industry-energy.png', import.meta.url).href,
    placeholderText: 'Energy',
    path: '/products/energy'
  },
  {
    name: t('home.industryFabric', 'Fabric Solutions'),
    icon: new URL('@/assets/icons/industry/industry-fabric-solutions.png', import.meta.url).href,
    placeholderText: 'Fabric',
    path: '/products/fabric-solutions'
  },
  {
    name: t('home.industryFlavour', 'Flavours Fragrances'),
    icon: new URL('@/assets/icons/industry/industry-flavours-fragrances.png', import.meta.url).href,
    placeholderText: 'Flavour',
    path: '/products/flavours-fragrances'
  },
  {
    name: t('home.industryFood', 'Food Healthcare Ingredients'),
    icon: new URL('@/assets/icons/industry/industry-food-healthcare-ingredients.png', import.meta.url).href,
    placeholderText: 'Food',
    path: '/products/food-healthcare-ingredients'
  },
  {
    name: t('home.industryLube', 'Lubricants Automobiles'),
    icon: new URL('@/assets/icons/industry/industry-lubricants-automobiles.png', import.meta.url).href,
    placeholderText: 'Lube',
    path: '/products/lubricants-automobiles'
  },
  {
    name: t('home.industryMetal', 'Metal Treatment'),
    icon: new URL('@/assets/icons/industry/industry-metal-treatment.png', import.meta.url).href,
    placeholderText: 'Metal',
    path: '/products/metal-treatment'
  },
  {
    name: t('home.industryPaint', 'Paint Coatings'),
    icon: new URL('@/assets/icons/industry/industry-paint-coatings.png', import.meta.url).href,
    placeholderText: 'Paint',
    path: '/products/paint-coatings'
  },
  {
    name: t('home.industryPerf', 'Performance Chemicals'),
    icon: new URL('@/assets/icons/industry/industry-performance-chemicals.png', import.meta.url).href,
    placeholderText: 'Perf',
    path: '/products/performance-chemicals'
  },
  {
    name: t('home.industryPersonal', 'Personal Care'),
    icon: new URL('@/assets/icons/industry/industry-personal-care.png', import.meta.url).href,
    placeholderText: 'Personal',
    path: '/products/personal-care'
  },
  {
    name: t('home.industryPharma', 'Pharmaceuticals'),
    icon: new URL('@/assets/icons/industry/industry-pharmaceuticals.png', import.meta.url).href,
    placeholderText: 'Pharma',
    path: '/products/pharmaceuticals'
  },
  {
    name: t('home.industryPoly', 'Polymers Resin'),
    icon: new URL('@/assets/icons/industry/industry-polymers-resin.png', import.meta.url).href,
    placeholderText: 'Poly',
    path: '/products/polymers-resin'
  },
  {
    name: t('home.industryPulp', 'Pulp Paper Solutions'),
    icon: new URL('@/assets/icons/industry/industry-pulp-paper-solutions.png', import.meta.url).href,
    placeholderText: 'Pulp',
    path: '/products/pulp-paper-solutions'
  },
  {
    name: t('home.industryWater', 'Water Treatment'),
    icon: new URL('@/assets/icons/industry/industry-water-treatment.png', import.meta.url).href,
    placeholderText: 'Water',
    path: '/products/water-treatment'
  }
])

// ========== 行业分类展开/收起逻辑 ==========
const isIndustryExpanded = ref(false)
const industryGridRef = ref(null)
const defaultShowHeight = ref(420)
const totalIndustryHeight = ref(0)
let debouncedCalcHeight = null

// 防抖函数（通用封装）
const debounce = (fn, delay = 300) => {
  let timer = null
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

// 计算行业网格高度（容错+动态适配）
const calcIndustryHeight = () => {
  if (typeof window === 'undefined' || !industryGridRef.value) return

  try {
    const grid = industryGridRef.value
    totalIndustryHeight.value = grid.offsetHeight

    // 根据屏幕尺寸动态计算默认显示高度
    const itemHeight = grid.querySelector('.industry-item')?.offsetHeight || 120
    const gap = parseInt(getComputedStyle(grid).gap) || 24
    const rows = window.innerWidth <= 576 ? 2 : window.innerWidth <= 768 ? 3 : 4
    defaultShowHeight.value = itemHeight * rows + gap * (rows - 1)
  } catch (err) {
    console.error('计算行业分类高度失败:', err)
    defaultShowHeight.value = 420
    totalIndustryHeight.value = 0
  }
}

// 切换行业分类展开状态
const toggleIndustryExpand = () => {
  isIndustryExpanded.value = !isIndustryExpanded.value
}

// ========== 事件处理函数 ==========
// 视频封面加载失败兜底
const handleVideoCoverError = (e) => {
  e.target.src = 'https://via.placeholder.com/704x528/004a99/ffffff?text=CHEMICALOOP+Video'
}

// 行业图标加载失败兜底
const handleIndustryIconError = (e, placeholderText) => {
  e.target.src = `https://via.placeholder.com/48/004a99/ffffff?text=${placeholderText}`
}

// iframe加载失败处理
const handleIframeError = () => {
  youtubeIframeSrc.value = 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0&mute=1'
  if (typeof window !== 'undefined') {
    alert(t('home.videoError', 'Video loading failed, please try again later.'))
  }
}

// 路由跳转（错误捕获+用户交互）
const handleGoAbout = () => {
  router.push('/about').catch(err => console.error('跳转到关于页失败:', err))
}

const handleGoProducts = () => {
  router.push('/products').catch(err => console.error('跳转到产品页失败:', err))
}

const handleIndustryClick = (item) => {
  if (item.path) {
    router.push(item.path).catch(err => console.error('跳转到行业分类页失败:', err))
  }
}

// 视频弹窗控制（符合YouTube自动播放政策）
const openVideoModal = () => {
  isVideoModalOpen.value = true
  if (typeof document !== 'undefined') {
    document.body.style.overflow = 'hidden'
    // 延迟设置自动播放，避免加载阻塞（必须静音）
    setTimeout(() => {
      youtubeIframeSrc.value = 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1'
    }, 300)
  }
}

const closeVideoModal = () => {
  isVideoModalOpen.value = false
  if (typeof document !== 'undefined') {
    document.body.style.overflow = 'auto'
  }
  youtubeIframeSrc.value = 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0&mute=1'
}

// ========== 生命周期管理 ==========
onMounted(() => {
  // 标记组件已挂载
  isMounted.value = true

  // 延迟计算高度，确保DOM渲染完成
  nextTick(() => {
    calcIndustryHeight()
    // 延迟加载悬浮组件，提升首屏加载速度
    setTimeout(() => {
      isFloatingToolsReady.value = true
    }, 800)
  })

  // 绑定窗口resize监听（防抖）
  debouncedCalcHeight = debounce(calcIndustryHeight)
  window.addEventListener('resize', debouncedCalcHeight)

  // 监听屏幕尺寸变化，重新计算高度
  watch(isMobile, () => {
    nextTick(calcIndustryHeight)
  })
})

onUnmounted(() => {
  // 清理事件监听，避免内存泄漏
  if (debouncedCalcHeight) {
    window.removeEventListener('resize', debouncedCalcHeight)
  }
  // 恢复body样式
  if (typeof document !== 'undefined') {
    document.body.style.overflow = 'auto'
  }
})
</script>

<style scoped lang="scss">
/* 基础重置 & 全局样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Inter:wght@300;400;600;700&display=swap');

.home-page {
  width: 100%;
  min-height: 100vh;
  overflow-x: hidden;
  position: relative;
  font-family: 'Inter', sans-serif, Arial, Helvetica, sans-serif;
  background-color: #fff;
}

/* 导航栏适配 */
.home-page :deep(.app-main-navbar) {
  position: relative;
  z-index: 9999;
  width: 100%;
}

/* Banner 轮播适配（移除重复padding，由组件内部处理） */
.home-page :deep(.app-banner-carousel) {
  width: 100%;
  max-height: 80vh;
  height: auto;
  min-height: 300px;
  margin: 0;
  padding: 0;
}

/* 欢迎区域样式 */
.welcome-section {
  width: 100%;
  padding: clamp(2rem, 5vw, 4rem) clamp(1rem, 3vw, 2rem);
  background-color: #ffffff;
  position: relative;
  z-index: 10;
  animation: fadeIn 0.5s ease-out;
}

.relative-container {
  max-width: 1920px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: clamp(1.5rem, 4vw, 3rem);
}

.welcome-text {
  max-width: 720px;
  width: 100%;
  color: #333;
  z-index: 2;
}

.welcome-title {
  font-family: 'Playfair Display', serif;
  font-size: clamp(1.8rem, 4vw, 3rem);
  font-weight: 900;
  margin-bottom: 0.8rem;
  color: #1a1a1a;
  line-height: 1.2;
  letter-spacing: 0.5px;

  .title-highlight {
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
  position: relative;
  z-index: 10;

  &:hover {
    background-color: #003366;
    transform: translateY(-2px);
    box-shadow: 0 5px 12px rgba(0, 74, 153, 0.3);
  }
}

/* 视频区块样式 */
.welcome-right {
  width: 100%;
  max-width: 704px;
  height: auto;
  min-height: 300px;
  position: relative;
  z-index: 1;
}

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
    transition: transform 0.5s ease;
  }

  &:hover .video-bg {
    transform: scale(1.05);
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
  }

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

  &:hover .youtube-play-icon {
    transform: scale(1.1);
    box-shadow: 0 8px 20px rgba(0, 74, 153, 0.5);
    background-color: #003366;
  }
}

/* 数据统计模块 */
.stats-section {
  width: 100%;
  padding: clamp(2rem, 5vw, 4rem) clamp(1rem, 3vw, 2rem);
  background: linear-gradient(180deg, #dce0e8 0%, #cdd2da 100%);
  box-shadow: inset 0 2px 8px rgba(0, 0, 0, 0.08);
  animation: fadeIn 0.5s ease-out;
}

.stats-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 1rem;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
  gap: clamp(1rem, 3vw, 2rem);
}

.stats-item {
  text-align: center;
  flex: 1;
  min-width: 180px;
  max-width: 250px;
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
    font-size: clamp(2rem, 5vw, 3.5rem);
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

/* 行业产品分类模块 */
.industry-products-section {
  width: 100%;
  padding: clamp(2rem, 5vw, 4rem) clamp(1rem, 3vw, 2rem);
  background: linear-gradient(180deg, #1a2434 0%, #2c3e50 100%);
  color: #ffffff;
  animation: fadeIn 0.5s ease-out;
}

.industry-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 0 1rem;
}

.industry-header {
  text-align: center;
  margin-bottom: 3rem;

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
    margin: 0 auto 1.5rem;
    line-height: 1.7;
  }
}

.industry-search-lang-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 0.5rem;
  flex-wrap: wrap;

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
}

/* 行业分类网格 */
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
  gap: 2rem 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
}

.industry-item {
  text-align: center;
  flex: 0 0 auto;
  width: calc(20% - 1.5rem);
  min-width: 120px;
  max-width: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.2rem;
  margin-bottom: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  padding: 1rem;
  border-radius: 8px;

  &:hover {
    background-color: rgba(0, 74, 153, 0.2);
    transform: translateY(-5px);
  }

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
  }

  .industry-name {
    font-family: 'Inter', sans-serif;
    font-size: 0.95rem;
    font-weight: 600;
    color: #ffffff;
    line-height: 1.5;
    word-break: break-word;
  }
}

/* 展开/收起按钮 */
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

    .rotated {
      transform: rotate(180deg);
    }
  }
}

/* 视频弹窗样式 */
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
  backdrop-filter: blur(2px);
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
  width: 100%;
}

/* 响应式适配 */
@media (max-width: 1200px) {
  .industry-item {
    width: calc(25% - 1.5rem);
  }
}

@media (max-width: 768px) {
  .industry-item {
    width: calc(33.333% - 1.5rem);
  }

  .close-modal-btn {
    font-size: 1.5rem;
    width: 36px;
    height: 36px;
  }

  .welcome-right {
    min-height: 250px;
  }
}

@media (max-width: 576px) {
  .industry-item {
    width: calc(50% - 1.5rem);
  }

  .welcome-right {
    min-height: 220px;
  }

  .youtube-iframe {
    height: 240px !important;
  }
}

/* 通用动画 */
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

/* 减少动画运动（适配系统偏好） */
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
</style>
