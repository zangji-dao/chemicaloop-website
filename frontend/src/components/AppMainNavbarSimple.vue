<template>
  <nav class="simple-navbar">
    <div class="nav-container">
      <div class="nav-brand">
        <img src="@/assets/logo-white-bg.png" alt="Logo" class="logo-img" />
        <span class="brand-name">Chemicaloop</span>
      </div>

      <div class="nav-menu">
        <router-link to="/" class="nav-link">Home</router-link>
        <router-link to="/products" class="nav-link">Products</router-link>
        <router-link to="/about" class="nav-link">About</router-link>
        <router-link to="/news" class="nav-link">News</router-link>
        <router-link to="/contact" class="nav-link">Contact</router-link>
      </div>

      <div class="nav-actions">
        <LangSelector />
      </div>
    </div>
  </nav>
</template>

<script setup>
import LangSelector from './LangSelector.vue'
</script>

<style scoped>
.simple-navbar {
  width: 100%;
  background-color: #004a99;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 70px;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-img {
  width: 45px;
  height: auto;
}

.brand-name {
  color: #ffffff;
  font-size: 1.5rem;
  font-weight: 600;
  text-decoration: none;
}

.nav-menu {
  display: flex;
  align-items: center;
  gap: 30px;
}

.nav-link {
  color: #ffffff;
  text-decoration: none;
  font-size: 1rem;
  font-weight: 500;
  transition: opacity 0.3s ease;
}

.nav-link:hover {
  opacity: 0.8;
}

.nav-link.router-link-active {
  font-weight: 700;
}

.nav-actions {
  display: flex;
  align-items: center;
}

@media (max-width: 768px) {
  .nav-menu {
    display: none;
  }

  .nav-brand {
    margin: 0 auto;
  }
}
</style>
