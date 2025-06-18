import { createRouter, createWebHistory } from 'vue-router'
import MultiTableBuilder from '../components/MultiTableBuilder.vue'
import MultiTablePreview from '../components/MultiTablePreview.vue'
import MultiTableSavedArea from '../components/MultiTableSavedArea.vue'
import LegacyItemBuilder from '../components/LegacyItemBuilder.vue'

const routes = [
  { path: '/', name: 'Builder', component: MultiTableBuilder },
  { path: '/preview', name: 'Preview', component: MultiTablePreview },
  { path: '/saved', name: 'SavedArea', component: MultiTableSavedArea },
  {path: '/legacy', name: 'LegacyItemBuilder', component: LegacyItemBuilder },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
