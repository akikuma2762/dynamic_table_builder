<template>
  <div :class="['multi-table-preview-root', { 'palette-collapsed': paletteCollapsed }]">
    <h3>拖放檢查表（v7 LocalStorage 整合）</h3>
    <div id="controls">
      <button @click="preview">匯出 / 預覽</button>
      <button @click="reload">重新讀取儲存資料</button>
      <button @click="clearLS">⚠️ 清除所有儲存</button>
      <select v-model="selectedName" id="loadSelect" @change="loadFromLocal">
        <option value="">-- 選擇檔案 --</option>
        <option v-for="n in nameList" :key="n" :value="n">{{ n }}</option>
      </select>
      <button @click="loadFromLocal">📂 讀取</button>
    </div>
    <!-- -------- 自訂 Item 產生器 -------- -->
    <LegacyItemBuilder :collapsed="paletteCollapsed" @update:collapsed="paletteCollapsed = $event" />
    <div class="main-content">
      <h4>編輯區：</h4>
      <div id="tableWrap">
        <div v-if="tableConfigs.length === 0">（請先選擇檔案）</div>
        <div v-else>
          <div v-for="(cfg, idx) in tableConfigs" :key="idx" class="table-block">
            <div style="font-weight:bold;">表格 {{ idx + 1 }}</div>
            <table :class="'tbl-' + idx" class="preview">
              <colgroup>
                <col v-for="(col, cIdx) in ((cfg.headerRows[0] || []))" :key="cIdx" :style="col.width ? 'width:' + col.width + '%' : ''" />
              </colgroup>
              <thead>
                <tr v-for="(row, rIdx) in cfg.headerRows" :key="rIdx">
                  <th v-for="(cell, cIdx) in row" :key="cIdx"
                    :colspan="cell.colspan > 1 ? cell.colspan : undefined"
                    :rowspan="cell.rowspan > 1 ? cell.rowspan : undefined"
                    :style="`background:${cell.bg||'#e0eaff'};text-align:${cell.align};color:${cell.color};font-size:${cell.size}px;`"
                  >
                    {{ cell.text || '\u00A0' }}<template v-if="cell.en"><br><small>{{ cell.en }}</small></template>
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="(row, rIdx) in cfg.dataRowsCfg"
                  :key="rIdx"
                  :style="{
                    background: row.color || cfg.dataBg || '#fff',
                    color: getContrastColor(row.color || cfg.dataBg || '#fff')
                  }"
                >
                  <template v-for="(cell, cIdx) in row.cells">
                    <td
                      v-if="!isCellCovered(rIdx, cIdx, cfg)"
                      :key="cIdx"
                      :data-row="rIdx"
                      :data-col="cIdx"
                      v-bind="(cell.colspan === 1 && cell.rowspan === 1 && getLeaf(cfg)[cIdx]?.en) ? { 'data-column': getLeaf(cfg)[cIdx].en } : {}"
                      :colspan="cell.colspan > 1 ? cell.colspan : undefined"
                      :rowspan="cell.rowspan > 1 ? cell.rowspan : undefined"
                      :style="`text-align:${cell.align};${cell.color ? `color:${cell.color};` : ''}${cell.size ? `font-size:${cell.size}px;` : ''}min-width:120px;min-height:44px;`"
                      @dragenter="cellDragEnter"
                      @dragleave="cellDragLeave"
                      @dragover.prevent="cellDragOver"
                      @drop="cellDrop"
                    >
                      <div v-if="cell.value && cell.value.type === 'signature'" class="draggable-item reusable">
                        <PaletteSignature
                          v-bind="{ ...cell.value.props, imageData: cell.value.props?.imageData }"
                          :modalOnClick="true"
                          @update:imageData="img => updateSignature(cfg, rIdx, cIdx, img)"
                        />
                        <div class="del-btn" @click="() => { cell.value = undefined; cell.text = '' }">✖</div>
                      </div>
                      <span v-else-if="cell.text && cell.text.trim() !== ''" v-html="cell.text"></span>
                    </td>
                  </template>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <h4>預覽區：</h4>
      <div id="outputArea" v-html="previewHtml"></div>
      <div>
        <input v-model="savePreviewName" placeholder="輸入檔名以儲存預覽表格" />
        <button @click="savePreviewTable">儲存預覽表格</button>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import LegacyItemBuilder from './LegacyItemBuilder.vue'
