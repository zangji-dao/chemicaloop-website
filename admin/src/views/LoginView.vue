<template>
  <div class="login-page">
    <div class="login-container">
      <!-- 左侧Logo区域 -->
      <div class="login-area login-area--left">
        <img
          class="login-logo"
          src="@/assets/images/logo/logo-white-bg.png"
          alt="System Logo"
        />
      </div>

      <!-- 中间分割线（PC端显示，移动端隐藏） -->
      <div class="login-divider"></div>

      <!-- 右侧登录表单区域 -->
      <div class="login-area login-area--right">
        <h2 class="login-title">Sign In</h2>

        <!-- 登录表单 -->
        <form class="login-form" @submit.prevent="handleLogin">
          <!-- 用户名输入框 -->
          <div class="form-item">
            <input
              type="text"
              v-model="loginForm.username"
              placeholder="Username/Phone/Email"
              class="form-input"
              @blur="validateUsername"
              @focus="errors.username = ''"
            />
            <div class="error-tip" v-if="errors.username">
              {{ errors.username }}
            </div>
          </div>

          <!-- 密码输入框 + 显隐图标 -->
          <div class="form-item">
            <input
              :type="showPwd ? 'text' : 'password'"
              v-model="loginForm.password"
              placeholder="Password"
              class="form-input"
              @blur="validatePassword"
              @focus="errors.password = ''"
              @keyup.enter="handleLogin"
              @input="
                loginForm.password = loginForm.password.replace(/\s+/g, '')
              "
            />
            <span class="pwd-toggle" @click="showPwd = !showPwd">
              <i
                class="fa-solid"
                :class="showPwd ? 'fa-eye-slash' : 'fa-eye'"
              ></i>
            </span>
            <div class="error-tip" v-if="errors.password">
              {{ errors.password }}
            </div>
          </div>

          <!-- 忘记密码 + 记住密码（同行） -->
          <div class="form-actions__row">
            <a href="#" class="forgot-link">Forget Password</a>
            <label class="remember-wrap">
              <input
                type="checkbox"
                v-model="loginForm.remember"
                class="remember-checkbox"
              />
              <span class="remember-label">Remember Password</span>
            </label>
          </div>

          <!-- 登录按钮（单独一行） -->
          <div class="form-actions__btn-wrap">
            <button type="submit" class="login-btn" :disabled="isLoading">
              <span v-if="!isLoading">Go &gt;</span>
              <span v-if="isLoading">Logging in...</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage } from "element-plus";
import { login } from "@/api/login";
import { setToken, setUserInfo, clearAuth } from "@/utils/auth";

const router = useRouter();

// 登录表单数据
const loginForm = reactive({
  username: "",
  password: "",
  remember: false,
});

// 状态控制
const isLoading = ref(false);
const showPwd = ref(false);
const errors = reactive({
  username: "",
  password: "",
});

// 自动填充记住的密码
onMounted(() => {
  const rememberInfo = localStorage.getItem("rememberLogin");
  if (rememberInfo) {
    const { username, password } = JSON.parse(rememberInfo);
    loginForm.username = username;
    loginForm.password = atob(password);
    loginForm.remember = true;
  }
});

// 用户名验证
const validateUsername = () => {
  if (!loginForm.username.trim()) {
    errors.username = "Username cannot be empty";
  } else {
    errors.username = "";
  }
};

// 密码验证
const validatePassword = () => {
  if (!loginForm.password.trim()) {
    errors.password = "Password cannot be empty";
  } else {
    errors.password = "";
  }
};

// 表单整体验证
const validateForm = () => {
  validateUsername();
  validatePassword();
  return !errors.username && !errors.password;
};

// 核心登录逻辑 - 调用真实后端接口
const handleLogin = async () => {
  if (!validateForm()) return;
  isLoading.value = true;

  try {
    // 调用后端登录接口
    const response = await login({
      username: loginForm.username.trim(),
      password: loginForm.password.trim(),
    });

    const { code, message, data } = response;

    if (code === 200) {
      // 存储用户凭证和信息
      setToken(data.token);
      setUserInfo({
        userId: data.userId,
        username: data.username,
        realName: data.realName,
      });

      // 记住密码 - 密码加密存储
      if (loginForm.remember) {
        localStorage.setItem(
          "rememberLogin",
          JSON.stringify({
            username: loginForm.username.trim(),
            password: btoa(loginForm.password.trim()),
          })
        );
      } else {
        localStorage.removeItem("rememberLogin");
      }

      // 清空密码+跳转首页
      loginForm.password = "";
      ElMessage.success(message || "Login successful");
      router.push("/home");
    }
  } catch (error) {
    // 错误已在 request.js 的拦截器中处理，这里不需要额外处理
    console.error("Login error:", error);
  } finally {
    isLoading.value = false;
  }
};
</script>

<!-- 全局样式重置 -->
<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html,
body,
#app {
  width: 100%;
  height: 100%;
  font-family: system-ui, -apple-system, sans-serif;
  -webkit-tap-highlight-color: transparent;
}

