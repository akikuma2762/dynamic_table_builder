import { createApp } from 'vue'
import './style.css'
import './assets/design-system.css'
import './assets/table-global.css'
import './assets/draggable-item.css'
import './assets/components.css'
import App from './App.vue'
// @ts-ignore
import { createRouter } from './router'

const app = createApp(App)
const router = createRouter()
app.use(router)

// 等待路由準備完成，然後掛載應用
router.isReady().then(() => {
  app.mount('#app', true) // 第二個參數表示激活 SSR 內容
  
  // 發送客戶端激活事件，告知組件可以安全使用 localStorage
  window.dispatchEvent(new Event('app:hydrated'))
})

// 添加客戶端狀態標記
if (typeof window !== 'undefined') {
  (window as any).__CLIENT_HYDRATED__ = true
}
