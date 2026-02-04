<template>
  <div class="content-manage">
    <div class="page-header">
      <h2>Content Management</h2>
      <p>Manage articles, products and media resources</p>
    </div>

    <div class="content-placeholder">
      <div class="placeholder-icon">
        <i class="fa fa-file-text-o"></i>
      </div>
      <h3>Basic Version (Phase 1)</h3>
      <p>Function will be added in the next phase:</p>
      <ul class="feature-list">
        <li>Article Management (Add/Edit/Delete)</li>
        <li>Product Management (Add/Edit/Delete)</li>
        <li>Media Resource Library</li>
      </ul>
    </div>
  </div>
</template>

<script setup>
// 阶段一仅占位，无实际功能
</script>

<style lang="scss" scoped>
$primary-color: #004a99;
$white-color: #fff;

.content-manage {
  width: 100%;
  height: 100%;

  .page-header {
    margin-bottom: 30px;
    padding-bottom: 15px;
    border-bottom: 1px solid #eee;

    h2 {
      font-size: 22px;
      color: #333;
      margin-bottom: 5px;
    }

    p {
      font-size: 14px;
      color: #666;
    }
  }

  .content-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    background-color: $white-color;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
    text-align: center;

    .placeholder-icon {
      width: 64px;
      height: 64px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: rgba(0, 74, 153, 0.1);
      color: $primary-color;
      border-radius: 50%;
      font-size: 32px;
      margin-bottom: 20px;
    }

    h3 {
      font-size: 18px;
      color: #333;
      margin-bottom: 10px;
    }

    p {
      font-size: 14px;
      color: #666;
      margin-bottom: 20px;
    }

    .feature-list {
      list-style: none;
      text-align: left;
      width: 300px;
      max-width: 100%;

      li {
        font-size: 14px;
        color: #666;
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 8px;

        &::before {
          content: "•";
          color: $primary-color;
          font-weight: bold;
        }
      }
    }
  }
}
</style>