import PaletteSignature from './PaletteSignature.vue'
import type { TableConfig } from '../types/table'

// API 型別
import { previewTableMultiApi, paletteCustomApi } from '../utils/api'
import type { PreviewTableMultiResponse } from '../types/previewTableMultiResponse'


const nameList = ref<string[]>([])
const selectedName = ref('')
const tableConfigs = ref<TableConfig[]>([])
const previewHtml = ref('')
const savePreviewName = ref('')

// ====== Palette 狀態 ======
const paletteCollapsed = ref(false)



// Palette 相關
const nativeItems = ref([
  { id: 'chkReusable', component: 'PaletteCheckbox', props: { label: 'OK' } },
  { id: 'txtReusable', component: 'PaletteTextarea', props: { placeholder: '請輸入...' } },
  { id: 'sigReusable', component: 'PaletteSignature', props: {} }
])
const customItems = ref<any[]>([])


function onTableDrop(e: DragEvent) {
  e.preventDefault()
  const paletteId = e.dataTransfer?.getData('text/plain')
  if (!paletteId) return
  let item = nativeItems.value.find(i => i.id === paletteId) || customItems.value.find(i => i.id === paletteId)
  // 新增：若找不到，從 dataTransfer 取完整 palette 資料
  if (!item) {
    const json = e.dataTransfer?.getData('application/json')
    if (json) item = JSON.parse(json)
  }
  if (!item) return
  if (!item) return
  const target = e.target as HTMLElement
  const td = target.closest('td')
  if (!td) return
  const tableBlock = td.closest('.table-block') as HTMLElement | null
  if (!tableBlock) return
  const tableIdxStr = tableBlock.querySelector('table')?.className.match(/tbl-(\d+)/)?.[1]
  if (tableIdxStr === undefined) return
  const tableIndex = parseInt(tableIdxStr)
  const cfg = tableConfigs.value[tableIndex]
  if (!cfg) return
  // 直接用 data-row, data-col
  const rowIdx = Number(td.getAttribute('data-row'))
  const colIdx = Number(td.getAttribute('data-col'))
  if (isNaN(rowIdx) || isNaN(colIdx)) return
  if (!cfg.dataRowsCfg?.[rowIdx] || !cfg.dataRowsCfg[rowIdx].cells?.[colIdx]) return
  const cell = cfg.dataRowsCfg[rowIdx].cells[colIdx]
  // 覆蓋確認
  if (cell.text && cell.text !== '&nbsp;' && !confirm('覆蓋此格？')) return
  // 產生 palette HTML + 刪除鈕
  let html = ''
  if (item.component === 'PaletteCheckbox') {
    cell.value = { type: 'checkbox', props: { checked: false, label: item.props.label || '勾選' } }
    html = `<div class='draggable-item reusable'><label><input type='checkbox' /> ${item.props.label}</label><div class='del-btn' onclick='this.parentNode.parentNode.innerHTML="&nbsp;"'>✖</div></div>`
  } else if (item.component === 'PaletteTextarea') {
    cell.value = { type: 'textarea', props: { text: '', placeholder: item.props.placeholder || '' } }
    html = `<div class='draggable-item reusable'><textarea placeholder='${item.props.placeholder}'></textarea><div class='del-btn' onclick='this.parentNode.parentNode.innerHTML="&nbsp;"'>✖</div></div>`
  }else if (item.component === 'PaletteInputText') {
  cell.value = { type: 'inputText', props: { value: '', placeholder: item.props.placeholder || '' } }
  html = `<div class='draggable-item reusable'><input type='text' placeholder='${item.props.placeholder}' /><div class='del-btn' onclick='this.parentNode.parentNode.innerHTML="&nbsp;"'>✖</div></div>`
  }else if (item.component === 'PaletteSignature') {
    cell.value = { type: 'signature', props: {} }
    cell.text = ''
  } else if (item.html) {
    // 複合 palette：遞迴解析 HTML 產生片段 fields（純文字、checkbox、inputText）
    const temp = document.createElement('div')
    temp.innerHTML = item.html
    let keyIdx = 1
    
    function parseNode(node: ChildNode, skipTextSet = new Set<ChildNode>()): any {
      if (node.nodeType === Node.TEXT_NODE) {
        if (skipTextSet.has(node)) return null;
        const text = node.textContent ?? ''
        if (text.trim() !== '') {
          return { type: 'text', key: 'txt' + keyIdx++, props: { text } }
        }
        return null
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement
        if (el.tagName === 'P') {
          // 處理 <p> 內所有子節點
          const children = Array.from(el.childNodes).map(child => parseNode(child, skipTextSet)).filter(Boolean)
          return { type: 'p', key: 'p' + keyIdx++, children }
        } else if (el.tagName === 'BR') {
          return { type: 'br', key: 'br' + keyIdx++, props: {} }
        } else if (el.tagName === 'INPUT') {
          const inputType = (el as HTMLInputElement).type
          if (inputType === 'checkbox') {
            let labelText = el.getAttribute('value') || ''
            if (el.nextSibling && el.nextSibling.nodeType === Node.TEXT_NODE) {
              const nextText = el.nextSibling.textContent?.trim() || ''
              if (nextText) labelText = nextText
              skipTextSet.add(el.nextSibling)
            }
            return {
              type: 'checkbox',
              key: 'chk' + keyIdx++,
              props: {
                checked: false,
                label: labelText || '勾選'
              }
            }
          } else if (inputType === 'text') {
            return {
              type: 'inputText',
              key: 'txt' + keyIdx++,
              props: {
                value: '',
                placeholder: (el as HTMLInputElement).placeholder || ''
              }
            }
          }
        } else if (el.tagName === 'TEXTAREA') {
          return {
            type: 'textarea',
            key: 'ta' + keyIdx++,
            props: {
              text: '',
              placeholder: el.getAttribute('placeholder') || ''
            }
          }
        } else {
          // 其他標籤，遞迴處理所有子節點
          const children = Array.from(el.childNodes).map(child => parseNode(child, skipTextSet)).filter(Boolean)
          if (children.length === 1) return children[0]
          if (children.length > 1) return { type: 'fragment', key: 'frag' + keyIdx++, children }
          return null
        }
      }
      return null
    }
    const parsedFields = Array.from(temp.childNodes).map(node => parseNode(node)).filter(Boolean)
    cell.value = { type: 'custom', fields: parsedFields }
    // 方案一：自訂 palette 也包一層 draggable-item reusable 與 del-btn
    html = `<div class='draggable-item reusable'>${item.html}<div class='del-btn' onclick='this.parentNode.parentNode.innerHTML="&nbsp;"'>✖</div></div>`
  }
  cell.text = html || '&nbsp;'
}


