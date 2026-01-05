<template>
  <!-- 语言选择器容器：控制下拉框定位 -->
  <div class="lang-selector-container" ref="selectorRef">
    <!-- 下拉触发器：仅显示「国旗 + 下拉箭头」 -->
    <div
      class="lang-trigger"
      @click="toggleDropdown"
      :class="{ active: isDropdownOpen }"
      :title="`当前语言：${currentLangOption.label}`"
    >
      <!-- 国旗图标：核心显示元素 -->
      <img
        :src="currentLangOption.flag"
        :alt="`${currentLangOption.label}国旗`"
        class="lang-flag"
      />
      <!-- 下拉箭头：状态切换提示 -->
      <span class="lang-arrow" :class="{ rotated: isDropdownOpen }">▼</span>
    </div>

    <!-- 下拉选项列表：仅显示国旗 -->
    <div class="lang-dropdown" v-show="isDropdownOpen">
      <div
        class="lang-option"
        v-for="option in langOptions"
        :key="option.value"
        @click="handleLangSelect(option)"
        :class="{ selected: option.value === currentLangOption.value }"
        :title="`切换至${option.label}`"
      >
        <img :src="option.flag" :alt="`${option.label}国旗`" class="lang-flag" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

// 1. 多语言数据源（统一语言标识：zh-CN → zh，与项目配置对齐）
const langOptions = [
  { value: 'ar', label: 'العربية', flag: new URL('@/assets/flags/ar.png', import.meta.url).href },
  { value: 'de', label: 'Deutsch', flag: new URL('@/assets/flags/de.png', import.meta.url).href },
  { value: 'en', label: 'English', flag: new URL('@/assets/flags/en.png', import.meta.url).href },
  { value: 'es', label: 'Español', flag: new URL('@/assets/flags/es.png', import.meta.url).href },
  { value: 'hi', label: 'हिन्दी', flag: new URL('@/assets/flags/hi.png', import.meta.url).href },
  {
    value: 'id',
    label: 'Bahasa Indonesia',
    flag: new URL('@/assets/flags/id.png', import.meta.url).href,
  },
  { value: 'ja', label: '日本語', flag: new URL('@/assets/flags/ja.png', import.meta.url).href },
  { value: 'ko', label: '한국어', flag: new URL('@/assets/flags/ko.png', import.meta.url).href },
  { value: 'pt', label: 'Português', flag: new URL('@/assets/flags/pt.png', import.meta.url).href },
  { value: 'ru', label: 'Русский', flag: new URL('@/assets/flags/ru.png', import.meta.url).href },
  { value: 'zh', label: '中文', flag: new URL('@/assets/flags/zh.png', import.meta.url).href },
]

// 2. 响应式状态与i18n实例
const { locale } = useI18n()
const isDropdownOpen = ref(false)
const currentLangOption = ref({})
const selectorRef = ref(null)

// 3. 切换下拉框显隐（封装逻辑）
const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}

// 4. 点击外部关闭下拉框（增强交互体验）
const handleClickOutside = (e) => {
  if (selectorRef.value && !selectorRef.value.contains(e.target)) {
    isDropdownOpen.value = false
  }
}

// 5. 语言选择逻辑
const handleLangSelect = (option) => {
  currentLangOption.value = option
  locale.value = option.value // 同步i18n全局语言
  localStorage.setItem('defaultLang', option.value) // 持久化
  isDropdownOpen.value = false // 选择后自动关闭
}

// 6. 初始化：匹配本地存储/默认语言
onMounted(() => {
  // 监听外部点击
  document.addEventListener('click', handleClickOutside)

  // 优先读取本地存储，默认回退到项目默认语言zh
  const savedLang = localStorage.getItem('defaultLang') || 'zh'
  const matchedOption = langOptions.find((opt) => opt.value === savedLang)
  currentLangOption.value = matchedOption || langOptions.find((opt) => opt.value === 'zh')
  locale.value = currentLangOption.value.value
})

// 7. 清理监听（避免内存泄漏）
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// 8. 监听全局语言变化（同步组件状态）
watch(locale, (newLang) => {
  const matchedOption = langOptions.find((opt) => opt.value === newLang)
  if (matchedOption) currentLangOption.value = matchedOption
})
</script>

<style scoped lang="scss">
// 统一样式变量（增强可维护性）
$primary-color: #004a99;
$secondary-color: #2c3e50;
$white: #ffffff;
$transition-duration: 0.2s;
$flag-size: 22px 15px;

.lang-selector-container {
  position: relative;
  display: inline-block;
  z-index: 100;

  // 下拉触发器
  .lang-trigger {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.3rem;
    padding: 0.4rem 0.5rem;
    background-color: rgba($white, 0.1);
    border: 2px solid $primary-color;
    color: $white;
    cursor: pointer;
    transition: all $transition-duration ease;
    border-radius: 4px;

    &:hover,
    &.active {
      background-color: $primary-color;
      border-color: darken($primary-color, 10%);
    }

    // 国旗图标
    .lang-flag {
      width: nth($flag-size, 1);
      height: nth($flag-size, 2);
      object-fit: cover;
      border-radius: 2px;
    }

    // 下拉箭头
    .lang-arrow {
      font-size: 0.7rem;
      transition: transform $transition-duration ease;

      &.rotated {
        transform: rotate(180deg);
      }
    }
  }

  // 下拉选项列表
  .lang-dropdown {
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    width: 56px;
    background-color: $secondary-color;
    border: 2px solid $primary-color;
    border-top: none;
    border-radius: 0 0 4px 4px;
    overflow: hidden;

    // 单个选项
    .lang-option {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0.5rem 0;
      color: $white;
      cursor: pointer;
      transition: background-color $transition-duration ease;

      &:hover,
      &.selected {
        background-color: $primary-color;
      }

      // 选项国旗（与触发器统一尺寸）
      .lang-flag {
        width: nth($flag-size, 1);
        height: nth($flag-size, 2);
        object-fit: cover;
        border-radius: 2px;
      }
    }
  }
}
</style>
