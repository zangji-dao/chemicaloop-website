<template>
  <div class="app-banner-carousel" ref="carouselRoot">
    <div
      class="carousel-item"
      v-for="(item, idx) in carouselList"
      :key="item.id || `banner-${idx}`"
      :class="{ 'is-active': currentIndex === idx }"
      :style="{ pointerEvents: currentIndex === idx ? 'auto' : 'none' }"
    >
      <img
        :src="item.imgUrl"
        :alt="item.alt || `CHEMICALOOP Banner ${idx + 1}`"
        class="banner-img"
        @error="(e) => handleImgError(e, idx)"
        loading="lazy"
      />
      <div class="banner-mask">
        <h1 class="banner-title">{{ item.title }}</h1>
        <div class="desc-wrapper">
          <p class="banner-desc" :class="{ 'line-clamp': !isDescExpanded[idx] }">
            {{ item.description }}
          </p>
          <button
            v-if="currentIndex === idx && isDescOverflow[idx]"
            class="desc-toggle-btn"
            @click="(e) => toggleDescExpand(e, idx)"
            :aria-label="isDescExpanded[idx] ? 'Collapse description' : 'Expand description'"
          >
            {{ isDescExpanded[idx] ? 'Collapse' : 'Expand' }}
            <svg
              class="toggle-icon"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              :class="{ 'rotate-180': isDescExpanded[idx] }"
            >
              <path
                d="M12 6L6 12L18 12"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              ></path>
            </svg>
          </button>
        </div>
        <button
          class="banner-btn"
          @click="handleBannerBtnClick(item.buttonLink)"
          :disabled="!item.buttonLink || currentIndex !== idx"
          :aria-label="`Go to ${item.buttonText} page`"
        >
          {{ item.buttonText }}
        </button>
      </div>
    </div>
    <div class="carousel-indicators" v-if="carouselList.length > 1">
      <span
        v-for="(item, idx) in carouselList"
        :key="item.id || `indicator-${idx}`"
        :class="{ 'is-active': currentIndex === idx }"
        @click="switchCarousel(idx)"
        :title="`Switch to Banner ${idx + 1}`"
        :aria-label="`Banner ${idx + 1} indicator`"
      ></span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import banner1 from '@/assets/banners/home-banner1.jpg'
import banner2 from '@/assets/banners/home-banner2.jpg'
const defaultBanner = '/images/default-banner.jpg'

// Props定义
const props = defineProps({
  autoplayInterval: { type: Number, default: 3000, validator: (val) => val >= 2000 },
  autoplay: { type: Boolean, default: true },
  navBarHeight: { type: Number, default: 80 },
})

// 轮播数据
const carouselList = ref([
  {
    id: 'banner-1',
    imgUrl: banner1,
    alt: 'CHEMICALOOP - Chemical Raw Materials & Custom Solutions',
    title: "CHEMICALOOP: Your Gateway to China's Chemical Raw Materials & Customized Solutions",
    description:
      'As a professional chemical service provider rooted in China, we connect you to a comprehensive portfolio of raw materials and tailor-made solutions. Whether you choose standard products or fully customized road maps, we streamline your sourcing with direct access to top Chinese manufacturers—ensuring reliability, efficiency, and cost-effectiveness at every stage.',
    buttonText: 'Get Your Custom Solution',
    buttonLink: '/solutions',
  },
  {
    id: 'banner-2',
    imgUrl: banner2,
    alt: 'CHEMICALOOP - Invest in China',
    title: 'INVEST IN CHINA',
    description:
      'We offer standardized workshops, government permits, free offices, tax/customs services, and up to 13% export tax rebate to lower your procurement costs. Our team provides one-stop support from project registration to daily operation, helping you reduce investment risks and improve operational efficiency.',
    buttonText: 'Learn About Incentives',
    buttonLink: '/invest',
  },
])

// 核心状态
const router = useRouter()
const currentIndex = ref(0)
let carouselTimer = null
const carouselRoot = ref(null)
let resumeTimer = null
const RESUME_DELAY = 3000
const isDescExpanded = ref(carouselList.value.map(() => false))
const isDescOverflow = ref(carouselList.value.map(() => false))

// 检查描述溢出
const checkDescOverflow = async (targetIdx) => {
  await nextTick()
  const descEl = document.querySelector(`.carousel-item:nth-child(${targetIdx + 1}) .banner-desc`)
  if (descEl) isDescOverflow.value[targetIdx] = descEl.scrollHeight > descEl.clientHeight
}

// 切换描述展开/折叠
const toggleDescExpand = (e, idx) => {
  e.stopPropagation()
  if (currentIndex.value !== idx) return
  isDescExpanded.value[idx] = !isDescExpanded.value[idx]
  handleUserInteraction()
}

// 切换轮播项
const switchCarousel = (index) => {
  if (index === currentIndex.value) return
  isDescExpanded.value[currentIndex.value] = false
  currentIndex.value = index
  resetAutoplay()
  checkDescOverflow(index)
  handleUserInteraction()
}

