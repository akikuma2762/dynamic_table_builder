<template>
  <div class="home">
    <h2>歡迎使用動態表格建立器</h2>
    <div class="welcome-content">
      <p>這是一個功能強大的動態表格建立器，支援：</p>
      <ul>
        <li>多表格建立與管理</li>
        <li>表格預覽與匯出</li>
        <li>已儲存表格管理</li>
        <li>舊版與自訂建立器</li>
        <li>伺服器端渲染 (SSR) 支援</li>
      </ul>
      <div class="action-buttons">
        <router-link to="/builder" class="btn btn-primary">開始建立表格</router-link>
        <router-link to="/saved" class="btn btn-secondary">查看已儲存</router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
// 首頁元件
</script>

<style scoped>
.home {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

.home h2 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
  font-size: 2rem;
}

.welcome-content {
  background: #f8f9fa;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.welcome-content p {
  font-size: 1.1rem;
  margin-bottom: 1rem;
  color: #34495e;
}

.welcome-content ul {
  margin-bottom: 2rem;
  padding-left: 1.5rem;
}

.welcome-content li {
  margin-bottom: 0.5rem;
  color: #555;
}

.action-buttons {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.btn {
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s;
}

.btn-primary {
  background: #3498db;
  color: white;
}

.btn-primary:hover {
  background: #2980b9;
}

.btn-secondary {
  background: #95a5a6;
  color: white;
}

.btn-secondary:hover {
  background: #7f8c8d;
}
</style>