async function loadCustomPalette() {
  try {
    const res = await paletteCustomApi.getAll()
    console.log('取得自訂 Palette：', res.data)
    customItems.value = res.data.data || []
  } catch (err: any) {
    customItems.value = []
    alert('讀取自訂 Palette 失敗：' + (err?.message || err))
  }
}

onMounted(() => {
  refreshNameOptions()
  loadCustomPalette()
});
onBeforeUnmount(() => {
});


async function refreshNameOptions(selId = '') {
  try {
    const res = await previewTableMultiApi.getAll()
    console.log('取得預覽表格清單：', res.data)
    
    nameList.value = res.data.data?.map((item: PreviewTableMultiResponse) => item.name) || []
    if (selId) selectedName.value = selId
  } catch (err: any) {
    alert('取得預覽表格清單失敗：' + (err?.message || err))
    nameList.value = []
  }
}

async function loadFromLocal() {
  const name = selectedName.value
  if (!name) { tableConfigs.value = []; return }
  try {
    const res = await previewTableMultiApi.get(name)
    console.log('取得預覽表格：', res.data)
    if (!res.data) { tableConfigs.value = []; return }
    // 判別 obj 型別：
    let obj: any = res.data.data.configs
    if (typeof obj === 'string') {
      try {
        obj = JSON.parse(obj)
      } catch {
        obj = { configs: [] }
      }
    }
    // obj 可能為 { configs: [...] } 或直接為陣列
    let configsArr: any[] = []
    if (Array.isArray(obj)) {
      configsArr = obj
    } else if (Array.isArray(obj.configs)) {
      configsArr = obj.configs
    }
    // 相容處理：若有 headerBg，補到 cell.bg
    configsArr.forEach((cfg: any) => {
      if (cfg && cfg.headerBg) {
        cfg.headerRows?.forEach((row: any[]) => {
          row.forEach((cell: any) => {
            if (!cell.bg) cell.bg = cfg.headerBg
          })
        })
        delete cfg.headerBg
      }
    })
    tableConfigs.value = configsArr
  } catch (err: any) {
    alert('讀取預覽表格失敗：' + (err?.message || err))
    tableConfigs.value = []
  }
}