// 自动轮播
const autoPlayCarousel = () => {
  if (!props.autoplay || carouselList.value.length <= 1) return
  clearInterval(carouselTimer)
  carouselTimer = setInterval(() => {
    const nextIdx = (currentIndex.value + 1) % carouselList.value.length
    switchCarousel(nextIdx)
  }, props.autoplayInterval)
}

// 重置轮播定时器
const resetAutoplay = () => {
  if (!props.autoplay) return
  clearInterval(carouselTimer)
  autoPlayCarousel()
}

// 暂停/恢复轮播
const pauseCarousel = () => props.autoplay && clearInterval(carouselTimer)
const resumeCarousel = () => props.autoplay && autoPlayCarousel()

// 用户交互处理（暂停+延迟恢复轮播）
const handleUserInteraction = () => {
  pauseCarousel()
  clearTimeout(resumeTimer)
  resumeTimer = setTimeout(resumeCarousel, RESUME_DELAY)
}

// 停止所有定时器（卸载时）
const stopCarouselPlay = () => {
  clearInterval(carouselTimer)
  clearTimeout(resumeTimer)
}

// 按钮跳转（修复正则解析风险）
const handleBannerBtnClick = (link) => {
  if (!link) return
  handleUserInteraction()
  // 替换正则为更安全的startsWith判断
  if (link.startsWith('http://') || link.startsWith('https://')) {
    window.open(link, '_blank', 'noopener noreferrer')
  } else {
    router.push(link)
  }
}

// 图片加载失败处理
const handleImgError = (e, idx) => {
  e.target.src = defaultBanner
  console.warn(`Banner ${idx + 1} image failed to load, replaced with default.`, e.target.src)
}

// 统一的resize处理函数（解决匿名函数无法移除的问题）
const handleResize = () => {
  if (carouselRoot.value) {
    carouselRoot.value.style.marginTop = `${props.navBarHeight}px`
    carouselRoot.value.style.height = `calc(100vh - ${props.navBarHeight}px)`
  }
  checkDescOverflow(currentIndex.value)
}

// 绑定交互事件
const bindInteractionEvents = () => {
  if (!carouselRoot.value) return
  const events = ['mousedown', 'mouseup', 'mouseleave', 'touchstart', 'touchend', 'touchcancel']
  events.forEach(event => carouselRoot.value.addEventListener(event, handleUserInteraction))
}

// 移除交互事件
const unbindInteractionEvents = () => {
  if (!carouselRoot.value) return
  const events = ['mousedown', 'mouseup', 'mouseleave', 'touchstart', 'touchend', 'touchcancel']
  events.forEach(event => carouselRoot.value.removeEventListener(event, handleUserInteraction))
}

// 挂载生命周期
onMounted(() => {
  // 全局样式重置，消除默认留白
  document.documentElement.style.margin = '0'
  document.documentElement.style.padding = '0'
  document.body.style.margin = '0'
  document.body.style.padding = '0'
  document.body.style.overflowX = 'hidden'

  // 初始化轮播样式+溢出检查+自动轮播
  handleResize()
  carouselList.value.forEach((_, idx) => checkDescOverflow(idx))
  autoPlayCarousel()

  // 绑定事件监听
  window.addEventListener('resize', handleResize)
  bindInteractionEvents()
})

// 卸载生命周期
onUnmounted(() => {
  // 清理定时器+移除事件监听
  stopCarouselPlay()
  window.removeEventListener('resize', handleResize)
  unbindInteractionEvents()
})

// 监听数据源变化
watch(
  () => carouselList.value.length,
  (newLen) => {
    if (currentIndex.value >= newLen) currentIndex.value = 0
    while (isDescExpanded.value.length < newLen) {
      isDescExpanded.value.push(false)
      isDescOverflow.value.push(false)
    }
    carouselList.value.forEach((_, idx) => checkDescOverflow(idx))
  },
)
</script>

<style scoped lang="scss">
// 全局样式重置
:global(html), :global(body) {
  margin: 0 !important;
  padding: 0 !important;
  overflow-x: hidden !important;
}

// 变量定义
$primary-color: #004a99;
$primary-dark: #003366;
$text-color: #ffffff;
$indicator-normal: rgba(255, 255, 255, 0.5);
$indicator-active: #ffffff;
$shadow-light: 0 2px 8px rgba(0, 0, 0, 0.2);
$shadow-deep: 0 4px 12px rgba(0, 0, 0, 0.3);
$current-font: 'Open Sans Light', 'Lato Light', 'Roboto Light', 'Helvetica Light', sans-serif;

// 轮播根容器（核心：relative定位占文档流，无留白）
.app-banner-carousel {
  position: relative !important;
  width: 100vw !important;
  overflow: hidden !important;
  z-index: 1;
  margin: 0 !important;
  padding: 0 !important;
  // 高度和margin-top由JS动态设置，确保紧贴导航栏+占满剩余视口
}

