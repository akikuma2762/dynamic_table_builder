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
          <div v-html="buildPreviewTable(cfg, idx)" @dragover.prevent @drop="e => onTableDrop(e, idx)"></div>
        </div>
      </div>
    </div>
    <h4>預覽區：</h4>
    <div id="outputArea" style="pointer-events: none; user-select: text;">
      <div v-if="previewHtml" v-html="previewHtml"></div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import LegacyItemBuilder from './LegacyItemBuilder.vue'

declare global {
  interface Window {
    __cellDragEnter?: (e: DragEvent) => void
    __cellDragLeave?: (e: DragEvent) => void
    __cellDragOver?: (e: DragEvent) => void
  }
}

const nameList = ref<string[]>([])
const selectedName = ref('')
const tableConfigs = ref<any[]>([])
const previewHtml = ref('')

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
    html = `<div class='draggable-item reusable'><label><input type='checkbox' /> ${item.props.label}</label><div class='del-btn' onclick='this.parentNode.parentNode.innerHTML="&nbsp;"'>✖</div></div>`
  } else if (item.component === 'PaletteTextarea') {
    html = `<div class='draggable-item reusable'><textarea placeholder='${item.props.placeholder}'></textarea><div class='del-btn' onclick='this.parentNode.parentNode.innerHTML="&nbsp;"'>✖</div></div>`
  } else if (item.component === 'PaletteSignature') {
    html = `<div class='draggable-item reusable'><div class='signature-box'>簽名區</div><div class='del-btn' onclick='this.parentNode.parentNode.innerHTML="&nbsp;"'>✖</div></div>`
  } else if (item.html) {
    html = `<div class='draggable-item reusable'>${item.html}<div class='del-btn' onclick='this.parentNode.parentNode.innerHTML="&nbsp;"'>✖</div></div>`
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
})

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
    tableConfigs.value = obj.configs || []
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
function buildPreviewTable(cfg: any, idx: number) {
  const hBg = cfg.headerBg || '#e0eaff'
  const dBg = cfg.dataBg || '#fff'
  const hColor = getContrastColor(hBg)
  const leaf = getLeaf(cfg)
  const colgroup = `<colgroup>${leaf.map((l: any) => `<col style="${l.width ? `width:${l.width}%;` : ''}"></col>`).join('')}</colgroup>`
  const thead = cfg.headerRows.map((r: any[]) => `<tr>${r.map((cell: { colspan: number; rowspan: number; en: any; align: any; color: any; size: any; text: any }) => `<th${cell.colspan>1?` colspan=\"${cell.colspan}\"`:''}${cell.rowspan>1?` rowspan=\"${cell.rowspan}\"`:''}${cell.en?` data-column=\"${cell.en}\"`:''} style=\"text-align:${cell.align};color:${cell.color};font-size:${cell.size}px;\">${cell.text||'&nbsp;'}${cell.en?`<br><small>${cell.en}</small>`:''}</th>`).join('')}</tr>`).join('')
  const tbody = buildTbody(cfg, dBg)
  return `<style>.tbl-${idx} th{background:${hBg};color:${hColor};}</style><table class="preview tbl-${idx}">${colgroup}<thead>${thead}</thead><tbody>${tbody}</tbody></table>`
}
function buildTbody(cfg: any, defaultBg: string) {
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
      const data = cs === 1 && rs === 1 && leaf[c].en ? ` data-column=\"${leaf[c].en}\"` : ''
      let raw = cell.text ?? ''
      let html = raw.replace(/\n/g, '<br>')
      if (!html) html = '&nbsp;'
      if (indexColumns.includes(c) && cs === 1 && rs === 1) {
        html = String(indexCounter)
        rowIndexed = true
      }
      const align = cell.align || 'left'
      const color = cell.color || ''
      const size = cell.size || 16
      // 新增 data-row, data-col 屬性
      out += `<td data-row=\"${r}\" data-col=\"${c}\"${data}${cs > 1 ? ` colspan=\"${cs}\"` : ''}${rs > 1 ? ` rowspan=\"${rs}\"` : ''} style=\"text-align:${align};${color?`color:${color};`:''}${size?`font-size:${size}px;`:''}\"\n        ondragenter=\"window.__cellDragEnter && window.__cellDragEnter(event)\"\n        ondragleave=\"window.__cellDragLeave && window.__cellDragLeave(event)\"\n        ondragover=\"window.__cellDragOver && window.__cellDragOver(event)\"\n      >${html}</td>`
    }
    if (rowIndexed) indexCounter++
    out += `</tr>`
  }
  return out
}
function getLeaf(cfg: any) {
  const g: any[] = []
  const R = cfg.headerRows.length
  for (let r = 0; r < R; r++) {
    g[r] ??= []
    let c = 0
    cfg.headerRows[r].forEach((cell: any) => {
      while (g[r][c]) c++
      const cs = +cell.colspan || 1, rs = +cell.rowspan || 1
      for (let rr = 0; rr < rs; rr++) {
        g[r + rr] ??= []
        for (let cc = 0; cc < cs; cc++) {
          g[r + rr][c + cc] = cell
        }
      }
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
if (typeof window !== 'undefined') {
  window.__cellDragEnter = (e: DragEvent) => {
    const td = (e.target as HTMLElement)?.closest('td')
    if (td) td.classList.add('drop-hover')
  }
  window.__cellDragLeave = (e: DragEvent) => {
    const td = (e.target as HTMLElement)?.closest('td')
    if (td) td.classList.remove('drop-hover')
  }
  window.__cellDragOver = (e: DragEvent) => {
    const td = (e.target as HTMLElement)?.closest('td')
    if (td) td.classList.add('drop-hover')
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
  background: #c8e6c9;
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
  width: 280px;
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
}
.table-block.dragover {
  box-shadow: 0 0 0 2px #4caf50;
  border-color: #4caf50;
}
</style>
