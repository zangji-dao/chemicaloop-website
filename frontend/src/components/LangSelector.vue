<template>
  <!-- 多语言选择器核心容器 -->
  <div class="lang-selector-container" ref="selectorRef">
    <!-- 下拉触发器：显示当前语言国旗+下拉箭头 -->
    <div
      class="lang-trigger"
      @click="toggleDropdown"
      :class="{ active: isDropdownOpen }"
      :title="`Current language: ${currentLangOption.label}`"
    >
      <img
        :src="currentLangOption.flag"
        :alt="`${currentLangOption.label} flag`"
        class="lang-flag"
        @error="handleImgError(currentLangOption, true)"
      />
      <span class="lang-arrow" :class="{ rotated: isDropdownOpen }">▼</span>
    </div>

    <!-- 下拉选项列表：居中显示+窄宽度 -->
    <div class="lang-dropdown" v-show="isDropdownOpen">
      <div
        class="lang-option"
        v-for="option in langOptions"
        :key="option.value"
        @click="handleLangSelect(option)"
        :class="{ selected: option.value === currentLangOption.value }"
        :title="`Switch to ${option.label}`"
      >
        <img
          :src="option.flag"
          :alt="`${option.label} flag`"
          class="lang-flag"
          @error="handleImgError(option)"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
// 核心依赖导入
import { ref, watch, onMounted, onUnmounted, defineEmits, defineExpose } from 'vue'
import { useI18n } from 'vue-i18n'

// 自定义事件：保留你的原有事件 + 新增select事件（兼容父组件关闭菜单）
const emit = defineEmits(['langClick', 'langChange', 'select'])

// 国旗资源导入（确保 src/assets/flags/ 下有对应图片）
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
  { value: 'ar', label: 'Arabic', flag: arFlag },
  { value: 'de', label: 'German', flag: deFlag },
  { value: 'en', label: 'English', flag: enFlag },
  { value: 'es', label: 'Spanish', flag: esFlag },
  { value: 'hi', label: 'Hindi', flag: hiFlag },
  { value: 'id', label: 'Indonesian', flag: idFlag },
  { value: 'ja', label: 'Japanese', flag: jaFlag },
  { value: 'ko', label: 'Korean', flag: koFlag },
  { value: 'pt', label: 'Portuguese', flag: ptFlag },
  { value: 'ru', label: 'Russian', flag: ruFlag },
  { value: 'zh', label: 'Chinese', flag: zhFlag },
]

// 响应式状态（初始化为英语，避免空值）
const { locale } = useI18n()
const isDropdownOpen = ref(false)
const currentLangOption = ref(langOptions.find((opt) => opt.value === 'en') || langOptions[2])
const selectorRef = ref(null)

// 国旗加载失败兜底
const handleImgError = (option, isTrigger = false) => {
  console.error(`【Flag load failed】${option.label} → Path: ${option.flag}`)
  // 兜底占位图
  const fallbackFlag =
    'https://via.placeholder.com/28x20/004a99/ffffff?text=' +
    option.label.substring(0, 2).toUpperCase()
  event.target.src = fallbackFlag
  if (isTrigger) event.target.style.borderColor = '#004a99'
}

// 切换下拉框显隐（保留原有langClick事件派发）
const toggleDropdown = () => {
  isDropdownOpen.value = !isDropdownOpen.value
  if (isDropdownOpen.value) emit('langClick') // 原有逻辑：展开时派发langClick
}

// 新增：关闭下拉菜单的方法（供父组件调用）
const closeDropdown = () => {
  isDropdownOpen.value = false
}

// 点击外部关闭下拉框
const handleClickOutside = (e) => {
  if (selectorRef.value && !selectorRef.value.contains(e.target) && isDropdownOpen.value) {
    isDropdownOpen.value = false
  }
}

// 选择语言逻辑（核心修改：补充select事件派发，用于关闭菜单）
const handleLangSelect = (option) => {
  if (!option) return
  currentLangOption.value = option
  locale.value = option.value
  localStorage.setItem('defaultLang', option.value)
  isDropdownOpen.value = false

  emit('langChange') // 原有事件：语言变更
  emit('select') // 新增事件：通知父组件关闭移动端菜单
}

