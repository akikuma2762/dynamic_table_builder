<script setup lang="ts">
// import HelloWorld from './components/HelloWorld.vue'
// import router from './router';
</script>

<template>
  <header class="main-header">
    <nav class="main-nav">
      <div class="nav-logo">
        <span class="logo-text">📝 表格產生器</span>
      </div>
      <ul class="nav-list">
        <li><router-link to="/" exact>多表格產生器</router-link></li>
        <li><router-link to="/legacy">自訂項目產生器</router-link></li>
        <li><router-link to="/preview">預覽/編輯</router-link></li>
        <li><router-link to="/saved">暫存/完成區</router-link></li>
        
      </ul>
    </nav>
  </header>
  <main class="main-content">
    <router-view />
  </main>
</template>

<style scoped>
.main-header {
  background: linear-gradient(90deg, #3a78c3 0%, #42b883 100%);
  box-shadow: 0 2px 8px rgba(60, 60, 60, 0.06);
  padding: 0 0 0 0;
  position: fixed;
  top: 0;
  z-index: 100;
  width: 100%;
  height: 60px;

}
.main-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0.5rem 1.5rem;
}
.nav-logo {
  font-size: 1.4rem;
  font-weight: bold;
  color: #fff;
  letter-spacing: 1px;
  display: flex;
  align-items: center;
}
.logo-text {
  font-family: 'Noto Sans TC', 'Segoe UI', Arial, sans-serif;
  font-weight: 700;
  font-size: 1.2rem;
  color: #fff;
}
.nav-list {
  display: flex;
  gap: 0.5rem;
  list-style: none;
  margin: 0;
  padding: 0;
}
.nav-list li {
  margin: 0 0.5rem;
}
.nav-list a {
  display: block;
  padding: 0.5rem 1.1rem;
  border-radius: 6px;
  color: #fff;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.18s, color 0.18s;
  font-size: 1rem;
  letter-spacing: 0.5px;
}
.nav-list a.router-link-exact-active,
.nav-list a.router-link-active {
  background: rgba(255,255,255,0.18);
  color: #fff;
  font-weight: bold;
}
.nav-list a:hover {
  background: rgba(255,255,255,0.28);
  color: #fff;
}
.main-content {
  /* height: calc(100vh - 60px); */
  flex: 1 1 auto;
  max-width: 1200px;
  /* margin: 60px auto 0 auto; */
  /* padding: 2rem 1.5rem 3rem 1.5rem; */
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 4px 24px 0 rgba(60, 60, 60, 0.08);
  min-height: calc(100vh - 60px);
  display: flex;
  justify-content: center;
  margin-top: 60px;
}
@media (max-width: 800px) {
  .main-content {
    padding: 1rem 0.5rem 2rem 0.5rem;
  }
  .main-nav {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
  .nav-list {
    flex-wrap: wrap;
    gap: 0.2rem;
  }
}
</style>
