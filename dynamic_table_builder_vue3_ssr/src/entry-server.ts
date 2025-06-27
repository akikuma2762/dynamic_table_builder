import { createSSRApp } from 'vue'
import './style.css'
import './assets/design-system.css'
import './assets/table-global.css'
import './assets/draggable-item.css'
import './assets/components.css'
import App from './App.vue'
// @ts-ignore
import { createRouter } from './router'
import { renderToString } from '@vue/server-renderer'

export async function render(url: string) {
  const app = createSSRApp(App)
  const router = createRouter()
  router.push(url)
  await router.isReady()
  app.use(router)
  return await renderToString(app)
}
