<template>
  <!-- 路由出口：LoginView会在这里渲染 -->
  <router-view />
</template>

<script setup>
// 无需额外代码，仅作为路由容器
</script>

<style>
/* 全局样式重置，避免默认样式干扰 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html,
body,
#app {
  width: 100%;
  height: 100%;
}
</style>
