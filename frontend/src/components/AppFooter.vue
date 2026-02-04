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
            <p>T: +86.15585606688 | E: support@chemicaloop.com</p>
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
            © {{ currentYear }} Chemicaloop. All Rights Reserved.
          </div>
          <div class="footer-links">
            <a href="#" class="link">Privacy Policy</a>
            <a href="#" class="link">Terms</a>
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
