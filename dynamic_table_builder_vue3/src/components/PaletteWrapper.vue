<template>
  <div :id="'palette-wrapper'" :class="{collapsed: paletteCollapsed}" tabindex="-1" @keydown.esc="onEscPalette">
    <div id="palette-toggle" @click="togglePalette" aria-label="切換調色盤" tabindex="0">
      <span class="toggle-caret" :class="{collapsed: paletteCollapsed}"></span>
    </div>
    <div id="palette-controls" style="margin-bottom: 0.5rem">
      <button id="toggleAll" class="small secondary" @click="toggleAllPalette">{{ allCollapsed ? '全部展開' : '全部收合' }}</button>
    </div>
    <div id="palette" v-show="!paletteCollapsed">
      <div class="palette-title-wrapper">
        <h4 class="collapsible" :tabindex="0" :aria-expanded="!nativeCollapsed" @click="toggleBlock('native')" @keydown.enter.prevent="toggleBlock('native')" @keydown.space.prevent="toggleBlock('native')">
          原生項目 <span class="caret" :class="{rotated: !nativeCollapsed}"></span>
        </h4>
      </div>
      <div id="palette-native" class="palette-block native" :class="{collapsed: nativeCollapsed, 'shadowed': !nativeCollapsed}">
        <div id="chkReusable" class="draggable-item reusable" draggable="true" @dragstart="e => onPaletteDragStart(nativeItems[0], e)" @mouseover="hoverDrag = 'chk'" @mouseleave="hoverDrag = ''">
          <PaletteCheckbox :label="nativeItems[0].props.label" />
          <span v-if="hoverDrag==='chk'" class="drag-hint" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 20 20"><path fill="#3a78c3" d="M7 2v2H3.5A1.5 1.5 0 0 0 2 5.5v9A1.5 1.5 0 0 0 3.5 16H7v2h6v-2h3.5a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 16.5 4H13V2H7zm0 4v8h6V6H7z"/></svg>
          </span>
        </div>
        <div id="txtReusable" class="draggable-item reusable" draggable="true" @dragstart="e => onPaletteDragStart(nativeItems[1], e)" @mouseover="hoverDrag = 'txt'" @mouseleave="hoverDrag = ''">
          <PaletteTextarea :placeholder="nativeItems[1].props.placeholder" />
          <span v-if="hoverDrag==='txt'" class="drag-hint" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 20 20"><path fill="#3a78c3" d="M7 2v2H3.5A1.5 1.5 0 0 0 2 5.5v9A1.5 1.5 0 0 0 3.5 16H7v2h6v-2h3.5a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 16.5 4H13V2H7zm0 4v8h6V6H7z"/></svg>
          </span>
        </div>
        <div id="sigReusable" class="draggable-item reusable" draggable="true" @dragstart="e => onPaletteDragStart(nativeItems[2], e)" @mouseover="hoverDrag = 'sig'" @mouseleave="hoverDrag = ''">
          <PaletteSignature :modalOnClick="false" />
          <span v-if="hoverDrag==='sig'" class="drag-hint" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 20 20"><path fill="#3a78c3" d="M7 2v2H3.5A1.5 1.5 0 0 0 2 5.5v9A1.5 1.5 0 0 0 3.5 16H7v2h6v-2h3.5a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 16.5 4H13V2H7zm0 4v8h6V6H7z"/></svg>
          </span>
        </div>
      </div>
      <div class="palette-title-wrapper">
        <h4 class="collapsible" :tabindex="0" :aria-expanded="!customCollapsed" @click="toggleBlock('custom')" @keydown.enter.prevent="toggleBlock('custom')" @keydown.space.prevent="toggleBlock('custom')">
          自訂項目 <span class="caret" :class="{rotated: !customCollapsed}"></span>
        </h4>
      </div>
      <div id="palette-custom" class="palette-block custom" :class="{collapsed: customCollapsed, 'shadowed': !customCollapsed}">
        <div v-for="item in customItems" :key="item.id" :id="item.id" class="draggable-item reusable" draggable="true" @dragstart="e => onPaletteDragStart(item, e)" @mouseover="hoverDrag = item.id" @mouseleave="hoverDrag = ''">
          <div v-html="item.html"></div>
          <button class="del-btn" @click.stop="removeCustomItem(item.id)" aria-label="刪除自訂項目" tabindex="0">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="5" y="9" width="14" height="10" rx="2" stroke="currentColor" stroke-width="2"/>
              <path d="M10 13V17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M14 13V17" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M3 6H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              <path d="M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6" stroke="currentColor" stroke-width="2"/>
            </svg>
          </button>
          <span v-if="hoverDrag===item.id" class="drag-hint" aria-hidden="true">
            <svg width="20" height="20" viewBox="0 0 20 20"><path fill="#3a78c3" d="M7 2v2H3.5A1.5 1.5 0 0 0 2 5.5v9A1.5 1.5 0 0 0 3.5 16H7v2h6v-2h3.5a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 16.5 4H13V2H7zm0 4v8h6V6H7z"/></svg>
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">

