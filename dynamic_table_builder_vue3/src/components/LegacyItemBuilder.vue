<template>
  <fieldset id="itemBuilder" style="margin-bottom: 1rem">
    <legend>自訂檢查項目產生器</legend>
    <label>
      <div>Checkbox 標籤:</div>
      <input ref="builderChkLabel" type="text" placeholder="OK" style="width: 120px" />
      <button type="button" @click="addCustomCheckbox">➕ 加入 Checkbox</button>
    </label>
    <br /><br />
    <label>
      <div>文字輸入 placeholder:</div>
      <input ref="builderInputPH" type="text" placeholder="請輸入…" style="width: 160px" />
      <button type="button" @click="addCustomInput">➕ 加入輸入框</button>
    </label>
    <br /><br />
    <div id="quillToolbar" ref="quillToolbar" style="border: 1px solid #ccc; border-bottom: none; margin-bottom: 0">
      <span class="ql-formats">
        <button class="ql-bold"></button>
        <button class="ql-italic"></button>
        <button class="ql-underline"></button>
      </span>
      <span class="ql-formats">
        <button class="ql-list" value="ordered"></button>
        <button class="ql-list" value="bullet"></button>
      </span>
      <span class="ql-formats">
        <button class="ql-link"></button>
        <span class="ql-formats">
          <select class="ql-size">
            <option value="small"></option>
            <option selected></option>
            <option value="large"></option>
            <option value="huge"></option>
          </select>
          <select class="ql-color"></select>
          <select class="ql-background"></select>
        </span>
      </span>
    </div>
    <div id="quillEditor" ref="quillEditor" style="max-width:100%;height:160px;border:1px solid #ccc;margin-bottom:4px;"></div>
    <div id="builderPreview" ref="builderPreview" style="border:1px dashed #ccc;padding:0.5rem;min-height:40px;background:#fafafa;margin-top:8px;">(預覽區)</div>
    <br />
    <button type="button" @click="addCustomHtml">新增到調色盤</button>
    <button type="button" @click="clearBuilder">清空輸入</button>
    <!-- palette-wrapper 區塊移植於此 -->
    <div :id="'palette-wrapper'" :class="{collapsed: paletteCollapsed}" >
      <div id="palette-toggle" @click="togglePalette">{{ paletteCollapsed ? '❮' : '❯' }}</div>
      <div id="palette-controls" style="margin-bottom: 0.5rem">
        <button id="toggleAll" class="small" @click="toggleAllPalette">{{ allCollapsed ? '全部展開' : '全部收合' }}</button>
      </div>
      <div id="palette" v-show="!paletteCollapsed">
        <h4 class="collapsible" @click="toggleBlock('native')">原生項目 <span class="caret">{{ nativeCollapsed ? '▶' : '▼' }}</span></h4>
        <div id="palette-native" class="palette-block native" :class="{collapsed: nativeCollapsed}">
          <div id="chkReusable" class="draggable-item reusable" draggable="true" @dragstart="e => onPaletteDragStart(nativeItems[0], e)">
            <PaletteCheckbox :label="nativeItems[0].props.label" />
          </div>
          <div id="txtReusable" class="draggable-item reusable" draggable="true" @dragstart="e => onPaletteDragStart(nativeItems[1], e)">
            <PaletteTextarea :placeholder="nativeItems[1].props.placeholder" />
          </div>
          <div id="sigReusable" class="draggable-item reusable" draggable="true" @dragstart="e => onPaletteDragStart(nativeItems[2], e)">
            <PaletteSignature :modalOnClick="false" />
          </div>
        </div>
        <h4 class="collapsible" @click="toggleBlock('custom')">自訂項目 <span class="caret">{{ customCollapsed ? '▶' : '▼' }}</span></h4>
        <div id="palette-custom" class="palette-block custom" :class="{collapsed: customCollapsed}">
          <div v-for="item in customItems" :key="item.id" :id="item.id" class="draggable-item reusable" draggable="true" @dragstart="e => onPaletteDragStart(item, e)">
            <div v-html="item.html"></div>
            <div class="del-btn" @click.stop="removeCustomItem(item.id)">✖</div>
          </div>
        </div>
      </div>
    </div>
  </fieldset>
</template>
<script setup lang="ts">
import { ref, onMounted, watch, defineProps, defineEmits } from 'vue'
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
#palette-wrapper {
  position: fixed;
  right: 0;
  top: 0;
  height: 100vh;
  width: 320px;
  background: #fafafa;
  border-left: 1px solid #ccc;
  box-shadow: -2px 0 5px rgba(0, 0, 0, 0.05);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  padding: 12px 8px 12px 12px;
  z-index: 998;
  transition: transform 0.25s ease;
}
#palette-wrapper.collapsed {
  transform: translateX(100%);
}
#palette {
  flex: 1 1 auto;
  overflow-y: auto;
  padding-right: 4px;
}
#palette-toggle {
  position: absolute;
  left: -30px;
  top: 50%;
  transform: translateY(-50%);
  width: 28px;
  height: 64px;
  border: 1px solid #ccc;
  border-radius: 6px 0 0 6px;
  background: #fafafa;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: -2px 0 5px rgba(0, 0, 0, 0.05);
  user-select: none;
  font-size: 14px;
}
h4.collapsible {
  display: flex;
  align-items: center;
  cursor: pointer;
  margin: 0 0 0.25rem;
  font-weight: bold;
  user-select: none;
}
h4.collapsible .caret {
  margin-left: 6px;
  font-size: 0.9rem;
}
.palette-block {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  padding: 0.5rem;
  border: 1px dashed #999;
  margin-bottom: 0.75rem;
}
.palette-block.collapsed {
  display: none;
}
.palette-block.native {
  background: #fffbe6;
  border-color: #f0c36d;
}
.palette-block.custom {
  background: #e8fbe9;
  border-color: #4caf50;
}
fieldset {
  border-radius: 10px;
  border: 1px solid #bbb;
  padding: 1.2rem 1.2rem 1rem 1.2rem;
  background: #fff;
}
</style>
