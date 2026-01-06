<template>
  <div class="home-page">
    <!-- 导航栏组件（客户端挂载，避免SSR冲突） -->
    <AppMainNavbar v-if="isMounted" />

    <!-- Banner 轮播（适配导航栏高度） -->
    <AppBanner
      v-if="isMounted"
      :navBarHeight="80"
      :autoplay="true"
      :autoplayInterval="5000"
      class="full-width-banner"
    />

    <!-- 核心欢迎区域（i18n默认值兜底） -->
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
            <p>
              {{
                t(
                  'home.welcomeDesc1',
                  'We provide high-quality chemical products for various industries.',
                )
              }}
            </p>
            <p>
              {{
                t(
                  'home.welcomeDesc2',
                  'With 45+ years of experience, we serve 2000+ global customers.',
                )
              }}
            </p>
            <p>
              {{
                t(
                  'home.welcomeDesc3',
                  '500+ products in stock, 100000+ tons of warehouse capacity.',
                )
              }}
            </p>
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

    <!-- 数据统计模块（响应式布局） -->
    <section class="stats-section" v-if="isMounted">
      <div class="stats-container">
        <div class="stats-item" v-for="(item, idx) in statsList" :key="idx">
          <div class="stats-number">{{ item.number }}</div>
          <div class="stats-desc">{{ t(item.key, item.default) }}</div>
        </div>
      </div>
    </section>

    <!-- 行业产品分类模块（动态高度+响应式网格） -->
    <section class="industry-products-section" v-if="isMounted">
      <div class="industry-container">
        <div class="industry-header">
          <h2 class="industry-title">{{ t('home.industryTitle', 'Industry Categories') }}</h2>
          <p class="industry-desc">
            {{
              t(
                'home.industryDesc',
                'Choose the industry you are interested in to view related products.',
              )
            }}
          </p>
          <div class="industry-search-lang-wrapper">
            <button class="product-search-btn" @click="handleGoProducts">
              {{ t('home.productSearchBtn', 'Search All Products') }}
            </button>
          </div>
        </div>

        <!-- 行业分类网格（平滑过渡） -->
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
            <span>{{
              isIndustryExpanded ? t('home.showLess', 'Show Less') : t('home.showMore', 'Show More')
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
              :class="{ rotated: isIndustryExpanded }"
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
          allow="
            accelerometer;
            autoplay;
            clipboard-write;
            encrypted-media;
            gyroscope;
            picture-in-picture;
          "
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
const { t } = useI18n()

// ========== 基础状态管理 ==========
const isMounted = ref(false) // 组件挂载状态（控制客户端渲染）
const isFloatingToolsReady = ref(false) // 悬浮工具延迟加载状态

// ========== 视频相关 ==========
const videoCover = ref(
  new URL('@/assets/images/chemicaloop-video-cover.jpg', import.meta.url).href ||
    'https://via.placeholder.com/704x528/004a99/ffffff?text=CHEMICALOOP+Video',
)
const isVideoModalOpen = ref(false) // 视频弹窗显示状态
const youtubeIframeSrc = ref('https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0&mute=1') // YouTube嵌入地址

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
  { number: '100000+', key: 'home.statsWarehouse', default: 'Warehouse Capacity (Tons)' },
])

