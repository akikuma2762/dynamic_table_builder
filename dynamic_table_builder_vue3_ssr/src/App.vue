<script setup lang="ts">
import { ref, onMounted, onErrorCaptured } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isLoading = ref(false)
const isClient = ref(false)
const hasError = ref(false)
const errorMessage = ref('')

// 確保客戶端狀態
onMounted(() => {
  isClient.value = true
  
  // 監聽客戶端激活事件
  if (typeof window !== 'undefined') {
    window.addEventListener('app:hydrated', () => {
      console.log('🎉 應用程式已成功激活客戶端狀態')
    })
  }
})

// 路由切換時的加載狀態
router.beforeEach((_to, _from, next) => {
  isLoading.value = true
  hasError.value = false
  next()
})

router.afterEach(() => {
  // 延遲一點點確保組件渲染完成
  setTimeout(() => {
    isLoading.value = false
  }, 100)
})

// 全域錯誤處理
onErrorCaptured((error, _instance, info) => {
  console.error('應用程式錯誤:', error, info)
  hasError.value = true
  errorMessage.value = error.message || '發生未知錯誤'
  isLoading.value = false
  return false // 防止錯誤繼續向上傳播
})
</script>

<template>
  <div class="app">
    <!-- 現代化導航欄 -->
    <nav class="nav">
      <div class="nav-container">
        <div class="nav-brand">
          <h1>📊 Dynamic Table Builder</h1>
          <span class="nav-badge">SSR</span>
        </div>
        
        <div class="nav-links">
          <router-link to="/" class="nav-link">
            <span class="nav-icon">🏠</span>
            首頁
          </router-link>
          <router-link to="/builder" class="nav-link">
            <span class="nav-icon">🔨</span>
            建立器
          </router-link>
          <router-link to="/preview" class="nav-link">
            <span class="nav-icon">👁️</span>
            預覽
          </router-link>
          <router-link to="/saved" class="nav-link">
            <span class="nav-icon">💾</span>
            已儲存
          </router-link>
          <router-link to="/legacy" class="nav-link nav-link-secondary">
            舊版
          </router-link>
        </div>
      </div>
    </nav>
    
    <!-- 主內容區域 -->
    <main class="main-content">
      <!-- 錯誤狀態 -->
      <div v-if="hasError" class="error-state">
        <div class="error-content">
          <div class="error-icon">⚠️</div>
          <h3>糟糕！出了點問題</h3>
          <p>{{ errorMessage }}</p>
          <div class="error-actions">
            <button @click="() => { hasError = false; $router.go(0) }" class="btn btn-primary">
              重新載入頁面
            </button>
            <button @click="() => { hasError = false; $router.push('/') }" class="btn btn-secondary">
              返回首頁
            </button>
          </div>
        </div>
      </div>
      
      <!-- 加載狀態 -->
      <div v-else-if="isLoading" class="loading-overlay">
        <div class="loading-spinner">
          <div class="spinner"></div>
          <p>頁面載入中...</p>
        </div>
      </div>
      
      <!-- 路由內容 -->
      <div v-else class="route-content">
        <Suspense>
          <template #default>
            <router-view />
          </template>
          <template #fallback>
            <div class="loading-fallback">
              <div class="loading-spinner">
                <div class="spinner"></div>
                <p>組件載入中...</p>
              </div>
            </div>
          </template>
        </Suspense>
      </div>
    </main>
    
    <!-- 簡化的頁腳 -->
    <footer class="footer">
      <div class="footer-content">
        <p>Powered by Vite + Vue 3 + SSR</p>
        <div class="footer-links">
          <a href="https://vite.dev" target="_blank" class="footer-link">Vite</a>
          <a href="https://vuejs.org/" target="_blank" class="footer-link">Vue.js</a>
        </div>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 現代化導航欄 */
