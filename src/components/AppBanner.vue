<template>
  <!-- 给根容器添加ref，用于绑定事件监听 -->
  <div class="app-banner-carousel" ref="carouselRoot">
    <!-- 每个轮播项仅在激活时可交互 -->
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
          <!-- 展开/折叠按钮：箭头初始向下，展开后向上 -->
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
              <!-- 初始箭头：向下（M12 6 为顶点，L6 12/L18 12 为左右端点） -->
              <path
                d="M12 6L6 12L18 12"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
        <!-- 主按钮：仅当前项可点击 -->
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
    <!-- 轮播指示器 -->
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
// 引入本地图片资源
import banner1 from '@/assets/banners/home-banner1.jpg'
import banner2 from '@/assets/banners/home-banner2.jpg'
// 默认图片（加载失败时 fallback）
const defaultBanner = '/images/default-banner.jpg'

// 组件 Props：支持外部配置自动轮播
const props = defineProps({
  autoplayInterval: {
    type: Number,
    default: 3000, // 核心修改：默认轮播间隔从5秒缩短为3秒
    validator: (val) => val >= 2000, // 核心修改：最小间隔从3秒放宽到2秒
  },
  autoplay: {
    type: Boolean,
    default: true,
  },
})

// 轮播数据源：已修复引号字体问题（China’s → China's）
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

// 路由实例：用于内部页面跳转
const router = useRouter()
// 轮播当前索引：控制哪个 banner 显示
const currentIndex = ref(0)
// 自动轮播定时器：用于清除/重置
let carouselTimer = null
// 轮播根容器ref：用于绑定鼠标/触摸事件
const carouselRoot = ref(null)
// 新增：恢复轮播的定时器（用于控制“操作后延迟恢复”）
let resumeTimer = null
// 新增：操作后恢复轮播的延迟时间（3秒）
const RESUME_DELAY = 3000

// 每个 banner 独立的状态管理
const isDescExpanded = ref(carouselList.value.map(() => false)) // 展开/折叠状态
const isDescOverflow = ref(carouselList.value.map(() => false)) // 描述是否溢出（决定是否显示按钮）

/**
 * 检查描述文字是否溢出（仅初始化/切换/窗口变化时执行）
 * @param {number} targetIdx - 目标 banner 索引
 */
const checkDescOverflow = async (targetIdx) => {
  await nextTick() // 等待 DOM 更新后再计算
  const descEl = document.querySelector(`.carousel-item:nth-child(${targetIdx + 1}) .banner-desc`)
  if (!descEl) return
  // 仅记录初始溢出状态，展开后不修改（避免按钮消失）
  isDescOverflow.value[targetIdx] = descEl.scrollHeight > descEl.clientHeight
}

/**
 * 切换描述的展开/折叠状态
 * @param {Event} e - 点击事件（用于阻止冒泡）
 * @param {number} idx - 当前 banner 索引
 */
const toggleDescExpand = (e, idx) => {
  e.stopPropagation() // 防止事件冒泡到轮播项
  if (currentIndex.value !== idx) return // 非当前项禁止操作
  isDescExpanded.value[idx] = !isDescExpanded.value[idx] // 切换状态
  handleUserInteraction() // 新增：操作描述按钮时也触发“暂停-延迟恢复”
}

/**
 * 切换轮播项
 * @param {number} index - 目标轮播索引
 */
const switchCarousel = (index) => {
  if (index === currentIndex.value) return // 点击当前指示器不执行
  // 重置原项的展开状态（避免切换后仍保持展开）
  isDescExpanded.value[currentIndex.value] = false
  currentIndex.value = index
  resetAutoplay() // 切换后重置自动轮播
  checkDescOverflow(index) // 检查新项的溢出状态
  handleUserInteraction() // 新增：点击指示器时也触发“暂停-延迟恢复”
}

/**
 * 自动轮播逻辑
 */
const autoPlayCarousel = () => {
  if (!props.autoplay || carouselList.value.length <= 1) return // 关闭自动轮播或仅1个banner时不执行
  clearInterval(carouselTimer) // 清除旧定时器
  carouselTimer = setInterval(() => {
    const nextIdx = (currentIndex.value + 1) % carouselList.value.length // 循环切换
    switchCarousel(nextIdx)
  }, props.autoplayInterval)
}

/**
 * 重置自动轮播（如手动切换后重新计时）
 */
const resetAutoplay = () => {
  if (!props.autoplay) return
  clearInterval(carouselTimer)
  autoPlayCarousel()
}

