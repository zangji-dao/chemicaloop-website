<template>
  <div class="news-page-wrapper">
    <AppMainNavbarSimple />
    <div class="news-content" style="padding: 120px 20px; text-align: center">
      <h1 class="news-title">Latest News</h1>
      <p
        class="news-desc"
        style="max-width: 800px; margin: 20px auto; font-size: 16px; color: #666"
      >
        Stay updated with our latest industry insights and company news.
      </p>
    </div>
  </div>
</template>

<script setup>
import AppMainNavbarSimple from '@/components/AppMainNavbarSimple.vue'
</script>

<style scoped>
.news-page-wrapper {
  width: 100%;
  height: 100%;
}

.news-title {
  font-size: 36px;
  color: #004a99;
  margin-bottom: 20px;
}
</style>