function reload() {
  refreshNameOptions(selectedName.value)
  loadFromLocal()
}

// 清除所有儲存（API 版本不支援，僅供本地測試用）
function clearLS() {
  alert('API 版本不支援清除所有儲存，請至後台管理或資料庫操作。')
}
function preview() {
  // 產生預覽 HTML
  let html = tableConfigs.value.map((cfg, idx) => {
    return buildPreviewTable(cfg, idx)
  }).join('<br>')
  // 移除 draggable-item reusable 父元素與 del-btn
  const temp = document.createElement('div')
  temp.innerHTML = html
  // 將 PaletteSignature canvas 轉為 <img> 匯出
  temp.querySelectorAll('.draggable-item.reusable').forEach(el => {
    const sigCanvas = el.querySelector('canvas')
    if (sigCanvas && sigCanvas.toDataURL) {
      const img = document.createElement('img')
      img.src = sigCanvas.toDataURL('image/png')
      img.style.maxWidth = '100%'
      el.innerHTML = ''
      el.appendChild(img)
    }
  })
  // 移除所有 del-btn
  temp.querySelectorAll('.del-btn').forEach(el => el.remove())
  // 展開所有 draggable-item.reusable，保留其內容
  temp.querySelectorAll('.draggable-item.reusable').forEach(el => {
    const parent = el.parentNode
    if (parent) {
      while (el.firstChild) parent.insertBefore(el.firstChild, el)
      parent.removeChild(el)
    }
  })
  // 移除所有 td 的拖曳事件屬性
  temp.querySelectorAll('td').forEach(td => {
    td.removeAttribute('ondragenter')
    td.removeAttribute('ondragleave')
    td.removeAttribute('ondragover')
  })
  previewHtml.value = temp.innerHTML
}
function buildPreviewTable(cfg: TableConfig, idx: number) {
  const dBg = cfg.dataBg || '#fff'
  // 修正：colgroup 直接用 headerRows[0]，與編輯區一致
  const colgroup = `<colgroup>${(cfg.headerRows[0] || []).map((col: any) => `<col style="${col.width ? `width:${col.width}%` : ''}">`).join('')}</colgroup>`
  const thead = cfg.headerRows.map((r: any[]) => `<tr>${r.map((cell: any) => `<th${cell.colspan>1?` colspan=\"${cell.colspan}\"`:''}${cell.rowspan>1?` rowspan=\"${cell.rowspan}\"`:''}${cell.en?` data-column=\"${cell.en}\"`:''} style=\"background:${cell.bg||'#e0eaff'};text-align:${cell.align};color:${cell.color};font-size:${cell.size}px;\">${cell.text||'&nbsp;'}${cell.en?`<br><small>${cell.en}</small>`:''}</th>`).join('')}</tr>`).join('')
  const tbody = buildTbody(cfg, dBg)
  return `<table class=\"preview tbl-${idx}\">${colgroup}<thead>${thead}</thead><tbody>${tbody}</tbody></table>`
}
function buildTbody(cfg: TableConfig, defaultBg: string) {
  const leaf = getLeaf(cfg)
  const indexColumns = leaf.map((l: any, i: number) => l.indexed ? i : null).filter((i: any) => i !== null)
  let indexCounter = 1
  const cols = leaf.length, rows = cfg.dataRowsCfg.length
  const occ = Array.from({ length: rows }, () => Array(cols).fill(false))
  let out = ''
  for (let r = 0; r < rows; r++) {
    let rowIndexed = false
    const bg = cfg.dataRowsCfg[r].color || defaultBg
    const txt = getContrastColor(bg)
    out += `<tr style="background:${bg};color:${txt};">`
    for (let c = 0; c < cols; c++) {
      if (occ[r][c]) continue
      const cell = cfg.dataRowsCfg[r].cells[c]
      let cs = +cell.colspan || 1, rs = +cell.rowspan || 1
      if (c + cs > cols) cs = cols - c
      if (r + rs > rows) rs = rows - r
      for (let rr = 0; rr < rs; rr++) {
        for (let cc = 0; cc < cs; cc++) {
          occ[r + rr][c + cc] = true
        }
      }
      const data = cs === 1 && rs === 1 && leaf[c].en ? ` data-column="${leaf[c].en}"` : ''
      let raw = cell.text ?? ''
      let html = raw.replace(/\n/g, '<br>')
      // 若為簽名欄
      if (cell.value && cell.value.type === 'signature') {
        if (cell.value.props?.imageData) {
          html = `<img src="${cell.value.props.imageData}" style="max-width:100%;max-height:60px;" />`
        } else {
          // 未簽名時，產生 PaletteSignature.vue 的靜態區塊
          html = `<div class=\"signature\"><div class=\"sigCanvas\" style=\"width:100%;height:60px;border:1px solid #666;background:#fff;display:flex;align-items:center;justify-content:center;color:#888;\">請簽名</div><div class=\"clearSig\" style=\"font-size:0.75rem;color:#aaa;\">（請於此處簽名）</div></div>`
        }
      }
      if (!html) html = '&nbsp;'
      if (indexColumns.includes(c) && cs === 1 && rs === 1) {
        html = String(indexCounter)
        rowIndexed = true
      }
      const align = cell.align || 'left'
      const color = cell.color || ''
      const size = cell.size || 16
      out += `<td data-row="${r}" data-col="${c}"${data}${cs > 1 ? ` colspan=\"${cs}\"` : ''}${rs > 1 ? ` rowspan=\"${rs}\"` : ''} style="text-align:${align};${color?`color:${color};`:''}${size?`font-size:${size}px;`:''}">${html}</td>`
    }
    if (rowIndexed) indexCounter++
    out += `</tr>`
  }
  return out
}
function getLeaf(cfg: TableConfig) {
  const g: any[] = []
  const R = cfg.headerRows.length
  for (let r = 0; r < R; r++) {
    g[r] ??= []
    let c = 0
    cfg.headerRows[r].forEach((cell: any) => {
      if (cell.colspan > 1 || cell.rowspan > 1) {
        for (let i = 0; i < (cell.colspan || 1); i++) {
          for (let j = 0; j < (cell.rowspan || 1); j++) {
            g[r + j] ??= []
            g[r + j][c + i] = g[r + j][c + i] || { en: '', indexed: false }
          }
        }
      } else {
        g[r][c] = g[r][c] || { en: '', indexed: false }
      }
      if (cell.en) g[r][c].en = cell.en
      c++
    })
  }
  return R ? g[R - 1] : []
}
function getContrastColor(hex: string) {
  if (!hex || hex.length !== 7) return '#000'
  const r = parseInt(hex.substr(1, 2), 16)
  const g = parseInt(hex.substr(3, 2), 16)
  const b = parseInt(hex.substr(5, 2), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 >= 128 ? '#000' : '#fff'
}
// ===== cell 拖曳亮光提示全域事件 =====
// 直接在 <td> 綁定元件內部函式，避免 window 污染
function cellDragEnter(e: DragEvent) {
  const td = e.currentTarget instanceof HTMLElement
    ? e.currentTarget
    : (e.target instanceof HTMLElement ? e.target.closest('td') : null);
  if (td) td.classList.add('drop-hover');
}
function cellDragLeave(e: DragEvent) {
  const td = e.currentTarget instanceof HTMLElement
    ? e.currentTarget
    : (e.target instanceof HTMLElement ? e.target.closest('td') : null);
  if (td) setTimeout(() => td.classList.remove('drop-hover'), 50);
}
function cellDragOver(e: DragEvent) {
  const td = e.currentTarget instanceof HTMLElement
    ? e.currentTarget
    : (e.target instanceof HTMLElement ? e.target.closest('td') : null);
  if (td) td.classList.add('drop-hover');
  e.preventDefault();
}
function cellDrop(e: DragEvent) {
  const td = e.currentTarget instanceof HTMLElement
    ? e.currentTarget
    : (e.target instanceof HTMLElement ? e.target.closest('td') : null);
  if (td) td.classList.remove('drop-hover');
  onTableDrop(e);
}

// 新增：過濾 palette HTML 標籤
function stripPaletteHtml(html: string): string {
  if (!html) return ''
  return html
    .replace(/<div class=['"]draggable-item reusable['"][^>]*>/g, '')
    .replace(/<div class=["']draggable-item reusable["'][^>]*>/g, '')
    .replace(/<div class=['"]del-btn['"][^>]*>.*?<\/div>/g, '')
    .replace(/<div class=["']del-btn["'][^>]*>.*?<\/div>/g, '')
    .replace(/<div[^>]*>/g, '')
    .replace(/<\/div>/g, '')
}

// (下方重複 import 移除)
async function savePreviewTable() {
  const name = savePreviewName.value.trim()
  if (!name) { alert('請輸入檔名！'); return }
  // 深拷貝 tableConfigs，並移除 cell.text 內的 draggable-item reusable/del-btn HTML
  const cleanConfigs = JSON.parse(JSON.stringify(tableConfigs.value))
  for (const cfg of cleanConfigs) {
    for (const row of cfg.dataRowsCfg) {
      for (const cell of row.cells) {
        if (typeof cell.text === 'string') {
          cell.text = stripPaletteHtml(cell.text)
        }
      }
    }
  }
  const payload = {
    Name: name,
    Configs: JSON.stringify({ configs: cleanConfigs })
  }
  console.log('儲存預覽表格：', payload)
  try {
    // 先查詢是否已存在
    let exists = false
    try {
      const res = await previewTableMultiApi.get(name)
      exists = !!res.data
    } catch {}
    if (exists && !confirm('已存在同名預覽檔案，是否覆蓋？')) return
    if (exists) {
      await previewTableMultiApi.update(name, payload)
    } else {
      await previewTableMultiApi.create(payload)
    }
    await refreshNameOptions()
    alert('已儲存預覽表格為「' + name + '」')
  } catch (err: any) {
    alert('儲存預覽表格失敗：' + (err?.message || err))
  }
}

function isCellCovered(r: number, c: number, cfg: TableConfig) {
  // 動態計算 occ 陣列，僅用於渲染該 row 的判斷
  const rows = cfg.dataRowsCfg.length
  const cols = cfg.dataRowsCfg[0].cells.length
  let occ = Array.from({ length: rows }, () => Array(cols).fill(false))
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (occ[i][j]) continue
      const cell = cfg.dataRowsCfg[i].cells[j]
      let cs = +cell.colspan || 1, rs = +cell.rowspan || 1
      for (let rr = 0; rr < rs; rr++) {
        for (let cc = 0; cc < cs; cc++) {
          if (rr !== 0 || cc !== 0) occ[i + rr][j + cc] = true
        }
      }
    }
  }
  return occ[r][c]
}

// updateSignature 方法補強 imageData 雙向綁定
function updateSignature(cfg: TableConfig, rIdx: number, cIdx: number, img: string) {
  if (cfg && cfg.dataRowsCfg && cfg.dataRowsCfg[rIdx] && cfg.dataRowsCfg[rIdx].cells[cIdx]) {
    const cell = cfg.dataRowsCfg[rIdx].cells[cIdx]
    if (cell.value && cell.value.type === 'signature') {
      cell.value = {
        ...cell.value,
        props: { ...(cell.value.props || {}), imageData: img }
      }
    }
  }
}
</script>
<style scoped>
.multi-table-preview-root{
      display: flex;
    flex-wrap: wrap;
    flex-direction: column;
}
.multi-table-preview-root.palette-collapsed {
  margin-right: 24px;
}

#controls button {
  margin-right: 0.5rem;
  padding: 4px 10px;
}
/* .draggable-item 及 .reusable 樣式已移至全域 CSS */

#tableWrap,
#outputArea {
  margin-top: 2rem;
  border: 2px dashed #aaa;
  padding: 1rem;
  border-radius: 10px;
}
.saved-block {
  border: 1px solid #777;
  padding: 0.5rem;
  margin-top: 0.8rem;
}
.saved-title {
  font-weight: bold;
  margin-bottom: 0.4rem;
}
.buttons-inline > button {
  margin-right: 0.5rem;
}

.draggable-item textarea {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  resize: vertical;
  overflow-wrap: break-word;
}

.signature {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  align-items: center;
}
.sigCanvas {
  border: 1px solid #666;
  background: #fff;
  width: 100%;
  height: 60px;
  touch-action: none;
}
.clearSig {
  font-size: 0.75rem;
}

.table-block {
  min-height: 60px;
  border: 1px dashed #bbb;
  margin-bottom: 1.5rem;
  background: #fff;
  transition: box-shadow 0.2s;
  max-width: 100%;
  overflow-x: auto;
  box-sizing: border-box;
  border-radius: 10px;
  padding: 0.5rem;
}
table.preview {
  width: 100%;
  table-layout: fixed;
  word-break: break-all;
}
.table-block.dragover {
  box-shadow: 0 0 0 2px #4caf50;
  border-color: #4caf50;
}
td.drop-hover {
  background: #f32400;
}
</style>