// 初始化
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  // 读取本地存储的语言配置
  const savedLang = localStorage.getItem('defaultLang')
  if (savedLang) {
    const matchedOption = langOptions.find((opt) => opt.value === savedLang)
    if (matchedOption) currentLangOption.value = matchedOption
  }
  locale.value = currentLangOption.value.value
})

// 清理监听
onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// 监听全局语言变化
watch(locale, (newLang) => {
  if (!newLang) return
  const matchedOption = langOptions.find((opt) => opt.value === newLang)
  if (matchedOption) currentLangOption.value = matchedOption
})

// 核心：暴露closeDropdown方法给父组件调用
defineExpose({
  closeDropdown,
  isDropdownOpen, // 可选：暴露状态供父组件查看
})
</script>

<style scoped lang="scss">
@use 'sass:list';

// 核心样式变量
$primary-color: #004a99 !default;
$white: #ffffff !default;
$border-width: 1px !default;
$flag-size: 28px 20px !default;
$trigger-height: 36px !default;
$transition: all 0.2s ease !default;

// 核心容器
.lang-selector-container {
  position: relative !important;
  display: inline-block !important;
  z-index: 99999 !important;
  margin: 0 !important;
  padding: 0 !important;

  // 下拉触发器
  .lang-trigger {
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    gap: 6px !important;
    width: auto !important;
    height: $trigger-height !important;
    padding: 0 12px !important;
    background-color: $white !important;
    border: $border-width solid $primary-color !important;
    border-radius: 6px !important;
    cursor: pointer !important;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1) !important;
    transition: $transition !important;
    color: $primary-color !important;
    font-size: 14px !important;

    &:hover,
    &.active {
      background-color: $primary-color !important;
      color: $white !important;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15) !important;
    }

    // 国旗样式
    .lang-flag {
      width: list.nth($flag-size, 1) !important;
      height: list.nth($flag-size, 2) !important;
      object-fit: cover !important;
      border-radius: 2px !important;
      border: $border-width solid #e0e0e0 !important;
      display: block !important;
      margin: 0 !important;
      padding: 0 !important;

      .lang-trigger:hover &,
      .lang-trigger.active & {
        border-color: $white !important;
      }
    }

    // 下拉箭头
    .lang-arrow {
      font-size: 10px !important;
      color: inherit !important;
      line-height: 1 !important;
      transition: $transition !important;
      transform-origin: center !important;

      &.rotated {
        transform: rotate(180deg) !important;
      }
    }
  }

  // 下拉列表（窄宽度+居中显示）
  .lang-dropdown {
    position: absolute !important;
    top: calc(100% + 4px) !important;
    left: 50% !important;
    transform: translateX(-50%) !important; // 水平居中
    min-width: 50px !important; // 窄宽度
    max-width: 80px !important;
    background-color: $white !important;
    border: $border-width solid $primary-color !important;
    border-radius: 6px !important;
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15) !important;
    overflow: hidden !important;
    padding: 4px 0 !important;
    margin: 0 !important;
    z-index: 99999 !important;

    // 单个选项（居中显示）
    .lang-option {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      height: 36px !important;
      padding: 0 8px !important;
      cursor: pointer !important;
      transition: $transition !important;
      width: 100% !important;
      box-sizing: border-box !important;

      &:hover {
        background-color: rgba(0, 74, 153, 0.1) !important;
      }

      &.selected {
        background-color: $primary-color !important;
      }

      // 选项内国旗
      .lang-flag {
        width: list.nth($flag-size, 1) !important;
        height: list.nth($flag-size, 2) !important;
        object-fit: cover !important;
        border-radius: 2px !important;
        border: $border-width solid #e0e0e0 !important;
        display: block !important;

        .lang-option:hover & {
          border-color: $primary-color !important;
        }

        .lang-option.selected & {
          border-color: $white !important;
        }
      }
    }
  }
}
</style>
