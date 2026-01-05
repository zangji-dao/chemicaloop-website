<template>
  <!-- 仅保留多语言选择器核心容器 -->
  <div class="lang-selector-container" ref="selectorRef">
    <!-- 下拉触发器 -->
    <div
      class="lang-trigger"
      @click="toggleDropdown"
      :class="{ active: isDropdownOpen }"
      :title="`当前语言：${currentLangOption.label}`"
    >
      <img
        :src="currentLangOption.flag"
        :alt="`${currentLangOption.label}国旗`"
        class="lang-flag"
        @error="handleImgError(currentLangOption)"
      />
      <span class="lang-arrow" :class="{ rotated: isDropdownOpen }">▼</span>
    </div>

    <!-- 下拉选项列表 -->
    <div class="lang-dropdown" v-show="isDropdownOpen">
      <div
        class="lang-option"
        v-for="option in langOptions"
        :key="option.value"
        @click="handleLangSelect(option)"
        :class="{ selected: option.value === currentLangOption.value }"
        :title="`切换至${option.label}`"
      >
        <img
          :src="option.flag"
          :alt="`${option.label}国旗`"
          class="lang-flag"
          @error="handleImgError(option)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from 'vue'
import { useI18n } from 'vue-i18n'

// 静态资源导入（确保 src/assets/flags/ 下有对应图片）
import arFlag from '@/assets/flags/ar.png'
import deFlag from '@/assets/flags/de.png'
import enFlag from '@/assets/flags/en.png'
import esFlag from '@/assets/flags/es.png'
import hiFlag from '@/assets/flags/hi.png'
import idFlag from '@/assets/flags/id.png'
import jaFlag from '@/assets/flags/ja.png'
import koFlag from '@/assets/flags/ko.png'
import ptFlag from '@/assets/flags/pt.png'
import ruFlag from '@/assets/flags/ru.png'
import zhFlag from '@/assets/flags/zh.png'

// 多语言数据源
const langOptions = [
  { value: 'ar', label: 'العربية', flag: arFlag },
  { value: 'de', label: 'Deutsch', flag: deFlag },
  { value: 'en', label: 'English', flag: enFlag },
  { value: 'es', label: 'Español', flag: esFlag },
  { value: 'hi', label: 'हिन्दी', flag: hiFlag },
  { value: 'id', label: 'Bahasa Indonesia', flag: idFlag },
  { value: 'ja', label: '日本語', flag: jaFlag },
  { value: 'ko', label: '한국어', flag: koFlag },
  { value: 'pt', label: 'Português', flag: ptFlag },
  { value: 'ru', label: 'Русский', flag: ruFlag },
  { value: 'zh', label: '中文', flag: zhFlag },
]

// 响应式状态
const { locale } = useI18n()
const isDropdownOpen = ref(false)
const currentLangOption = ref({})
const selectorRef = ref(null)

// 图片加载失败排查
const handleImgError = (option) => {
  console.error(`【国旗加载失败】${option.label} → 路径：${option.flag}`)
}

// 切换下拉框显隐
const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
}

// 点击外部关闭下拉框
const handleClickOutside = (e) => {
  if (selectorRef.value && !selectorRef.value.contains(e.target)) {
    isDropdownOpen.value = false
  }
}

// 语言选择逻辑
const handleLangSelect = (option) => {
  currentLangOption.value = option
  locale.value = option.value
  localStorage.setItem('defaultLang', option.value)
  isDropdownOpen.value = false
}

// 初始化
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  const savedLang = localStorage.getItem('defaultLang') || 'zh'
  const matchedOption = langOptions.find((opt) => opt.value === savedLang)
  currentLangOption.value = matchedOption || langOptions.find((opt) => opt.value === 'zh')
  locale.value = currentLangOption.value.value
})

// 清理监听（避免内存泄漏）
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// 监听全局语言变化
watch(locale, (newLang) => {
  const matchedOption = langOptions.find((opt) => opt.value === newLang)
  if (matchedOption) currentLangOption.value = matchedOption
})
</script>

<style scoped lang="scss">
@use "sass:list";
@use "sass:color";

// 核心样式变量（优化比例，更协调）
$primary-color: #004a99;    // 主色
$light-primary: #005bb5;   // 浅主色（hover用）
$dark-primary: #003a7c;    // 深主色（选中用）
$white: #ffffff;           // 白色
$border-width: 1px;        // 统一边框宽度
$flag-size: 20px 14px;     // 国旗尺寸（优化比例）
$trigger-height: 36px;     // 触发器高度（视觉更舒适）
$transition: all 0.2s ease;// 统一过渡

.lang-selector-container {
  position: relative;
  display: inline-block;
  z-index: 100;

  // 下拉触发器（核心优化：比例+间距）
  .lang-trigger {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;               // 国旗和箭头的间距（优化不拥挤）
    width: auto;
    height: $trigger-height;
    padding: 0 12px;        // 左右内边距（对称协调）
    background-color: $white;
    border: $border-width solid $primary-color;
    border-radius: 6px;     // 圆角更柔和
    cursor: pointer;
    $shadow: 0 1px 2px rgba(0,0,0,0.1);
    box-shadow: $shadow;    // 轻微阴影，增加层次感
    transition: $transition;

    // hover/激活状态（层次更清晰）
    &:hover,
    &.active {
      background-color: $primary-color;
      color: $white;
      box-shadow: 0 2px 4px rgba(0,0,0,0.15);
    }

    // 国旗样式（优化轮廓+比例）
    .lang-flag {
      width: list.nth($flag-size, 1);
      height: list.nth($flag-size, 2);
      object-fit: cover;
      border-radius: 2px;
      border: $border-width solid #e0e0e0; // 浅灰色边框，适配所有国旗
      // 触发器变色时，国旗边框也同步变化
      .lang-trigger:hover &,
      .lang-trigger.active & {
        border-color: $white;
      }
    }

    // 下拉箭头（优化大小+颜色）
    .lang-arrow {
      font-size: 10px;      // 箭头尺寸适配
      color: $primary-color;
      line-height: 1;       // 垂直对齐
      transition: $transition;

      // 触发器变色时，箭头变白
      .lang-trigger:hover &,
      .lang-trigger.active & {
        color: $white;
      }

      &.rotated {
        transform: rotate(180deg);
      }
    }
  }

  // 下拉选项列表（优化间距+层次）
  .lang-dropdown {
    position: absolute;
    top: calc(100% + 4px);   // 和触发器的间距（不贴边）
    left: 0;
    min-width: calc($trigger-height + 24px); // 宽度适配触发器
    background-color: $white;
    border: $border-width solid $primary-color;
    border-radius: 6px;
    box-shadow: 0 3px 8px rgba(0,0,0,0.15);
    overflow: hidden;
    padding: 4px 0;         // 上下内边距，选项不贴边

    // 单个选项（优化点击区域+间距）
    .lang-option {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 32px;         // 选项高度（统一）
      padding: 0 8px;       // 左右内边距
      cursor: pointer;
      transition: $transition;

      // hover/选中状态（层次清晰）
      &:hover {
        background-color: $light-primary;
      }
      &.selected {
        background-color: $primary-color;
      }

      // 下拉框内国旗（同步优化）
      .lang-flag {
        width: list.nth($flag-size, 1);
        height: list.nth($flag-size, 2);
        object-fit: cover;
        border-radius: 2px;
        border: $border-width solid #e0e0e0;
        // 选项hover/选中时，国旗边框变白
        .lang-option:hover &,
        .lang-option.selected & {
          border-color: $white;
        }
      }
    }
  }
}
</style>