// ========== 行业分类配置 ==========
const industryList = computed(() => [
  {
    name: t('home.industryAgro', 'Agrochemicals'),
    icon: new URL('@/assets/icons/industry/industry-agrochemicals.png', import.meta.url).href,
    placeholderText: 'Agro',
    path: '/products/agrochemicals',
  },
  {
    name: t('home.industryAnimal', 'Animal Healthcare'),
    icon: new URL('@/assets/icons/industry/industry-animal-healthcare.png', import.meta.url).href,
    placeholderText: 'Animal',
    path: '/products/animal-healthcare',
  },
  {
    name: t('home.industryClean', 'Cleaning Disinfectants'),
    icon: new URL('@/assets/icons/industry/industry-cleaning-disinfectants.png', import.meta.url)
      .href,
    placeholderText: 'Clean',
    path: '/products/cleaning-disinfectants',
  },
  {
    name: t('home.industryConst', 'Construction'),
    icon: new URL('@/assets/icons/industry/industry-construction.png', import.meta.url).href,
    placeholderText: 'Const',
    path: '/products/construction',
  },
  {
    name: t('home.industryEnergy', 'Energy'),
    icon: new URL('@/assets/icons/industry/industry-energy.png', import.meta.url).href,
    placeholderText: 'Energy',
    path: '/products/energy',
  },
  {
    name: t('home.industryFabric', 'Fabric Solutions'),
    icon: new URL('@/assets/icons/industry/industry-fabric-solutions.png', import.meta.url).href,
    placeholderText: 'Fabric',
    path: '/products/fabric-solutions',
  },
  {
    name: t('home.industryFlavour', 'Flavours Fragrances'),
    icon: new URL('@/assets/icons/industry/industry-flavours-fragrances.png', import.meta.url).href,
    placeholderText: 'Flavour',
    path: '/products/flavours-fragrances',
  },
  {
    name: t('home.industryFood', 'Food Healthcare Ingredients'),
    icon: new URL(
      '@/assets/icons/industry/industry-food-healthcare-ingredients.png',
      import.meta.url,
    ).href,
    placeholderText: 'Food',
    path: '/products/food-healthcare-ingredients',
  },
  {
    name: t('home.industryLube', 'Lubricants Automobiles'),
    icon: new URL('@/assets/icons/industry/industry-lubricants-automobiles.png', import.meta.url)
      .href,
    placeholderText: 'Lube',
    path: '/products/lubricants-automobiles',
  },
  {
    name: t('home.industryMetal', 'Metal Treatment'),
    icon: new URL('@/assets/icons/industry/industry-metal-treatment.png', import.meta.url).href,
    placeholderText: 'Metal',
    path: '/products/metal-treatment',
  },
  {
    name: t('home.industryPaint', 'Paint Coatings'),
    icon: new URL('@/assets/icons/industry/industry-paint-coatings.png', import.meta.url).href,
    placeholderText: 'Paint',
    path: '/products/paint-coatings',
  },
  {
    name: t('home.industryPerf', 'Performance Chemicals'),
    icon: new URL('@/assets/icons/industry/industry-performance-chemicals.png', import.meta.url)
      .href,
    placeholderText: 'Perf',
    path: '/products/performance-chemicals',
  },
  {
    name: t('home.industryPersonal', 'Personal Care'),
    icon: new URL('@/assets/icons/industry/industry-personal-care.png', import.meta.url).href,
    placeholderText: 'Personal',
    path: '/products/personal-care',
  },
  {
    name: t('home.industryPharma', 'Pharmaceuticals'),
    icon: new URL('@/assets/icons/industry/industry-pharmaceuticals.png', import.meta.url).href,
    placeholderText: 'Pharma',
    path: '/products/pharmaceuticals',
  },
  {
    name: t('home.industryPoly', 'Polymers Resin'),
    icon: new URL('@/assets/icons/industry/industry-polymers-resin.png', import.meta.url).href,
    placeholderText: 'Poly',
    path: '/products/polymers-resin',
  },
  {
    name: t('home.industryPulp', 'Pulp Paper Solutions'),
    icon: new URL('@/assets/icons/industry/industry-pulp-paper-solutions.png', import.meta.url)
      .href,
    placeholderText: 'Pulp',
    path: '/products/pulp-paper-solutions',
  },
  {
    name: t('home.industryWater', 'Water Treatment'),
    icon: new URL('@/assets/icons/industry/industry-water-treatment.png', import.meta.url).href,
    placeholderText: 'Water',
    path: '/products/water-treatment',
  },
])

// ========== 行业分类展开/收起逻辑 ==========
const isIndustryExpanded = ref(false) // 行业分类展开状态
const industryGridRef = ref(null) // 行业网格元素引用
const defaultShowHeight = ref(420) // 默认显示高度
const totalIndustryHeight = ref(0) // 行业网格总高度
let debouncedCalcHeight = null // 防抖计算高度函数

/**
 * 防抖函数
 * @param {Function} fn - 待防抖函数
 * @param {number} delay - 防抖延迟时间（默认300ms）
 * @returns 防抖后的函数
 */
