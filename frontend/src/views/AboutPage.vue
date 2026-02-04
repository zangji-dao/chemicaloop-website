<template>
  <div class="aboutPage">
    <!-- 优化：添加图片懒加载 + 兜底图 -->
    <PageBanner
      bannerSrc="/assets/banners/aboutBanner.jpg"
      bannerText="About Multichem"
      loading="lazy"
      @error="
        (e) =>
          (e.target.src = 'https://via.placeholder.com/1920x960/2c3e50/ffffff?text=About+Multichem')
      "
    />

    <!-- 原页面内容（保留） -->
    <div class="aboutContent">
      <h2>Business Overview</h2>
      <p>
        Founded in 1976, Multichem has an over 49 years of experience as one of India's leading
        chemical distributors...
      </p>
      <!-- 其他原有内容 -->
    </div>

    <!-- 2. 引入WhatsApp悬浮组件 -->
    <FloatingTools />
  </div>
</template>

<script setup>
// 引入所需组件（FloatingTools 可选异步导入）
import PageBanner from '@/components/PageBanner.vue'
// 若 FloatingTools 是大型组件，使用异步导入：
// const FloatingTools = () => import('@/components/FloatingTools.vue')
import FloatingTools from '@/components/FloatingTools.vue'
</script>

<style scoped>
/* 核心：定义 CSS 变量，统一管理样式 */
.aboutPage {
  --nav-height-desktop: 80px;
  --nav-height-mobile: 60px;
  --content-max-width: 1200px;
  --content-margin-desktop: 4rem;
  --content-margin-mobile: 2rem;
  --text-color-primary: #2c3e50;
  --text-color-secondary: #34495e;
  --banner-height-desktop: 50vh;
  --banner-height-mobile: 40vh;

  width: 100%;
  min-height: 100vh;
  margin-top: var(--nav-height-desktop);
  position: relative;
  z-index: 1;
}

/* Banner组件样式兼容 */
:deep(.pageBanner) {
  width: 100%;
  height: var(--banner-height-desktop);
}

/* 原页面内容样式 + 新增动画 + 文本溢出处理 */
.aboutContent {
  max-width: var(--content-max-width);
  margin: var(--content-margin-desktop) auto;
  padding: 0 2rem;
  animation: fadeInUp 0.8s ease-out; /* 渐入动画 */
}

.aboutContent h2 {
  font-size: 2rem;
  color: var(--text-color-primary);
  margin-bottom: 1.5rem;
}

.aboutContent p {
  font-size: 1.1rem;
  line-height: 1.8;
  color: var(--text-color-secondary);
  word-wrap: break-word; /* 强制换行兼容 */
  word-break: break-normal; /* 中英文换行兼容 */
}

/* 渐入动画关键帧 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 移动端适配 */
@media (max-width: 768px) {
  .aboutPage {
    margin-top: var(--nav-height-mobile);
  }

  :deep(.pageBanner) {
    height: var(--banner-height-mobile);
  }

  .aboutContent {
    margin: var(--content-margin-mobile) auto;
    padding: 0 1rem;
  }

  .aboutContent h2 {
    font-size: 1.6rem; /* 移动端标题字号优化 */
  }

  .aboutContent p {
    font-size: 1rem; /* 移动端文本字号优化 */
  }
}
</style>
