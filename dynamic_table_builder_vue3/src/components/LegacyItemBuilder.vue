<template>
  <div class="warpper">
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
  
  <PaletteWrapper />
</template>

<script setup lang="ts">
import PaletteWrapper from './PaletteWrapper.vue'

import {ref,onMounted, nextTick } from 'vue'
import Quill from 'quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css'
import { paletteCustomApi } from '../utils/api'
import type { PaletteCustomItem } from '../types/paletteCustomResponse'



const builderChkLabel = ref<HTMLInputElement | null>(null)
const builderInputPH = ref<HTMLInputElement | null>(null)
const quillToolbar = ref<HTMLDivElement | null>(null)
const quillEditor = ref<HTMLDivElement | null>(null)
const builderPreview = ref<HTMLDivElement | null>(null)
let quill: any = null




const customItems = ref<PaletteCustomItem[]>([])
const previewHighlight = ref(false)

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
  
  const id = 'custom_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
  const newItem: PaletteCustomItem = {
    id,
    html
  }
  
  saveCustomItem(newItem)
  clearBuilder()
}
function clearBuilder() {
  if (!quill) return
  if (builderChkLabel.value) builderChkLabel.value.value = ''
  if (builderInputPH.value) builderInputPH.value.value = ''
  quill.setContents([])
  syncQuillToPreview()
}


async function saveCustomItem(item: PaletteCustomItem) {
  try {
    const res = await paletteCustomApi.create({
      id: item.id,
      html: item.html
    })
    if (res.data.success) {
      customItems.value.push(res.data.data)
    }
  } catch (err: any) {
    alert('儲存失敗：' + (err?.message || err))
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