:root {
  --primary-color: #004a99;
  --error-color: #ff4d4f;
  --white-color: #fff;
  --container-max-width: 800px;
  --container-mobile-width: 90%;
}
</style>

<!-- 登录页核心样式 -->
<style lang="scss" scoped>
.login-page {
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background-image: url("@/assets/images/login/BackEndLogin.png");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  position: relative;

  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.2);
    z-index: 0;
  }

  .login-container {
    z-index: 1;
  }

  @media (max-width: 768px) {
    background-size: auto 100%;
  }
}

.login-container {
  width: 100%;
  max-width: var(--container-max-width);
  min-height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;

  @media (max-width: 992px) {
    max-width: 700px;
    min-height: 450px;
  }

  @media (max-width: 768px) {
    max-width: var(--container-mobile-width);
    flex-direction: column;
    min-height: auto;
    gap: 20px;
  }
}

.login-divider {
  position: absolute;
  left: 50%;
  top: 0;
  bottom: 0;
  transform: translateX(-50%);
  width: 1px;
  background-color: var(--white-color);

  @media (max-width: 768px) {
    display: none;
  }
}

.login-area {
  width: 50%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 0 40px;

  @media (max-width: 992px) {
    padding: 0 20px;
  }

  @media (max-width: 768px) {
    width: 100%;
    height: auto;
    padding: 0;
  }

  &--left .login-logo {
    width: 200px;
    height: auto;
    object-fit: contain;

    @media (max-width: 992px) {
      width: 180px;
    }

    @media (max-width: 768px) {
      width: 150px;
      margin-bottom: 15px;
    }
  }

  &--right {
    .login-title {
      font-size: 26px;
      font-weight: 600;
      color: var(--white-color);
      margin-bottom: 25px;
      align-self: flex-start;

      @media (max-width: 992px) {
        font-size: 24px;
        margin-bottom: 20px;
      }

      @media (max-width: 768px) {
        font-size: 22px;
        align-self: center;
      }
    }

    .login-form {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 18px;

      @media (max-width: 768px) {
        width: 100%;
        gap: 15px;
      }
    }

    .form-item {
      width: 100%;
      position: relative;

      .form-input {
        width: 100%;
        padding: 12px 16px;
        border: 1px solid var(--white-color);
        border-radius: 4px;
        background: rgba(255, 255, 255, 0.9);
        color: var(--primary-color);
        font-size: 14px;

        @media (max-width: 768px) {
          padding: 14px 16px;
          font-size: 15px;
        }

        &::placeholder {
          color: rgba(0, 74, 153, 0.7);
        }

        &:focus {
          outline: none;
          border-color: var(--primary-color);
          background: #fff;
        }
      }

      .pwd-toggle {
        position: absolute;
        right: 15px;
        top: 50%;
        transform: translateY(-50%);
        color: var(--primary-color);
        font-size: 16px;
        cursor: pointer;
        user-select: none;

        @media (max-width: 768px) {
          font-size: 18px;
          right: 12px;
        }

        &:hover {
          color: #003060;
        }
      }

      .error-tip {
        font-size: 12px;
        color: var(--error-color);
        margin-top: 5px;

        @media (max-width: 768px) {
          font-size: 13px;
        }
      }
    }

    .form-actions__row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 5px;

      @media (max-width: 768px) {
        flex-direction: column;
        gap: 10px;
        margin-top: 8px;
        align-items: flex-start;
      }

      .forgot-link {
        color: var(--white-color);
        font-size: 13px;
        text-decoration: none;

        @media (max-width: 768px) {
          font-size: 14px;
        }

        &:hover {
          text-decoration: underline;
        }
      }

      .remember-wrap {
        display: flex;
        align-items: center;
        gap: 6px;

        @media (max-width: 768px) {
          gap: 8px;
        }

        .remember-checkbox {
          width: 16px;
          height: 16px;
          cursor: pointer;

          @media (max-width: 768px) {
            width: 18px;
            height: 18px;
          }
        }

        .remember-label {
          color: var(--white-color);
          font-size: 13px;
          cursor: pointer;
          user-select: none;

          @media (max-width: 768px) {
            font-size: 14px;
          }
        }
      }
    }

    .form-actions__btn-wrap {
      display: flex;
      justify-content: flex-end;
      margin-top: 15px;

      @media (max-width: 768px) {
        justify-content: stretch;
        margin-top: 12px;
      }

      .login-btn {
        background: var(--primary-color);
        color: var(--white-color);
        border: none;
        padding: 10px 24px;
        border-radius: 4px;
        font-weight: 500;
        cursor: pointer;
        transition: opacity 0.3s;

        @media (max-width: 768px) {
          width: 100%;
          padding: 14px 0;
          font-size: 16px;
        }

        &:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        &:hover:not(:disabled) {
          opacity: 0.9;
        }
      }
    }
  }
}
</style>
