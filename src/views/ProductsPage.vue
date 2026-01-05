<template>
  <div class="products-page-wrapper">
    <AppMainNavbar />
    <div class="products-content" style="padding: 120px 20px; text-align: center">
      <h1 class="products-title">Our Products</h1>
      <p
        class="products-desc"
        style="max-width: 800px; margin: 20px auto; font-size: 16px; color: #666"
      >
        We provide a full range of specialty chemicals for various industries.
      </p>
    </div>
  </div>
</template>

<script setup>
import AppMainNavbar from '@/components/AppMainNavbar.vue'
</script>

<style scoped lang="scss">
.products-page-wrapper {
  width: 100%;
  height: 100%;
}

.products-title {
  font-size: 36px;
  color: #004a99;
  margin-bottom: 20px;
}
</style>
