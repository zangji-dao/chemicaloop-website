<template>
  <!-- 双单词驼峰类名：pageBanner，高度50vh（屏幕1/2） -->
  <div class="pageBanner" :style="{ backgroundImage: `url(${bannerSrc})` }">
    <div class="bannerMask">
      <h1 class="bannerText">{{ bannerText }}</h1>
    </div>
  </div>
</template>

<script setup>
// 严格双单词驼峰参数：bannerSrc（图片路径）、bannerText（标题文字）
const props = defineProps({
  // bannerSrc：banner + Source 双单词驼峰，语义清晰
  bannerSrc: {
    type: String,
    required: true,
    default: '/assets/banners/defaultBanner.jpg', // 图片名双单词驼峰
  },
  // bannerText：banner + Text 双单词驼峰，匹配命名规范
  bannerText: {
    type: String,
    required: true,
    default: 'Multichem',
  },
})
</script>

<style scoped>
/* 核心：高度50vh（屏幕二分之一），宽度100%适配 */
.pageBanner {
  width: 100%;
  height: 50vh;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 双单词驼峰类名：bannerMask（遮罩层） */
.bannerMask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 双单词驼峰类名：bannerText（标题文字） */
.bannerText {
  color: #ffffff;
  font-size: 2.6rem;
  font-weight: 700;
  text-align: center;
  padding: 0 2rem;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* 响应式适配，保持视觉统一 */
@media (max-width: 768px) {
  .bannerText {
    font-size: 1.8rem;
  }
}

@media (max-width: 480px) {
  .bannerText {
    font-size: 1.5rem;
  }
}
</style>
