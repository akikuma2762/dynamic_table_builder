import Home from './components/Home.vue'
import MultiTableBuilder from './components/MultiTableBuilder.vue'
import MultiTablePreview from './components/MultiTablePreview.vue'
import MultiTableSavedArea from './components/MultiTableSavedArea.vue'
import LegacyItemBuilder from './components/LegacyItemBuilder.vue'
import CustomItemBuilder from './components/CustomItemBuilder.vue'

export default [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/builder',
    name: 'Builder',
    component: MultiTableBuilder
  },
  {
    path: '/preview',
    name: 'Preview',
    component: MultiTablePreview
  },
  {
    path: '/saved',
    name: 'Saved',
    component: MultiTableSavedArea
  },
  {
    path: '/legacy',
    name: 'Legacy',
    component: LegacyItemBuilder
  },
  {
    path: '/custom',
    name: 'Custom',
    component: CustomItemBuilder
  }
]
