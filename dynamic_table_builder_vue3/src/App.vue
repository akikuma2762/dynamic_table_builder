<script setup lang="ts">
import HelloWorld from './components/HelloWorld.vue'
import router from './router';
</script>

<template>
  <div>
    <a href="https://vite.dev" target="_blank">
      <img src="/vite.svg" class="logo" alt="Vite logo" />
    </a>
    <a href="https://vuejs.org/" target="_blank">
      <img src="./assets/vue.svg" class="logo vue" alt="Vue logo" />
    </a>
  </div>
  <HelloWorld msg="Vite + Vue" />
  <nav style="margin-bottom: 2rem;">
    <router-link to="/">多表格產生器</router-link> |
    <router-link to="/preview">預覽/編輯</router-link> |
    <router-link to="/saved">暫存/完成區</router-link>
    <router-link to="/legacy">舊版表單產生器</router-link> |
  </nav>
  <router-view />
</template>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
nav a {
  margin: 0 8px;
  text-decoration: none;
  color: #3a78c3;
}
nav a.router-link-exact-active {
  font-weight: bold;
  color: #1a237e;
}
</style>
