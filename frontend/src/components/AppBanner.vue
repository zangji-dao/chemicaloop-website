以下是简化优化后的代码，保留核心功能，移除不必要的强制样式和冗余逻辑，注释简洁明了： ```vue
<template>
  <div class="app-banner-carousel" ref="carouselRoot">
    <!-- 轮播项 -->
    <div
      class="carousel-item"
      v-for="(item, idx) in carouselList"
      :key="item.id || `banner-${idx}`"
      :class="{ 'is-active': currentIndex === idx }"
      :style="{ pointerEvents: currentIndex === idx ? 'auto' : 'none' }"
    >
      <!-- 轮播图片 -->
      <img
        :src="item.imgUrl"
        :alt="item.alt || `CHEMICALOOP Banner ${idx + 1}`"
        class="banner-img"
        @error="(e) => handleImgError(e, idx)"
        loading="lazy"
      />
      <!-- 内容遮罩层 -->
      <div class="banner-mask">
        <h1 class="banner-title">{{ item.title }}</h1>
        <div class="desc-wrapper">
          <p class="banner-desc" :class="{ 'line-clamp': !isDescExpanded[idx] }">
            {{ item.description }}
          </p>
          <!-- 展开/折叠按钮（仅溢出时显示） -->
          <button
            v-if="currentIndex === idx && isDescOverflow[idx]"
            class="desc-toggle-btn"
            @click="(e) => toggleDescExpand(e, idx)"
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
        <!-- 跳转按钮 -->
        <button
          class="banner-btn"
          @click="handleBannerBtnClick(item.buttonLink)"
          :disabled="!item.buttonLink || currentIndex !== idx"
        >
          {{ item.buttonText }}
        </button>
      </div>
    </div>
    <!-- 轮播指示器（多于1张时显示） -->
    <div class="carousel-indicators" v-if="carouselList.length > 1">
      <span
        v-for="(item, idx) in carouselList"
        :key="item.id || `indicator-${idx}`"
        :class="{ 'is-active': currentIndex === idx }"
        @click="switchCarousel(idx)"
        :title="`Switch to Banner ${idx + 1}`"
      ></span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
// 导入轮播图片
import banner1 from '@/assets/banners/home-banner1.jpg'
import banner2 from '@/assets/banners/home-banner2.jpg'
// 默认图片（加载失败兜底）
const defaultBanner = '/images/default-banner.jpg'

// 组件Props
const props = defineProps({
  autoplayInterval: { type: Number, default: 3000, validator: (val) => val >= 2000 }, // 自动轮播间隔（最小2秒）
  autoplay: { type: Boolean, default: true }, // 是否自动轮播
  navBarHeight: { type: Number, default: 80 }, // 导航栏高度（用于计算轮播高度）
})

// 轮播数据源
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

// 核心状态管理
const router = useRouter()
const currentIndex = ref(0) // 当前激活的轮播索引
let carouselTimer = null // 自动轮播定时器
const carouselRoot = ref(null) // 轮播根元素引用
let resumeTimer = null // 交互后恢复轮播的定时器
const RESUME_DELAY = 3000 // 交互后延迟恢复轮播的时间（3秒）
const isDescExpanded = ref(carouselList.value.map(() => false)) // 描述是否展开
const isDescOverflow = ref(carouselList.value.map(() => false)) // 描述是否溢出

/**
 * 检查描述文本是否溢出（需要折叠/展开）
 * @param {number} targetIdx - 目标轮播项索引
 */
const checkDescOverflow = async (targetIdx) => {
  await nextTick() // 等待DOM更新完成
  const descEl = document.querySelector(`.carousel-item:nth-child(${targetIdx + 1}) .banner-desc`)
  if (descEl) {
    isDescOverflow.value[targetIdx] = descEl.scrollHeight > descEl.clientHeight
  }
}

/**
 * 切换描述文本的展开/折叠状态
 * @param {Event} e - 点击事件
 * @param {number} idx - 轮播项索引
 */
const toggleDescExpand = (e, idx) => {
  e.stopPropagation() // 阻止事件冒泡（避免触发轮播暂停）
  if (currentIndex.value !== idx) return
  isDescExpanded.value[idx] = !isDescExpanded.value[idx]
  handleUserInteraction() // 触发用户交互（暂停轮播）
}

/**
 * 切换到指定轮播项
 * @param {number} index - 目标轮播项索引
 */
const switchCarousel = (index) => {
  if (index === currentIndex.value) return
  // 切换前折叠当前轮播的描述
  isDescExpanded.value[currentIndex.value] = false
  currentIndex.value = index
  resetAutoplay() // 重置自动轮播定时器
  checkDescOverflow(index) // 检查新轮播项的描述是否溢出
  handleUserInteraction() // 触发用户交互（暂停轮播）
}

/**
 * 启动自动轮播
 */
const autoPlayCarousel = () => {
  if (!props.autoplay || carouselList.value.length <= 1) return
  clearInterval(carouselTimer)
  carouselTimer = setInterval(() => {
    const nextIdx = (currentIndex.value + 1) % carouselList.value.length
    switchCarousel(nextIdx)
  }, props.autoplayInterval)
}

/**
 * 重置自动轮播定时器
 */
const resetAutoplay = () => {
  if (!props.autoplay) return
  clearInterval(carouselTimer)
  autoPlayCarousel()
}

/**
 * 暂停自动轮播
 */
const pauseCarousel = () => {
  if (props.autoplay) clearInterval(carouselTimer)
}

/**
 * 恢复自动轮播
 */
const resumeCarousel = () => {
  if (props.autoplay) autoPlayCarousel()
}

/**
 * 处理用户交互（暂停轮播，延迟后恢复）
 */
const handleUserInteraction = () => {
  pauseCarousel()
  clearTimeout(resumeTimer)
  resumeTimer = setTimeout(resumeCarousel, RESUME_DELAY)
}

/**
 * 停止所有定时器（组件卸载时调用）
 */
const stopCarouselPlay = () => {
  clearInterval(carouselTimer)
  clearTimeout(resumeTimer)
}

/**
 * 处理轮播按钮跳转
 * @param {string} link - 跳转链接
 */
const handleBannerBtnClick = (link) => {
  if (!link) return
  handleUserInteraction() // 触发用户交互（暂停轮播）
  // 区分外部链接和内部路由
  if (link.startsWith('http://') || link.startsWith('https://')) {
    window.open(link, '_blank', 'noopener noreferrer')
  } else {
    router.push(link)
  }
}

/**
 * 图片加载失败处理
 * @param {Event} e - 加载错误事件
 * @param {number} idx - 轮播项索引
 */
const handleImgError = (e, idx) => {
  e.target.src = defaultBanner
  console.warn(`Banner ${idx + 1} image failed to load, replaced with default.`, e.target.src)
}

/**
 * 窗口大小变化处理（重新计算轮播高度和位置）
 */
const handleResize = () => {
  if (carouselRoot.value) {
    carouselRoot.value.style.marginTop = `${props.navBarHeight}px`
    carouselRoot.value.style.height = `calc(100vh - ${props.navBarHeight}px)`
  }
  checkDescOverflow(currentIndex.value) // 重新检查描述是否溢出
}

/**
 * 绑定用户交互事件（用于暂停轮播）
 */
const bindInteractionEvents = () => {
  if (!carouselRoot.value) return
  const events = ['mousedown', 'mouseup', 'mouseleave', 'touchstart', 'touchend', 'touchcancel']
  events.forEach((event) => {
    carouselRoot.value.addEventListener(event, handleUserInteraction)
  })
}

/**
 * 移除用户交互事件
 */
const unbindInteractionEvents = () => {
  if (!carouselRoot.value) return
  const events = ['mousedown', 'mouseup', 'mouseleave', 'touchstart', 'touchend', 'touchcancel']
  events.forEach((event) => {
    carouselRoot.value.removeEventListener(event, handleUserInteraction)
  })
}

// 组件挂载时初始化
onMounted(() => {
  // 初始化轮播样式（高度和margin-top）
  handleResize()
  // 检查所有轮播项的描述是否溢出
  carouselList.value.forEach((_, idx) => checkDescOverflow(idx))
  // 启动自动轮播
  autoPlayCarousel()
  // 绑定窗口大小变化事件
  window.addEventListener('resize', handleResize)
  // 绑定用户交互事件
  bindInteractionEvents()
})

// 组件卸载时清理
onUnmounted(() => {
  // 停止所有定时器
  stopCarouselPlay()
  // 移除窗口大小变化事件监听
  window.removeEventListener('resize', handleResize)
  // 移除用户交互事件监听
  unbindInteractionEvents()
})

// 监听轮播数据源长度变化（动态增减轮播项时适配）
watch(
  () => carouselList.value.length,
  (newLen) => {
    // 防止索引越界
    if (currentIndex.value >= newLen) currentIndex.value = 0
    // 初始化新增轮播项的展开/溢出状态
    while (isDescExpanded.value.length < newLen) {
      isDescExpanded.value.push(false)
      isDescOverflow.value.push(false)
    }
    // 重新检查所有轮播项的描述是否溢出
    carouselList.value.forEach((_, idx) => checkDescOverflow(idx))
  },
)
</script>

<style scoped lang="scss">
// 样式变量
$primary-color: #004a99;
$primary-dark: #003366;
$text-color: #ffffff;
$indicator-normal: rgba(255, 255, 255, 0.5);
$indicator-active: #ffffff;
$shadow-light: 0 2px 8px rgba(0, 0, 0, 0.2);
$shadow-deep: 0 4px 12px rgba(0, 0, 0, 0.3);
$current-font: 'Open Sans Light', 'Lato Light', 'Roboto Light', 'Helvetica Light', sans-serif;

// 轮播根容器
.app-banner-carousel {
  position: relative;
  width: 100vw;
  overflow: hidden;
  z-index: 1;
  margin: 0;
  padding: 0;
}

// 轮播项
.carousel-item {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  transition: opacity 0.8s ease-in-out;
  z-index: 2;
  margin: 0;
  padding: 0;

  // 激活状态
  &.is-active {
    opacity: 1;
    z-index: 3;
  }

  // 轮播图片
  .banner-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center center;
    transition: transform 8s ease-in-out;
    margin: 0;
    padding: 0;

    //  hover缩放效果
    &:hover {
      transform: scale(1.02);
    }
  }
}

// 内容遮罩层
.banner-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, rgba($primary-color, 0.4), rgba($primary-color, 0.1));
  color: $text-color;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  padding: 2rem 8vw;
  margin: 0;
  z-index: 4;

  // 轮播标题
  .banner-title {
    font-family: $current-font;
    font-size: clamp(1.8rem, 4vw, 3rem);
    font-weight: 300;
    margin-bottom: clamp(1rem, 2vw, 1.5rem);
    line-height: 1.4;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    max-width: 800px;
    min-height: clamp(3rem, 8vw, 6rem);
  }

  // 描述文本容器
  .desc-wrapper {
    position: relative;
    margin-bottom: clamp(1rem, 2vw, 1.5rem);
    max-width: 700px;

    // 描述文本
    .banner-desc {
      font-family: $current-font;
      font-size: clamp(0.9rem, 1.8vw, 1.25rem);
      font-weight: 300;
      line-height: 1.7;
      text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
      margin: 0;

      // 折叠状态（多行省略）
      &.line-clamp {
        display: -webkit-box;
        -webkit-box-orient: vertical;
        overflow: hidden;
        -webkit-line-clamp: 2;
        line-clamp: 2;

        // 平板适配（3行）
        @media (min-width: 576px) and (max-width: 768px) {
          -webkit-line-clamp: 3;
          line-clamp: 3;
        }

        // 桌面端适配（4行）
        @media (min-width: 769px) {
          -webkit-line-clamp: 4;
          line-clamp: 4;
        }
      }
    }

    // 展开/折叠按钮
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

      // 箭头图标
      .toggle-icon {
        width: clamp(0.7rem, 1.2vw, 0.8rem);
        height: clamp(0.7rem, 1.2vw, 0.8rem);
        transition: transform 0.3s ease;
      }

      // 展开状态箭头旋转
      .toggle-icon.rotate-180 {
        transform: rotate(180deg);
      }
    }
  }

  // 跳转按钮
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

    // hover状态
    &:hover {
      background: $primary-dark;
      transform: translateY(-2px);
      box-shadow: $shadow-deep;
    }

    // 禁用状态
    &:disabled {
      background: rgba($primary-color, 0.6);
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
  }
}

// 轮播指示器
.carousel-indicators {
  position: absolute;
  bottom: clamp(1rem, 2vw, 1.875rem);
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: clamp(0.5rem, 1vw, 0.75rem);
  z-index: 6;
  margin: 0;
  padding: 0;

  span {
    width: clamp(0.6rem, 1vw, 0.75rem);
    height: clamp(0.6rem, 1vw, 0.75rem);
    border-radius: 50%;
    background: $indicator-normal;
    cursor: pointer;
    transition: all 0.3s ease;
    margin: 0;
    padding: 0;

    // 激活状态
    &.is-active {
      background: $indicator-active;
      width: clamp(1.8rem, 2.5vw, 2.25rem);
      border-radius: 0.3rem;
    }

    // hover状态
    &:hover {
      background: rgba($indicator-active, 0.8);
    }
  }
}

// 响应式适配
@media (max-width: 768px) {
  .banner-mask {
    padding: 2rem 6vw;
  }
  .banner-title {
    min-height: clamp(4rem, 10vw, 8rem);
  }
}

@media (min-width: 769px) and (max-width: 1024px) {
  .banner-mask {
    padding: 2rem 6vw;
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
