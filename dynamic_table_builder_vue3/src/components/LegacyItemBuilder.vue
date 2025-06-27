<template>
  <div class="legacy-item-builder">
<fieldset id="itemBuilder" style="margin-bottom: 1rem">
    <legend>自訂檢查項目產生器</legend>
    <label>
      <div>Checkbox 標籤:</div>
      <input ref="builderChkLabel" type="text" placeholder="OK" class="modern-input" />
      <button type="button" class="main-btn" @click="addCustomCheckbox">➕ 加入 Checkbox</button>
    </label>
    <br /><br />
    <label>
      <div>文字輸入 placeholder:</div>
      <input ref="builderInputPH" type="text" placeholder="請輸入…" class="modern-input" />
      <button type="button" class="main-btn" @click="addCustomInput">➕ 加入輸入框</button>
    </label>
    <br /><br />
    <div id="quillToolbar" ref="quillToolbar" class="quill-toolbar-modern">
      <span class="ql-formats">
        <button class="ql-bold" aria-label="粗體"></button>
        <button class="ql-italic" aria-label="斜體"></button>
        <button class="ql-underline" aria-label="底線"></button>
      </span>
      <span class="ql-formats">
        <button class="ql-list" value="ordered" aria-label="有序清單"></button>
        <button class="ql-list" value="bullet" aria-label="無序清單"></button>
      </span>
      <span class="ql-formats">
        <button class="ql-link" aria-label="插入連結"></button>
        <span class="ql-formats">
          <select class="ql-size" aria-label="字體大小">
            <option value="small"></option>
            <option selected></option>
            <option value="large"></option>
            <option value="huge"></option>
          </select>
          <select class="ql-color" aria-label="文字顏色"></select>
          <select class="ql-background" aria-label="背景顏色"></select>
        </span>
      </span>
    </div>
    <div id="quillEditor" ref="quillEditor" class="modern-quill-editor"></div>
    <div id="builderPreview" ref="builderPreview" :class="['modern-preview', previewHighlight ? 'highlight' : '']">(預覽區)</div>
    <br />
    <button type="button" class="main-btn" @click="addCustomHtml">新增到調色盤</button>
    <button type="button" class="main-btn secondary" @click="clearBuilder">清空輸入</button>
   
  </fieldset>

  </div>
  
   <!-- palette-wrapper 區塊移植於此 -->
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
import { ref, onMounted, watch, defineProps, defineEmits, nextTick } from 'vue'
import Quill from 'quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'
import PaletteCheckbox from './PaletteCheckbox.vue'
import PaletteTextarea from './PaletteTextarea.vue'
import PaletteSignature from './PaletteSignature.vue'

const props = defineProps<{ collapsed: boolean }>();
const emit = defineEmits(['update:collapsed'])

const builderChkLabel = ref<HTMLInputElement | null>(null)
const builderInputPH = ref<HTMLInputElement | null>(null)
const quillToolbar = ref<HTMLDivElement | null>(null)
const quillEditor = ref<HTMLDivElement | null>(null)
const builderPreview = ref<HTMLDivElement | null>(null)
let quill: any = null

// palette 狀態與資料
const paletteCollapsed = ref(props.collapsed)
const nativeCollapsed = ref(false)
const customCollapsed = ref(false)
const allCollapsed = ref(false)
const nativeItems = ref([
  { id: 'chkReusable', component: 'PaletteCheckbox', props: { label: 'OK' } },
  { id: 'txtReusable', component: 'PaletteTextarea', props: { placeholder: '請輸入...' } },
  { id: 'sigReusable', component: 'PaletteSignature', props: {} }
])
const customItems = ref<any[]>([])
const hoverDrag = ref('')
const previewHighlight = ref(false)

watch(() => props.collapsed, (val) => {
  paletteCollapsed.value = val
})

