我会把这些社交图标（位于`src/assets/icons/`目录下）添加到`AppFooter`中，和联系方式排版在同一区域，保持视觉统一且适配整体风格：


### 最终版 `AppFooter.vue`（含社交图标）
```vue
<!-- src/components/AppFooter.vue -->
<template>
  <footer class="app-footer">
    <div class="footer-content">
      <!-- Logo 区域 -->
      <img
        src="@/assets/logo-white-bg.png"
        alt="品牌Logo"
        class="footer-logo"
      >

      <!-- 文字+社交图标区 -->
      <div class="footer-text-and-social">
        <!-- 联系方式 + 社交图标 -->
        <div class="contact-and-social">
          <div class="contact-info">
            <p>T: +91.979 979 6565 | E: support@multichemindia.com</p>
          </div>
          <!-- 社交图标容器 -->
          <div class="social-icons">
            <a href="#" class="social-link" aria-label="X">
              <img src="@/assets/icons/x.png" alt="X" class="social-icon">
            </a>
            <a href="#" class="social-link" aria-label="LinkedIn">
              <img src="@/assets/icons/linkedin.png" alt="LinkedIn" class="social-icon">
            </a>
            <a href="#" class="social-link" aria-label="Facebook">
              <img src="@/assets/icons/facebook.png" alt="Facebook" class="social-icon">
            </a>
            <a href="#" class="social-link" aria-label="Instagram">
              <img src="@/assets/icons/instagram.png" alt="Instagram" class="social-icon">
            </a>
            <a href="#" class="social-link" aria-label="YouTube">
              <img src="@/assets/icons/youtube.png" alt="YouTube" class="social-icon">
            </a>
          </div>
        </div>

        <!-- 版权 + 快捷链接 -->
        <div class="copyright-and-links">
          <div class="copyright">
            © {{ currentYear }} Multichem Specialties Private Limited. All Rights Reserved.
          </div>
          <div class="footer-links">
            <a href="/privacy" class="link">Privacy Policy</a>
            <a href="/terms" class="link">Terms</a>
          </div>
        </div>
      </div>
    </div>
  </footer>
</template>

<script setup>
import { ref } from 'vue'
const currentYear = ref(new Date().getFullYear())
</script>

<style scoped>
.app-footer {
  background-color: #4a4a4a;
  color: #ffffff;
  padding: 25px 0;
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  gap: 25px;
  padding: 0 20px;
}

.footer-logo {
  height: 45px;
  object-fit: contain;
}

/* 文字+社交图标容器 */
.footer-text-and-social {
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex: 1;
}

/* 联系方式+社交图标 行布局 */
.contact-and-social {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 15px;
}

.contact-info {
  font-size: 14px;
  opacity: 0.9;
  line-height: 1.4;
}

/* 社交图标样式 */
.social-icons {
  display: flex;
  gap: 12px;
}
.social-link {
  display: inline-block;
  width: 24px; /* 统一图标尺寸 */
  height: 24px;
}
.social-icon {
  width: 100%;
  height: 100%;
  object-fit: contain;
  filter: invert(1); /* 图标转白（若原图标为深色），适配深色背景 */
  transition: opacity 0.2s;
}
.social-icon:hover {
  opacity: 0.8;
}

.copyright-and-links {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.copyright {
  font-size: 14px;
}

.footer-links .link {
  color: #ffffff;
  text-decoration: none;
  font-size: 14px;
  margin-right: 18px;
  transition: color 0.2s;
}
.footer-links .link:hover {
  color: #b3d4fc;
}

/* 移动端适配 */
@media (max-width: 768px) {
  .footer-content {
    flex-direction: column;
    text-align: center;
    gap: 15px;
  }
  .contact-and-social {
    justify-content: center;
  }
}
</style>
```


### 关键说明
1. **图标路径正确性**：
   所有社交图标均引用`src/assets/icons/`下的文件（如`x.png`对应`@/assets/icons/x.png`），无需调整路径。

2. **布局逻辑**：
   - 社交图标与联系方式放在同一行（通过`contact-and-social`的`flex`布局实现），右侧对齐；
   - 移动端下自动换行并居中，避免排版错乱。

3. **样式适配**：
   - 用`filter: invert(1)`将深色图标转为白色，完美适配深灰背景；
   - 统一图标尺寸为`24px`，保持视觉一致性；
   - 添加`hover`透明度变化，提升交互体验。


该组件已完整整合 **Logo + 联系方式 + 社交图标 + 版权 + 快捷链接**，排版整洁且适配全设备尺寸。若需调整图标大小、间距或增减社交平台，可直接修改对应代码块。
