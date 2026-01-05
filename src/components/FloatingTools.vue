<template>
  <div class="floating-tools">
    <!-- WhatsApp按钮（带周期性脉动动画+悬浮突出） -->
    <a href="https://wa.me/你的号码" target="_blank" rel="noopener noreferrer" class="whatsapp-btn">
      <img
        src="@/assets/icons/whatsapp-icon.png"
        alt="WhatsApp"
        class="whatsapp-icon"
        onerror="this.src='https://cdn-icons-png.flaticon.com/512/733/733585.png'"
      />
    </a>

    <!-- 返回顶部按钮容器（固定高度，防止WhatsApp下落） -->
    <div class="back-top-btn-container">
      <button
        class="back-top-btn"
        @click="scrollToTop"
        :class="{ 'back-top-btn-hide': scrollProgress === 0 }"
      >
        <!-- 逆时针边框动画分段 -->
        <div class="border top-border" :style="{ width: topBorderWidth + '%' }"></div>
        <div class="border right-border" :style="{ height: rightBorderHeight + '%' }"></div>
        <div class="border bottom-border" :style="{ width: bottomBorderWidth + '%' }"></div>
        <div class="border left-border" :style="{ height: leftBorderHeight + '%' }"></div>

        <div class="btn-content">
          <img
            src="@/assets/icons/top-arrow-icon.png"
            alt="返回顶部"
            class="arrow-icon"
            onerror="this.src='https://cdn-icons-png.flaticon.com/512/25/25694.png'"
          />
        </div>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'

// 滚动进度（0-100）- 保持不变
const scrollProgress = ref(0)

// 计算边框动画尺寸 - 保持不变
const topBorderWidth = computed(() => Math.min(scrollProgress.value * 4, 100))
const rightBorderHeight = computed(() =>
  Math.max(0, Math.min((scrollProgress.value - 25) * 4, 100)),
)
const bottomBorderWidth = computed(() =>
  Math.max(0, Math.min((scrollProgress.value - 50) * 4, 100)),
)
const leftBorderHeight = computed(() => Math.max(0, Math.min((scrollProgress.value - 75) * 4, 100)))

// 监听滚动 - 保持不变
const handleScroll = () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop || 0
  const scrollHeight = document.documentElement.scrollHeight || document.body.scrollHeight || 0
  const clientHeight = document.documentElement.clientHeight || window.innerHeight || 0
  const totalScrollable = scrollHeight - clientHeight
  scrollProgress.value =
    totalScrollable > 0 ? Math.min((scrollTop / totalScrollable) * 100, 100) : 0
}

// 返回顶部 - 保持不变
const scrollToTop = () => {
  window.scrollTo({ top: 0, behavior: 'smooth' })
  scrollProgress.value = 0
}

// 生命周期 - 保持不变
onMounted(() => {
  handleScroll()
  window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
/* 外层容器：固定最大/最小间距，避免极端屏幕问题 */
.floating-tools {
  position: fixed;
  /* 左右/上下间距：最小15px（小屏不挤），最大25px（大屏不突兀） */
  right: clamp(15px, 1.2vw, 25px);
  bottom: clamp(15px, 1.2vw, 25px);
  display: flex;
  flex-direction: column;
  /* 按钮间距：最小12px（小屏不紧凑），最大18px（大屏不松散） */
  gap: clamp(12px, 0.8vw, 18px);
  z-index: 9999;
}

/* 核心：按钮尺寸锁死范围（小屏不小于45px，大屏不大于60px） */
.whatsapp-btn,
.back-top-btn,
.back-top-btn-container {
  width: clamp(45px, 3vw, 60px);
  height: clamp(45px, 3vw, 60px);
  background: transparent;
  border: none;
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  position: relative;
}

/* WhatsApp按钮专属样式 - 保持不变 */
.whatsapp-btn {
  animation: wa-pulse 3s infinite ease-in-out;
}

/* 脉动动画 - 保持不变 */
@keyframes wa-pulse {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.08);
    opacity: 0.85;
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* WhatsApp悬浮突出 - 保持不变 */
.whatsapp-btn:hover {
  animation: wa-hover 0.3s forwards ease;
  box-shadow: 0 0 15px rgba(0, 74, 153, 0.6);
}

/* 悬浮放大动画 - 保持不变 */
@keyframes wa-hover {
  100% {
    transform: scale(1.15);
    opacity: 1;
  }
}

/* WhatsApp图标 - 保持不变 */
.whatsapp-icon {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all 0.3s ease;
}

/* 返回顶部按钮专属样式 - 保持不变 */
.back-top-btn {
  overflow: hidden;
  transform: translateY(0);
  opacity: 1;
  transition:
    transform 0.25s ease-in-out,
    opacity 0.25s ease-in-out;
}

/* 隐藏类：下移距离固定（随按钮尺寸同步，避免过小/过大） */
.back-top-btn-hide {
  transform: translateY(clamp(30px, 2vw, 40px));
  opacity: 0;
  pointer-events: none;
}

/* 边框动画样式 - 保持不变（线宽2px固定，确保清晰） */
.border {
  position: absolute;
  background-color: #004a99;
  z-index: 1;
  transition:
    width 0.1s linear,
    height 0.1s linear;
}

.top-border {
  top: 0;
  left: 0;
  height: 2px;
  width: 0;
}
.right-border {
  top: 0;
  right: 0;
  width: 2px;
  height: 0;
}
.bottom-border {
  bottom: 0;
  right: 0;
  height: 2px;
  width: 0;
}
.left-border {
  bottom: 0;
  left: 0;
  width: 2px;
  height: 0;
}

/* 按钮内容层：尺寸随外层同步，保持边框间距 */
.btn-content {
  width: calc(100% - 4px);
  height: calc(100% - 4px);
  background-color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  box-shadow: 0 0 1px rgba(0, 0, 0, 0.1);
}

/* 箭头图标 - 保持不变 */
.arrow-icon {
  width: 70%;
  height: 70%;
  object-fit: contain;
  filter: invert(15%) sepia(90%) saturate(2000%) hue-rotate(190deg) brightness(100%) contrast(100%);
}

/* 悬浮加深边框 - 保持不变 */
.back-top-btn:hover .border {
  background-color: #003366;
}

/* 移动端适配：仅微调细节，核心尺寸靠clamp已控制 */
@media (max-width: 768px) {
  /* 小屏额外优化按钮阴影，提升辨识度 */
  .whatsapp-btn:hover {
    box-shadow: 0 0 12px rgba(0, 74, 153, 0.5);
  }
  .btn-content {
    box-shadow: 0 0 2px rgba(0, 0, 0, 0.15);
  }
}
</style>