onMounted(() => {
  // 自訂 Blot 註冊
  const InlineEmbed = Quill.import('blots/embed')
  class CheckboxBlot extends InlineEmbed {
    static create(value = { label: 'OK' }) {
      const node = super.create();
      node.setAttribute('contenteditable', 'false');
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.value = value.label || 'OK';
      input.style.margin = '0 4px 0 0';
      const text = document.createTextNode(value.label || 'OK');
      node.appendChild(input);
      node.appendChild(text);
      return node;
    }
    static value(node: HTMLElement) {
      return { label: node.textContent?.trim() || '' };
    }
  }
  CheckboxBlot.blotName = 'checkbox';
  CheckboxBlot.tagName = 'span';
  Quill.register(CheckboxBlot, true);

  class TextInputBlot extends InlineEmbed {
    static create(value = { placeholder: '請輸入…', width: '100px' }) {
      const node = super.create();
      node.setAttribute('contenteditable', 'false');
      const input = document.createElement('input');
      input.type = 'text';
      input.placeholder = value.placeholder || '';
      input.style.width = value.width || '100px';
      node.appendChild(input);
      return node;
    }
    static value(node: HTMLElement) {
      const inp = node.querySelector('input');
      return {
        placeholder: inp?.placeholder || '',
        width: inp?.style.width || '',
      };
    }
  }
  TextInputBlot.blotName = 'textinput';
  TextInputBlot.tagName = 'span';
  Quill.register(TextInputBlot, true);

  // 初始化 Quill
  if (quillEditor.value) {
    quill = new Quill(quillEditor.value, {
      theme: 'snow',
      placeholder: '請輸入文字或使用右側按鈕插入元件…',
      modules: { toolbar: quillToolbar.value },
    })
    quill.on('text-change', syncQuillToPreview)
    syncQuillToPreview()
  }
})

function syncQuillToPreview() {
  if (!quill || !builderPreview.value) return
  const html = quill.root.innerHTML.trim()
  builderPreview.value.innerHTML = html || '(預覽區)'
  previewHighlight.value = false
  nextTick(() => {
    previewHighlight.value = true
    setTimeout(() => (previewHighlight.value = false), 600)
  })
}

function onEscPalette(e: KeyboardEvent) {
  if (!paletteCollapsed.value) {
    paletteCollapsed.value = true
    emit('update:collapsed', true)
  }
}
function addCustomCheckbox() {
  if (!quill) return
  const label = builderChkLabel.value?.value.trim() || 'OK'
  const index = quill.getSelection()?.index ?? quill.getLength()
  quill.insertEmbed(index, 'checkbox', { label })
  quill.insertText(index + 1, ' ')
  syncQuillToPreview()
}
function addCustomInput() {
  if (!quill) return
  const ph = builderInputPH.value?.value.trim() || '請輸入…'
  const index = quill.getSelection()?.index ?? quill.getLength()
  quill.insertEmbed(index, 'textinput', { placeholder: ph, width: '100px' })
  quill.insertText(index + 1, ' ')
  syncQuillToPreview()
}
function addCustomHtml() {
  if (!builderPreview.value) return
  const html = builderPreview.value.innerHTML
  if (!html || html === '(預覽區)') {
    alert('尚未設定內容')
    return
  }
  // 僅新增到 palette，不再 emit 給父元件
  const id = 'custom_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
  customItems.value.push({ id, html })
  saveCustomPalette()
  clearBuilder()
}
function clearBuilder() {
  if (!quill) return
  if (builderChkLabel.value) builderChkLabel.value.value = ''
  if (builderInputPH.value) builderInputPH.value.value = ''
  quill.setContents([])
  syncQuillToPreview()
}

function togglePalette() {
  paletteCollapsed.value = !paletteCollapsed.value
  emit('update:collapsed', paletteCollapsed.value)
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
  // 若為自訂 palette，解析 html 產生 fields，並補上 component: 'custom'
  if (!item.component && item.html) {
    const temp = document.createElement('div')
    temp.innerHTML = item.html
    const fields: import('../types/table').PaletteField[] = []
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
      // 新增：完整 palette 資料序列化
      e.dataTransfer.setData('application/json', JSON.stringify(dragItem))
    }
    e.dataTransfer!.effectAllowed = 'copy'
  }
}
function removeCustomItem(id: string) {
  customItems.value = customItems.value.filter(i => i.id !== id)
  saveCustomPalette()
}
function saveCustomPalette() {
  localStorage.setItem('paletteCustom', JSON.stringify(customItems.value))
}
function loadCustomPalette() {
  const raw = localStorage.getItem('paletteCustom')
  if (!raw) return
  try {
    customItems.value = JSON.parse(raw)
  } catch { customItems.value = [] }
}
onMounted(() => {
  loadCustomPalette()
})
</script>