/**
 * 暂停自动轮播（用户操作时触发）
 */
const pauseCarousel = () => {
  if (props.autoplay) {
    clearInterval(carouselTimer)
  }
}

/**
 * 恢复自动轮播（延迟后触发）
 */
const resumeCarousel = () => {
  if (props.autoplay) {
    autoPlayCarousel()
  }
}

/**
 * 新增：用户操作统一处理（暂停轮播 + 延迟3秒恢复）
 */
const handleUserInteraction = () => {
  pauseCarousel() // 立即暂停轮播
  clearTimeout(resumeTimer) // 清除之前的恢复定时器（避免重复触发）
  // 3秒后自动恢复轮播
  resumeTimer = setTimeout(() => {
    resumeCarousel()
  }, RESUME_DELAY)
}

/**
 * 停止自动轮播（组件卸载时执行）
 */
const stopCarouselPlay = () => {
  clearInterval(carouselTimer)
  clearTimeout(resumeTimer) // 新增：卸载时清除恢复定时器，避免内存泄漏
}

/**
 * 主按钮点击事件（支持外部链接和内部路由）
 * @param {string} link - 跳转链接
 */
const handleBannerBtnClick = (link) => {
  if (!link) return // 无链接时不执行
  handleUserInteraction() // 新增：点击按钮时也触发“暂停-延迟恢复”
  if (/^https?:\/\//.test(link)) {
    // 外部链接：新窗口打开（加 noopener noreferrer 安全优化）
    window.open(link, '_blank', 'noopener noreferrer')
  } else {
    // 内部路由：使用 vue-router 跳转
    router.push(link)
  }
}

/**
 * 图片加载失败处理（替换为默认图片）
 * @param {Event} e - 图片错误事件
 * @param {number} idx - 图片索引
 */
const handleImgError = (e, idx) => {
  e.target.src = defaultBanner // 替换为默认图片
  console.warn(`Banner ${idx + 1} image failed to load, replaced with default.`, e.target.src)
}

// 组件生命周期：挂载时初始化
onMounted(() => {
  // 初始化所有 banner 的溢出状态（确保加载时正确显示按钮）
  carouselList.value.forEach((_, idx) => checkDescOverflow(idx))
  autoPlayCarousel() // 启动自动轮播
  // 窗口变化时重新检查当前项的溢出状态（响应式适配）
  window.addEventListener('resize', () => checkDescOverflow(currentIndex.value))

  // 绑定鼠标/触摸事件：用户操作时触发“暂停-延迟恢复”
  if (carouselRoot.value) {
    // 电脑端：鼠标按住/松开/离开 均触发操作处理
    carouselRoot.value.addEventListener('mousedown', handleUserInteraction)
    carouselRoot.value.addEventListener('mouseup', handleUserInteraction)
    carouselRoot.value.addEventListener('mouseleave', handleUserInteraction)

    // 手机端：触摸开始/结束/中断 均触发操作处理
    carouselRoot.value.addEventListener('touchstart', handleUserInteraction)
    carouselRoot.value.addEventListener('touchend', handleUserInteraction)
    carouselRoot.value.addEventListener('touchcancel', handleUserInteraction)
  }
})

// 组件生命周期：卸载时清理
onUnmounted(() => {
  stopCarouselPlay() // 停止自动轮播
  window.removeEventListener('resize', () => checkDescOverflow(currentIndex.value)) // 移除窗口监听

  // 移除鼠标/触摸事件监听（避免内存泄漏）
  if (carouselRoot.value) {
    carouselRoot.value.removeEventListener('mousedown', handleUserInteraction)
    carouselRoot.value.removeEventListener('mouseup', handleUserInteraction)
    carouselRoot.value.removeEventListener('mouseleave', handleUserInteraction)
    carouselRoot.value.removeEventListener('touchstart', handleUserInteraction)
    carouselRoot.value.removeEventListener('touchend', handleUserInteraction)
    carouselRoot.value.removeEventListener('touchcancel', handleUserInteraction)
  }
})

// 监听轮播数据源长度变化（如动态添加 banner 时适配）
watch(
  () => carouselList.value.length,
  (newLen) => {
    if (currentIndex.value >= newLen) currentIndex.value = 0 // 索引超出时重置为0
    // 扩展状态数组（确保新添加的 banner 有对应状态）
    while (isDescExpanded.value.length < newLen) {
      isDescExpanded.value.push(false)
      isDescOverflow.value.push(false)
    }
    // 检查所有项的溢出状态（确保新添加的 banner 正确显示按钮）
    carouselList.value.forEach((_, idx) => checkDescOverflow(idx))
  },
)
</script>