import { ref, onMounted } from 'vue'
import PaletteCheckbox from './PaletteCheckbox.vue'
import PaletteTextarea from './PaletteTextarea.vue'
import PaletteSignature from './PaletteSignature.vue'
import { paletteCustomApi } from '../utils/api'
import type { PaletteCustomItem } from '../types/paletteCustomResponse'

const paletteCollapsed = ref(false)
const nativeCollapsed = ref(false)
const customCollapsed = ref(false)
const allCollapsed = ref(false)
const nativeItems = ref([
  { id: 'chkReusable', component: 'PaletteCheckbox', props: { label: 'OK' } },
  { id: 'txtReusable', component: 'PaletteTextarea', props: { placeholder: '請輸入...' } },
  { id: 'sigReusable', component: 'PaletteSignature', props: {} }
])
const customItems = ref<PaletteCustomItem[]>([])
const hoverDrag = ref('')

onMounted(() => {
  loadCustomPalette()
})

function onEscPalette() {
  if (!paletteCollapsed.value) {
    paletteCollapsed.value = true
  }
}
function togglePalette() {
  paletteCollapsed.value = !paletteCollapsed.value
}
function toggleBlock(type: 'native' | 'custom') {
  if (type === 'native') nativeCollapsed.value = !nativeCollapsed.value
  if (type === 'custom') customCollapsed.value = !customCollapsed.value
}
function toggleAllPalette() {
  allCollapsed.value = !allCollapsed.value
  nativeCollapsed.value = allCollapsed.value
  customCollapsed.value = allCollapsed.value
}
function onPaletteDragStart(item: any, e?: DragEvent) {
  let dragItem = item
  if (!item.component && item.html) {
    const temp = document.createElement('div')
    temp.innerHTML = item.html
    const fields: any[] = []
    let keyIdx = 1
    temp.querySelectorAll('input').forEach((el: HTMLInputElement) => {
      if (el.type === 'checkbox') {
        fields.push({
          type: 'checkbox',
          key: 'chk' + keyIdx++,
          props: { checked: false, label: el.value || '勾選' }
        })
      } else if (el.type === 'text') {
        fields.push({
          type: 'inputText',
          key: 'txt' + keyIdx++,
          props: { value: '', placeholder: el.placeholder || '' }
        })
      }
    })
    dragItem = { ...item, component: 'custom', fields }
  }
  if (e) {
    if (e.dataTransfer) {
      e.dataTransfer.setData('text/plain', dragItem.id)
      e.dataTransfer.setData('application/json', JSON.stringify(dragItem))
    }
    e.dataTransfer!.effectAllowed = 'copy'
  }
}
async function removeCustomItem(id: string) {
  try {
    await paletteCustomApi.delete(id)
    customItems.value = customItems.value.filter(i => i.id !== id)
  } catch (err: any) {
    alert('刪除失敗：' + (err?.message || err))
  }
}
async function loadCustomPalette() {
  try {
    const res = await paletteCustomApi.getAll()
    if (res.data.success) {
      customItems.value = res.data.data
    }
  } catch (err: any) {
    console.error('載入自訂調色盤失敗：', err)
    customItems.value = []
  }
}
</script>