<style scoped>
.modern-input {
  padding: 0.5rem 0.8rem;
  border-radius: 8px;
  border: 1.5px solid #b0b8c9;
  box-shadow: 0 1px 4px rgba(60,60,60,0.06);
  font-size: 1.08rem;
  margin-right: 1rem;
  margin-bottom: 0.5rem;
  transition: border 0.18s, box-shadow 0.18s;
}
.modern-input:focus {
  border: 1.5px solid #3a78c3;
  box-shadow: 0 0 0 2px #42b88333;
  outline: none;
}
.main-btn {
  background: linear-gradient(90deg, #3a78c3 0%, #42b883 100%);
  color: #fff;
  border: none;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(60,60,60,0.10);
  padding: 0.55rem 1.2rem;
  font-size: 1.08rem;
  margin-right: 0.7rem;
  margin-bottom: 0.5rem;
  cursor: pointer;
  transition: background 0.18s, box-shadow 0.18s, transform 0.12s;
}
.main-btn:hover, .main-btn:focus {
  background: linear-gradient(90deg, #42b883 0%, #3a78c3 100%);
  box-shadow: 0 4px 16px rgba(60,60,60,0.16);
  transform: scale(1.04);
  outline: none;
}
.main-btn.secondary, .small.secondary {
  background: #e6f0fa;
  color: #3a78c3;
  box-shadow: none;
}
.main-btn.secondary:hover, .small.secondary:hover {
  background: #d0e6f7;
  color: #42b883;
}
.small {
  font-size: 0.98rem;
  padding: 0.38rem 0.9rem;
  border-radius: 7px;
  border: none;
  margin-right: 0.5rem;
  cursor: pointer;
  transition: background 0.18s, color 0.18s;
}
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
#builderPreview.modern-preview {
  border: 1.5px solid #c3d0e6;
  border-radius: 10px;
  background: #f8fbff;
  box-shadow: 0 2px 8px rgba(60, 60, 60, 0.06);
  padding: 0.7rem;
  min-height: 48px;
  margin-top: 10px;
  font-size: 1.05rem;
  color: #2d3a4a;
  opacity: 1;
  transition: box-shadow 0.18s, background 0.18s, opacity 0.35s;
}
#builderPreview.modern-preview.highlight {
  background: #fffbe6;
  box-shadow: 0 0 0 3px #ffe082;
  opacity: 1;
  animation: fadeInHighlight 0.6s;
}
@keyframes fadeInHighlight {
  0% { background: #fffbe6; opacity: 0.5; }
  60% { background: #fffbe6; opacity: 1; }
  100% { background: #f8fbff; opacity: 1; }
}
.quill-toolbar-modern {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 1.2rem;
  align-items: center;
  border: 1px solid #c3d0e6;
  border-bottom: none;
  background: #fafdff;
  border-radius: 10px 10px 0 0;
  padding: 0.5rem 0.8rem 0.3rem 0.8rem;
  margin-bottom: 0;
}
.quill-toolbar-modern .ql-formats {
  display: flex;
  gap: 0.5rem;
}
.quill-toolbar-modern button {
  background: none;
  border: none;
  border-radius: 6px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  color: #3a78c3;
  cursor: pointer;
  transition: background 0.18s, color 0.18s, transform 0.12s;
}
.quill-toolbar-modern button:hover, .quill-toolbar-modern button:focus {
  background: #e6f7ff;
  color: #42b883;
  transform: scale(1.08);
  outline: none;
}
.modern-quill-editor {
  max-width: 100%;
  height: 160px;
  border: 1px solid #ccc;
  border-radius: 0 0 10px 10px;
  margin-bottom: 4px;
  background: #fff;
  box-shadow: 0 2px 8px rgba(60,60,60,0.06);
  padding: 0.2rem 0.7rem;
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
.palette-block .del-btn svg {
  width: 20px;
  height: 20px;
  display: block;
}
.legacy-item-builder{
  width: 100%;
  padding: 1rem 0.5rem 0.5rem 1rem;
}
</style>