<style scoped lang="scss">
// 基础变量：统一管理样式，便于后续修改
$primary-color: #004a99; // 主色（蓝色按钮）
$primary-dark: #003366; // 主色深色（按钮 hover）
$text-color: #ffffff; // 文字色（白色，适配深色遮罩）
$indicator-normal: rgba(255, 255, 255, 0.5); // 指示器默认色
$indicator-active: #ffffff; // 指示器激活色
$shadow-light: 0 2px 8px rgba(0, 0, 0, 0.2); // 浅色阴影
$shadow-deep: 0 4px 12px rgba(0, 0, 0, 0.3); // 深色阴影
$current-font:
  'Open Sans Light', 'Lato Light', 'Roboto Light', 'Helvetica Light', sans-serif; // 统一字体

// 根容器：控制轮播整体尺寸
.app-banner-carousel {
  width: 100%;
  height: 100vh; // 全屏高度（可根据需求调整为固定高度）
  min-height: 400px; // 最小高度，防止小屏幕变形
  overflow: hidden; // 隐藏溢出内容
  position: relative; // 作为子元素绝对定位的容器
  margin: 0 !important;
  padding: 0 !important;
  z-index: 1;
}

// 轮播项：单个 banner 容器
.carousel-item {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0; // 默认隐藏
  transition: opacity 0.8s ease-in-out; // 淡入淡出过渡
  z-index: 2;

  // 激活状态：显示当前 banner
  &.is-active {
    opacity: 1;
    z-index: 3; // 激活项层级高于其他项，避免点击穿透
  }

  // 轮播图片：自适应填充
  .banner-img {
    width: 100%;
    height: 100%;
    object-fit: cover; // 保持图片比例，填充容器
    object-position: center top; // 图片定位（优先显示上部）
    transition: transform 8s ease-in-out; // 缓慢缩放动画（增强视觉效果）

    // 鼠标悬浮时轻微放大（可选效果）
    &:hover {
      transform: scale(1.02);
    }
  }
}

// 遮罩层：用于叠加文字和按钮，增强可读性
.banner-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  // 渐变遮罩：左侧深色，右侧透明（突出文字）
  background: linear-gradient(90deg, rgba($primary-color, 0.4), rgba($primary-color, 0.1));
  color: $text-color;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start; // 文字左对齐
  padding: 0 8vw; // 水平内边距（响应式）
  padding-top: 110px; // 顶部内边距（避开导航栏）
  z-index: 4; // 遮罩层级高于图片

  // 标题样式
  .banner-title {
    font-family: $current-font;
    font-size: clamp(1.8rem, 4vw, 3rem); // 响应式字体大小
    font-weight: 300;
    margin-bottom: clamp(1rem, 2vw, 1.5rem); // 响应式margin
    line-height: 1.4;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.3); // 文字阴影（增强可读性）
    max-width: 800px; // 最大宽度，避免过宽
    min-height: clamp(3rem, 8vw, 6rem); // 最小高度，避免抖动
    text-align: left;

    // 手机端适配
    @media (max-width: 576px) {
      min-height: clamp(4rem, 10vw, 8rem);
    }
  }

  // 描述文字容器
  .desc-wrapper {
    position: relative;
    margin-bottom: clamp(1rem, 2vw, 1.5rem);
    max-width: 700px; // 最大宽度，避免过宽
    text-align: left;

    // 描述文字样式
    .banner-desc {
      font-family: $current-font;
      font-size: clamp(0.9rem, 1.8vw, 1.25rem); // 响应式字体
      font-weight: 300;
      line-height: 1.7;
      text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3); // 文字阴影
      margin: 0;
      text-align: left;

      // 折叠状态：限制行数（根据屏幕宽度调整）
      &.line-clamp {
        display: -webkit-box;
        -webkit-box-orient: vertical;
        overflow: hidden;
        -webkit-line-clamp: 2; // 手机端默认2行
        line-clamp: 2;
        @media (min-width: 576px) and (max-width: 768px) {
          -webkit-line-clamp: 3; // 平板端3行
          line-clamp: 3;
        }
        @media (min-width: 769px) {
          -webkit-line-clamp: 4; // 桌面端4行
          line-clamp: 4;
        }
      }
    }

    // 展开/折叠按钮
    .desc-toggle-btn {
      font-family: $current-font;
      background: transparent; // 透明背景
      color: $text-color;
      border: none; // 无边框
      font-size: clamp(0.8rem, 1.5vw, 0.9rem); // 响应式字体
      font-weight: 300;
      cursor: pointer; // 鼠标悬浮为指针
      display: flex;
      align-items: center;
      gap: 0.3rem; // 文字与图标间距
      padding: 0.3rem 0; // 上下内边距
      margin-top: 0.5rem; // 与描述文字的间距
      text-align: left;
      z-index: 5; // 按钮层级高于其他元素

      // 鼠标悬浮效果
      &:hover {
        color: rgba($text-color, 0.9); // 轻微变浅
      }

      // 箭头图标：核心修改点
      .toggle-icon {
        width: clamp(0.7rem, 1.2vw, 0.8rem); // 响应式图标大小
        height: clamp(0.7rem, 1.2vw, 0.8rem);
        transition: transform 0.3s ease; // 平滑旋转过渡
      }

      // 展开状态：图标旋转180度（向下变向上）
      & .toggle-icon.rotate-180 {
        transform: rotate(180deg);
      }
    }
  }

  // 主按钮（蓝色按钮）
  .banner-btn {
    font-family: $current-font;
    padding: clamp(0.8rem, 1.5vw, 1rem) clamp(2rem, 3vw, 2.25rem); // 响应式内边距
    background: $primary-color;
    color: $text-color;
    border: none;
    border-radius: 2px; // 轻微圆角
    font-size: clamp(0.9rem, 1.5vw, 1rem); // 响应式字体
    font-weight: 400;
    cursor: pointer;
    transition: all 0.3s ease; // 所有属性过渡
    box-shadow: $shadow-light; // 浅色阴影
    align-self: flex-start; // 左对齐
    z-index: 5; // 层级高于其他元素

    // 鼠标悬浮效果
    &:hover {
      background: $primary-dark; // 深色背景
      transform: translateY(-2px); // 轻微上移
      box-shadow: $shadow-deep; // 深色阴影
    }

    // 禁用状态（无链接时）
    &:disabled {
      background: rgba($primary-color, 0.6); // 半透明
      cursor: not-allowed; // 禁止指针
      transform: none; // 取消上移
      box-shadow: none; // 取消阴影
    }
  }
}