.nav {
  background: linear-gradient(135deg, var(--primary-600) 0%, var(--primary-700) 100%);
  border-bottom: 1px solid var(--primary-800);
  box-shadow: var(--shadow-lg);
  position: sticky;
  top: 0;
  z-index: 50;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-6);
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 64px;
}

.nav-brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.nav-brand h1 {
  color: white;
  margin: 0;
  font-size: var(--text-xl);
  font-weight: 700;
}

.nav-badge {
  background: var(--warning-500);
  color: white;
  padding: var(--space-1) var(--space-2);
  border-radius: var(--radius-md);
  font-size: var(--text-xs);
  font-weight: 600;
  text-transform: uppercase;
}

.nav-links {
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.nav-link {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: rgba(255, 255, 255, 0.9);
  text-decoration: none;
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-lg);
  font-size: var(--text-sm);
  font-weight: 500;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.nav-link:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  transform: translateY(-1px);
}

.nav-link.router-link-active {
  background: rgba(255, 255, 255, 0.15);
  color: white;
  box-shadow: var(--shadow-sm);
}

.nav-link-secondary {
  opacity: 0.7;
  font-size: var(--text-xs);
}

.nav-icon {
  font-size: var(--text-base);
}

/* 主內容區域 */
.main-content {
  flex: 1;
  padding: var(--space-8) var(--space-6);
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
  position: relative;
}

/* 加載狀態樣式 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.loading-fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.loading-spinner {
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid var(--gray-200);
  border-top: 4px solid var(--primary-500);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto var(--space-4);
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-spinner p {
  color: var(--gray-600);
  font-size: var(--text-sm);
  margin: 0;
}

/* 錯誤狀態樣式 */
.error-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: var(--space-8);
}

.error-content {
  text-align: center;
  max-width: 500px;
}

.error-icon {
  font-size: 4rem;
  margin-bottom: var(--space-4);
}

.error-content h3 {
  color: var(--error-600);
  margin-bottom: var(--space-2);
  font-size: var(--text-xl);
}

.error-content p {
  color: var(--gray-600);
  margin-bottom: var(--space-6);
  font-size: var(--text-base);
  line-height: 1.6;
}

.error-actions {
  display: flex;
  gap: var(--space-4);
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-lg);
  border: none;
  font-size: var(--text-sm);
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-primary {
  background: var(--primary-500);
  color: white;
}

.btn-primary:hover {
  background: var(--primary-600);
  transform: translateY(-1px);
}

.btn-secondary {
  background: var(--gray-500);
  color: white;
}

.btn-secondary:hover {
  background: var(--gray-600);
  transform: translateY(-1px);
}

.route-content {
  min-height: 400px;
}

/* 現代化頁腳 */
.footer {
  background: var(--gray-900);
  color: var(--gray-300);
  border-top: 1px solid var(--gray-800);
}

.footer-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-6);
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: var(--text-sm);
}

.footer-links {
  display: flex;
  gap: var(--space-4);
}

.footer-link {
  color: var(--gray-400);
  text-decoration: none;
  transition: color var(--transition-fast);
}

.footer-link:hover {
  color: var(--primary-400);
}

/* 響應式設計 */
@media (max-width: 768px) {
  .nav-container {
    flex-direction: column;
    gap: var(--space-4);
    padding: var(--space-4);
  }
  
  .nav-links {
    flex-wrap: wrap;
    justify-content: center;
  }
  
  .nav-link {
    flex: 1;
    justify-content: center;
    min-width: 80px;
  }
  
  .nav-icon {
    display: none;
  }
  
  .main-content {
    padding: var(--space-4);
  }
  
  .footer-content {
    flex-direction: column;
    gap: var(--space-2);
    text-align: center;
  }
}

@media (max-width: 480px) {
  .nav-brand h1 {
    font-size: var(--text-lg);
  }
  
  .nav-links {
    width: 100%;
  }
  
  .nav-link {
    font-size: var(--text-xs);
    padding: var(--space-2);
  }
}
</style>