<style scoped>
#palette-wrapper {
  height: calc(100vh - 60px);
  position: fixed;
  right: 0;
  width: 340px;
  background: #fafbff;
  border-left: 1px solid #c3d0e6;
  box-shadow: -4px 0 16px rgba(60, 60, 60, 0.10);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding: 18px 10px 18px 16px;
  z-index: 998;
  border-radius: 0;
  outline: none;
  transition: transform 0.35s cubic-bezier(.4,1.4,.6,1);
}
#palette-wrapper.collapsed {
  transform: translateX(100%);
}
#palette-wrapper:focus {
  box-shadow: 0 0 0 3px #42b88355;
}
#palette-toggle {
  position: absolute;
  left: -38px;
  top: 50%;
  transform: translateY(-50%);
  width: 38px;
  height: 64px;
  border: none;
  border-radius: 50% 0 0 50%;
  background: linear-gradient(90deg, #3a78c3 0%, #42b883 100%);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 8px rgba(60, 60, 60, 0.10);
  user-select: none;
  font-size: 1.5rem;
  font-weight: bold;
  transition: background 0.2s;
  z-index: 1001;
}
#palette-toggle:hover, #palette-toggle:focus {
  background: linear-gradient(90deg, #42b883 0%, #3a78c3 100%);
  outline: none;
}
.toggle-caret {
  display: inline-block;
  width: 1rem;
  height: 1rem;
  border-right: 3px solid #fff;
  border-bottom: 3px solid #fff;
  margin-left: 4px;
  /* margin-bottom: 2px; */
  transform: rotate(-45deg);
  transition: transform 0.25s cubic-bezier(.4,1.4,.6,1);
}
.toggle-caret.collapsed {
  transform: rotate(135deg);
}
#palette{
  overflow-y: auto;
}
.palette-block {
  display: flex;
  flex-wrap: wrap;
  gap: 0.7rem;
  padding: 0.7rem;
  border: 1.5px dashed #b0b8c9;
  margin-bottom: 1rem;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(60,60,60,0.10);
  background: linear-gradient(120deg, #fafdff 60%, #eaf6ff 100%);
  transition: max-height 0.35s cubic-bezier(.4,1.4,.6,1), opacity 0.25s, padding 0.25s, margin 0.25s, border-width 0.25s, box-shadow 0.25s, background 0.25s;
  overflow: clip;
}
.palette-block.shadowed {
  box-shadow: 0 6px 24px rgba(60,60,60,0.18);
  background: linear-gradient(120deg, #fafdff 0%, #d6eaff 100%);
}
.palette-block.collapsed {
  /* 由 display: none 改為滑動收合動畫 */
  max-height: 0 !important;
  opacity: 0;
  overflow: hidden;
  padding: 0 0.7rem;
  margin-bottom: 0;
  border-width: 0;
  box-shadow: none;
  background: transparent;
  transition: max-height 0.35s cubic-bezier(.4,1.4,.6,1), opacity 0.25s, padding 0.25s, margin 0.25s, border-width 0.25s;
}
.palette-title-wrapper {
  padding: 0.3rem 0.7rem 0.1rem 0.7rem;
}
.palette-block .draggable-item {
  background: #f5faff;
  border-radius: 8px;
  box-shadow: 0 1px 6px rgba(60, 60, 60, 0.04);
  padding: 0.5rem 0.7rem 0.5rem 0.7rem;
  min-width: 80px;
  min-height: 36px;
  display: flex;
  align-items: center;
  position: relative;
  z-index: 1;
  transition: box-shadow 0.18s, background 0.18s, opacity 0.18s, transform 0.18s;
  cursor: grab;
}
.palette-block .draggable-item:hover {
  box-shadow: 0 6px 18px #3a78c344;
  background: #e6f7ff;
  transform: translateY(-2px) scale(1.03);
}
.palette-block .draggable-item:active {
  cursor: grabbing;
  opacity: 0.6;
  box-shadow: 0 8px 32px rgba(60,60,60,0.22);
  transform: scale(1.04);
}
.palette-block .draggable-item.dragging {
  opacity: 0.5;
  box-shadow: 0 8px 32px rgba(60,60,60,0.22);
  z-index: 10;
}
.drag-hint {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  opacity: 0.7;
  pointer-events: none;
}
.palette-block .del-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #b0b8c9;
  background: transparent;
  border: none;
  outline: none;
  transition: background 0.18s, color 0.18s, box-shadow 0.18s;
  padding: 0;
}
.palette-block .del-btn:hover, .palette-block .del-btn:focus {
  background: #ffeaea;
  color: #d32f2f;
  box-shadow: 0 0 0 2px #ffbdbd;
}
.caret {
  display: inline-block;
  width: 1em;
  height: 1em;
  border-right: 2.5px solid #3a78c3;
  border-bottom: 2.5px solid #3a78c3;
  margin-left: 6px;
  margin-bottom: 2px;
  transform: rotate(-45deg);
  transition: transform 0.25s cubic-bezier(.4,1.4,.6,1);
}
.caret.rotated {
  transform: rotate(45deg);
}

.collapsible {
  cursor: pointer;
  user-select: none;
  outline: none;
  padding: 0.2rem 0.5rem;
  border-radius: 7px;
  font-size: 1.08rem;
  font-weight: 600;
  color: #3a78c3;
  transition: background 0.18s, box-shadow 0.18s;
}
.collapsible:focus, .collapsible:hover {
  background: #e6f7ff;
  box-shadow: 0 0 0 2px #42b88355;
}
</style>