// 轮播项（绝对定位填满根容器）
.carousel-item {
  position: absolute;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 100% !important;
  opacity: 0;
  transition: opacity 0.8s ease-in-out;
  z-index: 2;
  margin: 0 !important;
  padding: 0 !important;

  &.is-active {
    opacity: 1;
    z-index: 3;
  }

  .banner-img {
    width: 100% !important;
    height: 100% !important;
    object-fit: cover !important;
    object-position: center center !important;
    transition: transform 8s ease-in-out;
    margin: 0 !important;
    padding: 0 !important;

    &:hover {
      transform: scale(1.02);
    }
  }
}

// 遮罩层（填满轮播项，内容内边距不影响整体留白）
.banner-mask {
  position: absolute;
  top: 0 !important;
  left: 0 !important;
  width: 100% !important;
  height: 100% !important;
  background: linear-gradient(90deg, rgba($primary-color, 0.4), rgba($primary-color, 0.1));
  color: $text-color;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  padding: 2rem 8vw !important;
  margin: 0 !important;
  z-index: 4;

  .banner-title {
    font-family: $current-font;
    font-size: clamp(1.8rem, 4vw, 3rem);
    font-weight: 300;
    margin-bottom: clamp(1rem, 2vw, 1.5rem);
    line-height: 1.4;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    max-width: 800px;
    min-height: clamp(3rem, 8vw, 6rem);
    margin-top: 0 !important;
  }

  .desc-wrapper {
    position: relative;
    margin-bottom: clamp(1rem, 2vw, 1.5rem);
    max-width: 700px;
    margin-top: 0 !important;

    .banner-desc {
      font-family: $current-font;
      font-size: clamp(0.9rem, 1.8vw, 1.25rem);
      font-weight: 300;
      line-height: 1.7;
      text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
      margin: 0 !important;

      &.line-clamp {
        display: -webkit-box;
        -webkit-box-orient: vertical;
        overflow: hidden;
        -webkit-line-clamp: 2;
        line-clamp: 2;
        @media (min-width: 576px) and (max-width: 768px) {
          -webkit-line-clamp: 3;
          line-clamp: 3;
        }
        @media (min-width: 769px) {
          -webkit-line-clamp: 4;
          line-clamp: 4;
        }
      }
    }

    .desc-toggle-btn {
      font-family: $current-font;
      background: transparent;
      color: $text-color;
      border: none;
      font-size: clamp(0.8rem, 1.5vw, 0.9rem);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.3rem 0;
      margin-top: 0.5rem;
      margin-bottom: 0 !important;

      .toggle-icon {
        width: clamp(0.7rem, 1.2vw, 0.8rem);
        height: clamp(0.7rem, 1.2vw, 0.8rem);
        transition: transform 0.3s ease;
      }

      .toggle-icon.rotate-180 {
        transform: rotate(180deg);
      }
    }
  }

  .banner-btn {
    font-family: $current-font;
    padding: clamp(0.8rem, 1.5vw, 1rem) clamp(2rem, 3vw, 2.25rem);
    background: $primary-color;
    color: $text-color;
    border: none;
    border-radius: 2px;
    font-size: clamp(0.9rem, 1.5vw, 1rem);
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: $shadow-light;
    align-self: flex-start;
    margin-top: 0 !important;

    &:hover {
      background: $primary-dark;
      transform: translateY(-2px);
      box-shadow: $shadow-deep;
    }

    &:disabled {
      background: rgba($primary-color, 0.6);
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
  }
}

// 指示器样式
.carousel-indicators {
  position: absolute;
  bottom: clamp(1rem, 2vw, 1.875rem);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: clamp(0.5rem, 1vw, 0.75rem);
  z-index: 6;
  margin: 0 !important;
  padding: 0 !important;

  span {
    width: clamp(0.6rem, 1vw, 0.75rem);
    height: clamp(0.6rem, 1vw, 0.75rem);
    border-radius: 50%;
    background: $indicator-normal;
    cursor: pointer;
    transition: all 0.3s ease;
    margin: 0 !important;
    padding: 0 !important;

    &.is-active {
      background: $indicator-active;
      width: clamp(1.8rem, 2.5vw, 2.25rem);
      border-radius: 0.3rem;
    }

    &:hover {
      background: rgba($indicator-active, 0.8);
    }
  }
}

// 响应式适配
@media (max-width: 768px) {
  .banner-mask {
    padding: 2rem 6vw !important;
  }
  .banner-title {
    min-height: clamp(4rem, 10vw, 8rem);
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .banner-mask {
    padding: 2rem 6vw !important;
  }
  .banner-title {
    font-size: clamp(2rem, 3.5vw, 2.5rem);
    min-height: clamp(3.5rem, 9vw, 7rem);
  }
  .banner-desc {
    font-size: clamp(1rem, 1.6vw, 1.1rem);
  }
}
</style>