const debounce = (fn, delay = 300) => {
  let timer = null
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

/**
 * 计算行业网格高度（动态适配显示/收起）
 */
const calcIndustryHeight = () => {
  if (typeof window === 'undefined' || !industryGridRef.value) return

  try {
    const grid = industryGridRef.value
    totalIndustryHeight.value = grid.offsetHeight

    // 动态计算默认显示高度（根据屏幕尺寸调整显示行数）
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

/**
 * 切换行业分类展开/收起状态
 */
const toggleIndustryExpand = () => {
  isIndustryExpanded.value = !isIndustryExpanded.value
}

// ========== 事件处理函数 ==========
/**
 * 视频封面加载失败处理
 * @param {Event} e - 加载错误事件
 */
const handleVideoCoverError = (e) => {
  e.target.src = 'https://via.placeholder.com/704x528/004a99/ffffff?text=CHEMICALOOP+Video'
}

/**
 * 行业图标加载失败处理
 * @param {Event} e - 加载错误事件
 * @param {string} placeholderText - 占位文本
 */
const handleIndustryIconError = (e, placeholderText) => {
  e.target.src = `https://via.placeholder.com/48/004a99/ffffff?text=${placeholderText}`
}

/**
 * 视频iframe加载失败处理
 */
const handleIframeError = () => {
  youtubeIframeSrc.value = 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0&mute=1'
  if (typeof window !== 'undefined') {
    alert(t('home.videoError', 'Video loading failed, please try again later.'))
  }
}

/**
 * 跳转到关于我们页面
 */
const handleGoAbout = () => {
  router.push('/about').catch((err) => console.error('跳转到关于页失败:', err))
}

/**
 * 跳转到产品列表页面
 */
const handleGoProducts = () => {
  router.push('/products').catch((err) => console.error('跳转到产品页失败:', err))
}

/**
 * 跳转到指定行业分类页面
 * @param {Object} item - 行业分类项
 */
const handleIndustryClick = (item) => {
  if (item.path) {
    router.push(item.path).catch((err) => console.error('跳转到行业分类页失败:', err))
  }
}

/**
 * 打开视频弹窗（符合YouTube自动播放政策）
 */
const openVideoModal = () => {
  isVideoModalOpen.value = true
  if (typeof document !== 'undefined') {
    document.body.style.overflow = 'hidden'
    // 延迟设置自动播放，避免触发浏览器自动播放限制
    setTimeout(() => {
      youtubeIframeSrc.value = 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&mute=1'
    }, 300)
  }
}

/**
 * 关闭视频弹窗
 */
const closeVideoModal = () => {
  isVideoModalOpen.value = false
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
    youtubeIframeSrc.value = 'https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=0&mute=1'
  }
}

// ========== 生命周期 ==========
onMounted(() => {
  isMounted.value = true

  // 延迟加载悬浮工具，优化首屏加载速度
  setTimeout(() => {
    isFloatingToolsReady.value = true
  }, 800)

  // 初始化行业高度计算（等待DOM渲染完成）
  nextTick(() => {
    calcIndustryHeight()
    debouncedCalcHeight = debounce(calcIndustryHeight)
    window.addEventListener('resize', debouncedCalcHeight)
  })
})

onUnmounted(() => {
  // 移除窗口大小变化监听
  if (debouncedCalcHeight) {
    window.removeEventListener('resize', debouncedCalcHeight)
  }
  // 恢复页面滚动
  if (typeof document !== 'undefined') {
    document.body.style.overflow = ''
  }
})

// 监听行业列表变化，重新计算高度（适配i18n语言切换）
watch(industryList, () => {
  nextTick(calcIndustryHeight)
})
</script>

<style scoped lang="scss">
// 基础样式设置
.home-page {
  padding: 0;
  margin: 0;
  width: 100%;
  overflow-x: hidden;

  // Banner 样式（全屏无留白）
  .full-width-banner {
    width: 100%;
    margin: 0;
    padding: 0;
    position: relative;
    height: 0;

    // 确保Banner组件内部无额外边距
    :deep(.app-banner-carousel) {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
    }
  }

  // 欢迎区域
  .welcome-section {
    padding: clamp(2rem, 5vw, 4rem);
    background-color: #f8f9fa;

    .relative-container {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      flex-wrap: wrap;
      gap: clamp(2rem, 4vw, 3rem);
      align-items: center;
    }

    .welcome-text {
      flex: 1 1 400px;

      .welcome-title {
        font-size: clamp(1.8rem, 4vw, 2.8rem);
        margin-bottom: 1rem;
        color: #2c3e50;

        .title-highlight {
          color: #004a99;
        }
      }

      .welcome-subtitle {
        font-size: clamp(1.2rem, 2vw, 1.5rem);
        color: #34495e;
        margin-bottom: 1.5rem;
      }

      .welcome-desc {
        line-height: 1.6;
        color: #666;
        margin-bottom: 2rem;
      }

      .welcome-btn {
        padding: 0.8rem 2rem;
        background-color: #004a99;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 1rem;
        cursor: pointer;
        transition: background-color 0.3s ease;

        &:hover {
          background-color: #003366;
        }
      }
    }

    .welcome-right {
      flex: 1 1 400px;

      .video-block {
        position: relative;
        cursor: pointer;

        .video-bg {
          width: 100%;
          height: auto;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        .play-btn {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          color: white;

          .youtube-play-icon {
            width: 80px;
            height: 80px;
            background-color: rgba(255, 0, 0, 0.8);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            margin-bottom: 1rem;
          }

          .play-text {
            font-size: 1.2rem;
            text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
          }
        }
      }
    }
  }

  // 数据统计区域
  .stats-section {
    padding: clamp(2rem, 4vw, 3rem);
    background-color: #004a99;
    color: white;

    .stats-container {
      max-width: 1200px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 2rem;
      text-align: center;
    }

    .stats-item {
      .stats-number {
        font-size: clamp(2rem, 5vw, 3rem);
        font-weight: bold;
        margin-bottom: 0.5rem;
      }

      .stats-desc {
        font-size: clamp(1rem, 2vw, 1.2rem);
        opacity: 0.9;
      }
    }
  }

  // 行业产品分类区域
  .industry-products-section {
    padding: clamp(2rem, 5vw, 4rem);
    background-color: #f8f9fa;

    .industry-container {
      max-width: 1200px;
      margin: 0 auto;
    }

    .industry-header {
      text-align: center;
      margin-bottom: clamp(2rem, 4vw, 3rem);

      .industry-title {
        font-size: clamp(1.8rem, 4vw, 2.5rem);
        color: #2c3e50;
        margin-bottom: 1rem;
      }

      .industry-desc {
        font-size: clamp(1rem, 2vw, 1.2rem);
        color: #666;
        max-width: 800px;
        margin: 0 auto 2rem;
      }

      .product-search-btn {
        padding: 0.8rem 2rem;
        background-color: #004a99;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 1rem;
        cursor: pointer;
        transition: background-color 0.3s ease;

        &:hover {
          background-color: #003366;
        }
      }
    }

    // 行业网格容器（控制展开/收起）
    .industry-grid-wrapper {
      overflow: hidden;
      margin-bottom: 2rem;
    }

    // 行业网格布局
    .industry-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
      gap: clamp(1.5rem, 3vw, 2rem);
    }

    // 行业分类项
    .industry-item {
      background-color: white;
      padding: 2rem 1rem;
      border-radius: 8px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      cursor: pointer;
      transition:
        transform 0.3s ease,
        box-shadow 0.3s ease;

      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
      }

      .industry-icon {
        margin-bottom: 1rem;

        img {
          display: block;
          margin: 0 auto;
        }
      }

      .industry-name {
        font-size: 1rem;
        color: #2c3e50;
        font-weight: 500;
      }
    }

    // 展开/收起按钮
    .industry-toggle-btn {
      text-align: center;

      .toggle-btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.6rem 1.5rem;
        background-color: transparent;
        color: #004a99;
        border: 1px solid #004a99;
        border-radius: 4px;
        font-size: 1rem;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          background-color: #004a99;
          color: white;
        }

        .toggle-icon {
          transition: transform 0.3s ease;

          &.rotated {
            transform: rotate(180deg);
          }
        }
      }
    }
  }

  // 视频弹窗
  .video-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    padding: 2rem;

    .modal-inner {
      background-color: white;
      padding: 1.5rem;
      border-radius: 8px;
      max-width: 800px;
      width: 100%;
      position: relative;

      .close-modal-btn {
        position: absolute;
        top: -15px;
        right: -15px;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        background-color: red;
        color: white;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      .youtube-iframe {
        border-radius: 4px;
      }
    }
  }

  // 响应式适配
  @media (max-width: 768px) {
    .welcome-section {
      padding: 2rem 1rem;
    }

    .stats-section {
      padding: 2rem 1rem;
    }

    .industry-products-section {
      padding: 2rem 1rem;
    }

    .video-modal {
      padding: 1rem;

      .modal-inner {
        padding: 1rem;

        .close-modal-btn {
          top: -10px;
          right: -10px;
          width: 30px;
          height: 30px;
          font-size: 1.2rem;
        }
      }
    }
  }

  @media (max-width: 576px) {
    .industry-grid {
      grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
    }
  }
}
</style>
