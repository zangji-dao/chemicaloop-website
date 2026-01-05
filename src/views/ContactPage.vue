<template>
  <div class="contact-page-wrapper">
    <AppMainNavbar />
    <div class="contact-content" style="padding: 120px 20px; text-align: center">
      <h1 class="contact-title">Contact Us</h1>
      <p
        class="contact-desc"
        style="max-width: 800px; margin: 20px auto; font-size: 16px; color: #666"
      >
        Email: support@chemicaloop.com | Phone: +86.15585606688
      </p>
    </div>
  </div>
</template>

<script setup>
// 确保导入的组件路径正确
import AppMainNavbar from '@/components/AppMainNavbar.vue'
</script>

<style scoped lang="scss">
.contact-page-wrapper {
  width: 100%;
  height: 100%;
}

.contact-title {
  font-size: 36px;
  color: #004a99;
  margin-bottom: 20px;
}
</style>
