<template>
  <div>
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
    <LegacyItemBuilder />
    <h4>編輯區：</h4>
    <div id="tableWrap">
      <div v-if="tableConfigs.length === 0">（請先選擇檔案）</div>
      <div v-else>
        <div v-for="(cfg, idx) in tableConfigs" :key="idx" class="table-block">
          <div style="font-weight:bold;">表格 {{ idx + 1 }}</div>
          <table :class="'tbl-' + idx" class="preview">
            <colgroup>
              <col v-for="(col, cIdx) in ((cfg.headerRows[0] || []))" :key="cIdx" :style="col.width ? 'width:' + col.width + 'px' : ''" />
            </colgroup>
            <thead>
              <tr v-for="(row, rIdx) in cfg.headerRows" :key="rIdx">
                <th v-for="(cell, cIdx) in row" :key="cIdx"
                  :colspan="cell.colspan > 1 ? cell.colspan : undefined"
                  :rowspan="cell.rowspan > 1 ? cell.rowspan : undefined"
                  :style="`text-align:${cell.align};color:${cell.color};font-size:${cell.size}px;`"
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
    <div id="outputArea">
      <div v-for="(cfg, idx) in tableConfigs" :key="idx" class="table-block">
        <div style="font-weight:bold;">表格 {{ idx + 1 }}</div>
        <table :class="'tbl-' + idx" class="preview">
          <colgroup>
            <col v-for="(col, cIdx) in ((cfg.headerRows[0] || []))" :key="cIdx" :style="col.width ? 'width:' + col.width + 'px' : ''" />
          </colgroup>
          <thead>
            <tr v-for="(row, rIdx) in cfg.headerRows" :key="rIdx">
              <th v-for="(cell, cIdx) in row" :key="cIdx"
                :colspan="cell.colspan > 1 ? cell.colspan : undefined"
                :rowspan="cell.rowspan > 1 ? cell.rowspan : undefined"
                :style="`text-align:${cell.align};color:${cell.color};font-size:${cell.size}px;`"
              >
                {{ cell.text || '\u00A0' }}<template v-if="cell.en"><br><small>{{ cell.en }}</small></template>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, rIdx) in cfg.dataRowsCfg" :key="rIdx"
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
                >
                  <template v-if="cell.value && cell.value.type === 'signature'">
                    <PaletteSignature
                      v-bind="{ ...cell.value.props, imageData: cell.value.props?.imageData }"
                      :modalOnClick="true"
                      @update:imageData="img => updateSignature(cfg, rIdx, cIdx, img)"
                    />
                  </template>
                  <template v-else-if="cell.text && cell.text.trim() !== ''">
                    <span v-html="stripPaletteHtml(cell.text)"></span>
                  </template>
                  <template v-else>
                    &nbsp;
                  </template>
                </td>
              </template>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
    <div>
      <input v-model="savePreviewName" placeholder="輸入檔名以儲存預覽表格" />
      <button @click="savePreviewTable">儲存預覽表格</button>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'
import LegacyItemBuilder from './LegacyItemBuilder.vue'
import PaletteSignature from './PaletteSignature.vue'
import type { TableConfig } from '../types/table'

const nameList = ref<string[]>([])
const selectedName = ref('')
const tableConfigs = ref<TableConfig[]>([])
const previewHtml = ref('')
const savePreviewName = ref('')

// ====== Palette 狀態 ======
const paletteCollapsed = ref(false)
const nativeCollapsed = ref(false)
const customCollapsed = ref(false)
const allCollapsed = ref(false)
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

// Palette 相關
const nativeItems = ref([
  { id: 'chkReusable', component: 'PaletteCheckbox', props: { label: 'OK' } },
  { id: 'txtReusable', component: 'PaletteTextarea', props: { placeholder: '請輸入...' } },
  { id: 'sigReusable', component: 'PaletteSignature', props: {} }
])
const customItems = ref<any[]>([])

// 拖曳
function onPaletteDragStart(item: any, e?: DragEvent) {
  if (e) {
    e.dataTransfer?.setData('text/plain', item.id)
    e.dataTransfer!.effectAllowed = 'copy'
  }
}
function onTableDrop(e: DragEvent, tableIdx: number) {
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
    const fields: import('../types/table').PaletteField[] = []
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
    html = item.html // 保留 palette 原始 HTML
  }
  cell.text = html || '&nbsp;'
}

function loadCustomPalette() {
  const raw = localStorage.getItem('paletteCustom')
  if (!raw) return
  try {
    customItems.value = JSON.parse(raw)
  } catch { customItems.value = [] }
}

onMounted(() => {
  refreshNameOptions()
  loadCustomPalette()
});
onBeforeUnmount(() => {
});