// 轮播指示器（底部小圆点）
.carousel-indicators {
  position: absolute;
  bottom: clamp(1rem, 2vw, 1.875rem); // 响应式底部距离
  left: 50%;
  transform: translateX(-50%); // 水平居中
  display: flex;
  gap: clamp(0.5rem, 1vw, 0.75rem); // 指示器间距
  z-index: 6; // 层级最高，确保可点击

  span {
    width: clamp(0.6rem, 1vw, 0.75rem); // 响应式宽度
    height: clamp(0.6rem, 1vw, 0.75rem); // 响应式高度
    border-radius: 50%; // 圆形
    background: $indicator-normal; // 默认色
    cursor: pointer; // 鼠标悬浮为指针
    transition: all 0.3s ease; // 过渡效果

    // 激活状态：变宽+变白
    &.is-active {
      background: $indicator-active;
      width: clamp(1.8rem, 2.5vw, 2.25rem); // 激活时宽度增加
      border-radius: 0.3rem; // 激活时变椭圆
    }

    // 鼠标悬浮效果
    &:hover {
      background: rgba($indicator-active, 0.8); // 接近白色
    }
  }
}

// 手机端适配（768px以下）
@media (max-width: 768px) {
  .app-banner-carousel {
    height: 60vh; // 手机端降低高度
    min-height: 300px;
  }

  .banner-mask {
    padding: 0 6vw; // 减少水平内边距
    padding-top: 60px; // 减少顶部内边距（适配小屏幕导航栏）

    .banner-title,
    .desc-wrapper {
      max-width: 90%; // 增加内容宽度占比
    }
  }
}

// 平板端适配（769px-1024px）
@media (min-width: 769px) and (max-width: 1024px) {
  .banner-mask {
    padding: 0 6vw; // 减少水平内边距
    padding-top: 80px; // 调整顶部内边距

    .banner-title {
      font-size: clamp(2rem, 3.5vw, 2.5rem); // 调整标题字体
      min-height: clamp(3.5rem, 9vw, 7rem); // 调整最小高度
    }

    .banner-desc {
      font-size: clamp(1rem, 1.6vw, 1.1rem); // 调整描述字体
    }
  }
}
</style>
