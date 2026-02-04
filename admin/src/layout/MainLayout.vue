<template>
  <div class="main-layout">
    <!-- 侧边导航 -->
    <aside class="sidebar" :class="{ 'sidebar--collapsed': isCollapsed }">
      <!-- 侧边栏Logo -->
      <div class="sidebar-logo">
        <img
          src="@/assets/images/logo/logo-white-bg.png"
          alt="System Logo"
          class="logo-img"
        />
        <span class="logo-text" v-if="!isCollapsed">Admin Panel</span>
      </div>

      <!-- 导航菜单 -->
      <nav class="sidebar-menu">
        <ul>
          <!-- 首页菜单 -->
          <li class="menu-item" :class="{ active: $route.path === '/home' }">
            <router-link to="/home">
              <i class="fa fa-home menu-icon"></i>
              <span class="menu-text" v-if="!isCollapsed">Dashboard</span>
            </router-link>
          </li>

          <!-- 内容管理（管理员+编辑都可见） -->
          <li
            class="menu-item"
            :class="{ active: $route.path.includes('/home/content') }"
          >
            <router-link to="/home/content">
              <i class="fa fa-file-text-o menu-icon"></i>
              <span class="menu-text" v-if="!isCollapsed"
                >Content Management</span
              >
            </router-link>
          </li>

          <!-- 系统配置（仅管理员可见） -->
          <li
            class="menu-item"
            :class="{ active: $route.path.includes('/home/system') }"
            v-if="userInfo.role === 'admin'"
          >
            <router-link to="/home/system">
              <i class="fa fa-cog menu-icon"></i>
              <span class="menu-text" v-if="!isCollapsed">System Config</span>
            </router-link>
          </li>
        </ul>
      </nav>
    </aside>

    <!-- 主内容区域 -->
    <div class="main-content">
      <!-- 顶部栏 -->
      <header class="top-bar">
        <!-- 折叠/展开侧边栏按钮 -->
        <button class="sidebar-toggle" @click="isCollapsed = !isCollapsed">
          <i class="fa" :class="isCollapsed ? 'fa-bars' : 'fa-angle-left'"></i>
        </button>

        <!-- 右侧：用户信息+退出登录 -->
        <div class="user-actions">
          <div class="user-info">
            <span class="user-nickname">{{
              userInfo.nickname || userInfo.username
            }}</span>
            <span
              class="user-role"
              :class="userInfo.role === 'admin' ? 'role-admin' : 'role-editor'"
            >
              {{ userInfo.role === "admin" ? "Admin" : "Editor" }}
            </span>
          </div>
          <button class="logout-btn" @click="handleLogout">
            <i class="fa fa-sign-out"></i>
            <span class="logout-text">Logout</span>
          </button>
        </div>
      </header>

      <!-- 内容区域（路由出口） -->
      <div class="content-wrap">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
const isCollapsed = ref(false);
const userInfo = ref(JSON.parse(localStorage.getItem("userInfo") || "{}"));

// 退出登录
const handleLogout = () => {
  localStorage.clear();
  router.push("/login");
};
</script>

<style lang="scss" scoped>
// 本地样式变量（和登录页统一）
$primary-color: #004a99;
$white-color: #fff;
$error-color: #ff4d4f;

.main-layout {
  width: 100vw;
  height: 100vh;
  display: flex;
  overflow: hidden;
  background-color: #f5f7fa;
}

// 侧边导航
.sidebar {
  width: 220px;
  height: 100%;
  background-color: $primary-color;
  color: $white-color;
  transition: width 0.3s ease;
  overflow: hidden;

  &--collapsed {
    width: 60px;
  }

  .sidebar-logo {
    display: flex;
    align-items: center;
    justify-content: flex-start;
    padding: 0 16px;
    height: 60px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);

    .logo-img {
      width: 36px;
      height: auto;
      object-fit: contain;
    }

    .logo-text {
      margin-left: 12px;
      font-size: 18px;
      font-weight: 600;
    }
  }

  .sidebar-menu {
    margin-top: 20px;

    ul {
      list-style: none;
    }

    .menu-item {
      margin-bottom: 4px;

      a {
        display: flex;
        align-items: center;
        padding: 14px 20px;
        color: rgba(255, 255, 255, 0.9);
        text-decoration: none;
        transition: background-color 0.3s;

        &:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
      }

      &.active a {
        background-color: rgba(255, 255, 255, 0.2);
        color: $white-color;
      }

      .menu-icon {
        font-size: 16px;
        width: 24px;
        text-align: center;
      }

      .menu-text {
        margin-left: 12px;
        font-size: 14px;
      }
    }
  }
}

// 主内容区域
.main-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

// 顶部栏
.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 20px;
  background-color: $white-color;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  z-index: 10;

  .sidebar-toggle {
    background: none;
    border: none;
    color: $primary-color;
    font-size: 20px;
    cursor: pointer;
    padding: 8px;

    &:hover {
      color: #003060;
    }
  }

  .user-actions {
    display: flex;
    align-items: center;
    gap: 20px;
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 8px;

    .user-nickname {
      font-size: 14px;
      color: #333;
      font-weight: 500;
    }

    .user-role {
      font-size: 12px;
      padding: 2px 8px;
      border-radius: 12px;
      color: $white-color;

      &.role-admin {
        background-color: #42b983;
      }

      &.role-editor {
        background-color: #409eff;
      }
    }
  }

  .logout-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background: none;
    border: none;
    color: #666;
    font-size: 14px;
    cursor: pointer;
    padding: 8px 12px;
    border-radius: 4px;

    &:hover {
      background-color: #f5f5f5;
      color: $error-color;
    }

    .logout-text {
      display: inline-block;
    }
  }
}

// 内容包裹区
.content-wrap {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: #f5f7fa;

  @media (max-width: 768px) {
    padding: 15px;
  }
}

// 响应式适配
@media (max-width: 992px) {
  .sidebar {
    width: 60px;

    .logo-text,
    .menu-text {
      display: none;
    }
  }

  .sidebar--collapsed {
    width: 220px;

    .logo-text,
    .menu-text {
      display: inline-block;
    }
  }
}

@media (max-width: 768px) {
  .top-bar {
    padding: 0 15px;

    .user-info .user-nickname {
      display: none;
    }

    .logout-btn .logout-text {
      display: none;
    }
  }
}
</style>