function getNameList() {
  try {
    return JSON.parse(localStorage.getItem('dynamicTableMulti__names') || '[]')
  } catch {
    return []
  }
}
function refreshNameOptions(selId = '') {
  nameList.value = getNameList()
  if (selId) selectedName.value = selId
}
function loadFromLocal() {
  const name = selectedName.value
  if (!name) { tableConfigs.value = []; return }
  const raw = localStorage.getItem('dynamicTableMulti__' + name)
  if (!raw) { tableConfigs.value = []; return }
  try {
    const obj = JSON.parse(raw)
    tableConfigs.value = obj.configs as TableConfig[] || []
  } catch {
    tableConfigs.value = []
  }
}
function reload() {
  refreshNameOptions(selectedName.value)
  loadFromLocal()
}
function clearLS() {
  if (confirm('確定清除所有儲存？')) {
    Object.keys(localStorage).forEach(k => {
      if (k.startsWith('dynamicTableMulti__')) localStorage.removeItem(k)
    })
    localStorage.removeItem('dynamicTableMulti__names')
    location.reload()
  }
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
  const hBg = cfg.headerBg || '#e0eaff'
  const dBg = cfg.dataBg || '#fff'
  const hColor = getContrastColor(hBg)
  const leaf = getLeaf(cfg)
  const colgroup = `<colgroup>${leaf.map((l: any) => `<col style="${l.width ? `width:${l.width}%;` : ''}"></col>`).join('')}</colgroup>`
  const thead = cfg.headerRows.map((r: any[]) => `<tr>${r.map((cell: { colspan: number; rowspan: number; en: any; align: any; color: any; size: number; text: any }) => `<th${cell.colspan>1?` colspan=\"${cell.colspan}\"`:''}${cell.rowspan>1?` rowspan=\"${cell.rowspan}\"`:''}${cell.en?` data-column=\"${cell.en}\"`:''} style=\"text-align:${cell.align};color:${cell.color};font-size:${cell.size}px;\">${cell.text||'&nbsp;'}${cell.en?`<br><small>${cell.en}</small>`:''}</th>`).join('')}</tr>`).join('')
  const tbody = buildTbody(cfg, dBg)
  return `<style>.tbl-${idx} th{background:${hBg};color:${hColor};}</style><table class="preview tbl-${idx}">${colgroup}<thead>${thead}</thead><tbody>${tbody}</tbody></table>`
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
      // 若為簽名欄，直接產生 <img>
      if (cell.value && cell.value.type === 'signature' && cell.value.props?.imageData) {
        html = `<img src="${cell.value.props.imageData}" style="max-width:100%;max-height:60px;" />`
      }
      if (!html) html = '&nbsp;'
      if (indexColumns.includes(c) && cs === 1 && rs === 1) {
        html = String(indexCounter)
        rowIndexed = true
      }
      const align = cell.align || 'left'
      const color = cell.color || ''
      const size = cell.size || 16
      out += `<td data-row="${r}" data-col="${c}"${data}${cs > 1 ? ` colspan="${cs}"` : ''}${rs > 1 ? ` rowspan="${rs}"` : ''} style="text-align:${align};${color?`color:${color};`:''}${size?`font-size:${size}px;`:''}">${html}</td>`
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
  onTableDrop(e, Number(td?.closest('.table-block')?.querySelector('table')?.className.match(/tbl-(\d+)/)?.[1]));
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

function savePreviewTable() {
  const name = savePreviewName.value.trim()
  if (!name) { alert('請輸入檔名！'); return }
  const key = 'previewTableMulti__' + name
  if (localStorage.getItem(key) && !confirm('已存在同名預覽檔案，是否覆蓋？')) return
  // 深拷貝 tableConfigs，並移除 cell.text 內的 draggable-item reusable/del-btn HTML
  console.log("表格配置：", tableConfigs.value);
  const cleanConfigs = JSON.parse(JSON.stringify(tableConfigs.value))
  for (const cfg of cleanConfigs) {
    for (const row of cfg.dataRowsCfg) {
      for (const cell of row.cells) {
        if (typeof cell.text === 'string') {
          // 移除 draggable-item reusable 區塊與 del-btn
          cell.text = stripPaletteHtml(cell.text)
        }
      }
    }
  }
  const payload = {
    configs: cleanConfigs
  }
  localStorage.setItem(key, JSON.stringify(payload))
  // 更新名稱清單
  const listRaw = localStorage.getItem('previewTableMulti__names')
  let list = []
  try { list = listRaw ? JSON.parse(listRaw) : [] } catch { list = [] }
  if (!list.includes(name)) { list.push(name); localStorage.setItem('previewTableMulti__names', JSON.stringify(list)) }
  alert('已儲存預覽表格為「' + name + '」')
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
<style >
body {
  font-family: "Segoe UI", Roboto, "Noto Sans TC", sans-serif;
  margin: 1.5rem;
  margin-right: 340px;
}
body.palette-collapsed {
  margin-right: 24px;
}
#controls button {
  margin-right: 0.5rem;
  padding: 4px 10px;
}
.draggable-item {
  background: #fffbe6;
  border-collapse: collapse;
  width: 100%;
  margin-top: 1rem;
}
th,
td {
  border: 1px solid #999;
  padding: 0.6rem;
  min-height: 44px;
  text-align: left;
  vertical-align: top;
}
th {
  background: #f5f5f5;
}
td.drop-hover {
  background: #f32400;
}
#tableWrap,
#outputArea {
  margin-top: 2rem;
  border: 2px dashed #aaa;
  padding: 1rem;
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
textarea {
  width: 180px;
  height: 60px;
  font-family: inherit;
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
.draggable-item {
  background: #fff;
  border: 1px solid #bbb;
  padding: 0.4rem;
  cursor: grab;
  /* width: 280px; */
  width: 100%;
  box-sizing: border-box;
}
.reusable {
  background: #e1f5fe;
  border-color: #03a9f4;
}
.draggable-item .del-btn {
  text-align: end;
  font-size: 0.8rem;
  color: #f44336;
  cursor: pointer;
  user-select: none;
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
</style>
