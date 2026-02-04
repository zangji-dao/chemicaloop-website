<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h2>Welcome Back, {{ userInfo.nickname || userInfo.username }}!</h2>
      <p class="role-desc">
        {{
          userInfo.role === "admin"
            ? "You have full access to all features"
            : "You can manage content only"
        }}
      </p>
    </div>

    <!-- 快捷操作卡片 -->
    <div class="dashboard-cards">
      <div class="card" @click="$router.push('/home/content')">
        <div class="card-icon">
          <i class="fa fa-file-text-o"></i>
        </div>
        <div class="card-content">
          <h3>Content Management</h3>
          <p>Add/Edit/Delete Articles & Products</p>
        </div>
      </div>

      <div
        class="card"
        @click="$router.push('/home/system')"
        v-if="userInfo.role === 'admin'"
      >
        <div class="card-icon">
          <i class="fa fa-cog"></i>
        </div>
        <div class="card-content">
          <h3>System Config</h3>
          <p>Update Website Info & Backup Data</p>
        </div>
      </div>
    </div>

    <!-- 阶段一提示 -->
    <div class="dashboard-tip">
      <i class="fa fa-info-circle"></i>
      <p>
        This is the basic version of the admin panel. More features will be
        added later.
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";

const userInfo = ref(JSON.parse(localStorage.getItem("userInfo") || "{}"));
</script>

<style lang="scss" scoped>
$primary-color: #004a99;
$white-color: #fff;

.dashboard {
  width: 100%;
  height: 100%;

  .dashboard-header {
    margin-bottom: 30px;

    h2 {
      font-size: 24px;
      color: #333;
      margin-bottom: 8px;
    }

    .role-desc {
      font-size: 14px;
      color: #666;
    }
  }

  .dashboard-cards {
    display: flex;
    gap: 20px;
    margin-bottom: 30px;
    flex-wrap: wrap;

    .card {
      flex: 1;
      min-width: 280px;
      padding: 24px;
      background-color: $white-color;
      border-radius: 8px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
      cursor: pointer;
      transition: transform 0.3s, box-shadow 0.3s;

      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      }

      .card-icon {
        width: 48px;
        height: 48px;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: rgba(0, 74, 153, 0.1);
        color: $primary-color;
        border-radius: 8px;
        font-size: 24px;
        margin-bottom: 16px;
      }

      .card-content h3 {
        font-size: 18px;
        color: #333;
        margin-bottom: 8px;
      }

      .card-content p {
        font-size: 14px;
        color: #666;
      }
    }
  }

  .dashboard-tip {
    padding: 16px;
    background-color: rgba(0, 74, 153, 0.05);
    border-left: 4px solid $primary-color;
    border-radius: 4px;
    display: flex;
    align-items: center;
    gap: 12px;

    i {
      color: $primary-color;
      font-size: 18px;
    }

    p {
      font-size: 14px;
      color: #666;
    }
  }
}
</style>
