<template>
  <div>
    <h2>多表格產生器（Builder）</h2>
    <fieldset>
      <legend>表格數量</legend>
      <label>
        表格數量 <input type="number" v-model.number="numTables" min="1" @input="onNumTablesChange" />
      </label>
    </fieldset>
    <fieldset v-show="numTables > 1">
      <legend>表格合併設定</legend>
      <label><input type="checkbox" v-model="mergeTables" @change="onMergeChange" /> 合併表格</label>
    </fieldset>
    <div id="tablesConfig">
      <div v-for="(cfg, idx) in tableConfigs" :key="idx" class="table-config-block">
        <h3>表格 {{ idx + 1 }} 設定</h3>
        <!-- 表頭設定 -->
        <fieldset>
          <legend>表頭設定</legend>
          <label>表頭列數
            <select v-model.number="cfg.headerRowsLen" @change="onHeaderRowsLenChange(idx)">
              <option v-for="n in [1,2,3]" :key="n" :value="n">{{ n }}</option>
            </select>
          </label>
          <div class="headerRows">
            <div v-for="r in cfg.headerRowsLen" :key="r">
              <div class="row-main-title" @click="toggleHeaderRowCollapse(idx, r-1)">
                {{ headerRowCollapse[idx] && headerRowCollapse[idx][r-1] !== false ? '▼' : '▶' }} 表頭第 {{ r }} 列
              </div>
              <div class="row-config" v-show="headerRowCollapse[idx] && headerRowCollapse[idx][r-1] !== false">
                <strong>第 {{ r }} 列</strong>
                <button type="button" @click="addHeaderCell(idx, r-1)">新增儲存格</button>
                <div class="cells-wrapper">
                  <div v-for="(cell, i) in cfg.headerRows[r-1]" :key="i" class="cell-config" :class="{collapsed: cell.collapsed}">
                    <div class="cell-header" @click="toggleHeaderCellCollapse(cell)">
                      <span>儲存格設定-{{ i+1 }}</span>
                      <button type="button" class="collapse-btn">{{ cell.collapsed ? '+' : '–' }}</button>
                    </div>
                    <div class="body" v-show="!cell.collapsed">
                      <label><div class="title">背景色</div><input type="color" v-model="cell.bg"></label>
                      <label><div class="title">中文</div><input type="text" v-model="cell.text"></label>
                      <label><div class="title">英文</div><input type="text" v-model="cell.en"></label>
                      <label><div class="title">合併欄</div><input type="number" min="1" v-model.number="cell.colspan"></label>
                      <label><div class="title">合併列</div><input type="number" min="1" v-model.number="cell.rowspan"></label>
                      <label><div class="title">寬度比例</div><input type="number" min="0" v-model="cell.width"></label>
                      <label><div class="title">文字對齊</div>
                        <select v-model="cell.align">
                          <option value="left">靠左</option>
                          <option value="center">置中</option>
                          <option value="right">靠右</option>
                        </select>
                      </label>
                      <label><div class="title">字體顏色</div><input type="color" v-model="cell.color"></label>
                      <label><div class="title">字體大小(px)</div><input type="number" min="8" v-model.number="cell.size"></label>
                      <label><div class="title">索引</div>
                        <select v-model="cell.indexed">
                          <option :value="false">不啟用</option>
                          <option :value="true">啟用</option>
                        </select>
                      </label>
                      <button type="button" class="remove-button" @click="removeHeaderCell(idx, r-1, i)">移除</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </fieldset>
        <!-- 資料列設定 -->
        <fieldset>
          <legend>資料列設定</legend>
          <label>資料列數 <input type="number" min="1" v-model.number="cfg.dataRowsLen" @input="onDataRowsLenChange(idx)"></label>
        </fieldset>
        <!-- 色彩設定 -->
        <fieldset>
          <legend>色彩設定</legend>
          <label>預設資料列背景色 <input type="color" v-model="cfg.dataBg"></label>
        </fieldset>
        <!-- 詳細設定 -->
        <fieldset>
          <legend>資料列詳細設定（可拖曳交換）</legend>
          <small>※ 需先建立表頭後才能設定。</small>
          <div class="dataRowsDetail">
            <div v-for="(row, ri) in cfg.dataRowsCfg" :key="ri">
              <div class="row-main-title" :draggable="true" @dragstart="onRowDragStart($event, ri)" @dragover.prevent="onRowDragOver($event)" @drop.prevent="onRowDrop(idx, ri)" @click="toggleRowCollapse(idx, ri)">
                {{ rowCollapse[idx][ri] ? '▼' : '▶' }} 資料列 {{ ri+1 }}
              </div>
              <div class="row-config" v-show="rowCollapse[idx][ri]">
                <label>背景色 <input type="color" v-model="row.color"></label>
                <div class="cells-wrapper">
                  <div v-for="(cell, ci) in row.cells" :key="ci" class="cell-config" :class="{collapsed: cell.collapsed}">
                    <div class="cell-header" @click="toggleDataCellCollapse(cell)">
                      <span>{{ getLeaf(cfg)[ci]?.text || '欄位名稱' }}</span>
                      <button type="button" class="collapse-btn">{{ cell.collapsed ? '+' : '–' }}</button>
                    </div>
                    <div class="body" v-show="!cell.collapsed">
                      <label>
                        <div class="title">內容</div>
                        <textarea
                          :value="getLeaf(cfg)[ci]?.indexed && (+cell.colspan === 1) && (+cell.rowspan === 1) ? getIndexNumber(cfg, ri, ci) : cell.text"
                          :disabled="getLeaf(cfg)[ci]?.indexed && (+cell.colspan === 1) && (+cell.rowspan === 1)"
                          @input="e => { const target = e.target as HTMLTextAreaElement; if (!(getLeaf(cfg)[ci]?.indexed && (+cell.colspan === 1) && (+cell.rowspan === 1))) cell.text = target.value }"
                        ></textarea>
                      </label>
                      <label><div class="title">合併欄</div><input type="number" min="1" v-model.number="cell.colspan"></label>
                      <label><div class="title">合併列</div><input type="number" min="1" v-model.number="cell.rowspan"></label>
                      <label><div class="title">文字對齊</div>
                        <select v-model="cell.align">
                          <option value="left">靠左</option>
                          <option value="center">置中</option>
                          <option value="right">靠右</option>
                        </select>
                      </label>
                      <label><div class="title">字體顏色</div><input type="color" v-model="cell.color"></label>
                      <label><div class="title">字體大小(px)</div><input type="number" min="8" v-model.number="cell.size"></label>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </fieldset>
      </div>
    </div>
    <fieldset>
      <button @click="generatePreview">產生表格</button>
      <legend>儲存 / 讀取</legend>
      <input v-model="saveName" type="text" placeholder="請輸入名稱…" />
      <button @click="saveToLocal">💾 儲存</button>
      <select v-model="loadName">
        <option value="">-- 選擇檔案 --</option>
        <option v-for="n in nameList" :key="n" :value="n">{{ n }}</option>
      </select>
      <button @click="loadFromLocal">📂 讀取</button>
    </fieldset>
    <div id="table-output-wrapper">
      <div id="table-output">
        <div v-if="previewTables" class="preview-area" v-html="previewTables"></div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, reactive } from 'vue'
import type { TableConfig, HeaderCell, DataCell } from '../types/table'

const numTables = ref(1)
const mergeTables = ref(false)
const saveName = ref('')
const loadName = ref('')
const nameList = ref<string[]>([])
const tableConfigs = ref<TableConfig[]>([])
const previewTables = ref('')
const rowCollapse = reactive<any>({})
const headerRowCollapse = reactive<any>({})

function getNameList() {
  try {
    return JSON.parse(localStorage.getItem('dynamicTableMulti__names') || '[]')
  } catch {
    return []
  }
}
function refreshNameOptions(selId = '') {
  nameList.value = getNameList()
  if (selId) loadName.value = selId
}
refreshNameOptions()

function onNumTablesChange() {
  while (tableConfigs.value.length < numTables.value) tableConfigs.value.push(createDefaultConfig())
  tableConfigs.value.length = numTables.value
  for (let i = 0; i < numTables.value; i++) {
    if (!rowCollapse[i]) rowCollapse[i] = []
    if (!headerRowCollapse[i]) headerRowCollapse[i] = []
    const cfg = tableConfigs.value[i]
    for (let j = 0; j < cfg.dataRowsLen; j++) {
      if (typeof rowCollapse[i][j] !== 'boolean') rowCollapse[i][j] = true
    }
    for (let r = 0; r < cfg.headerRowsLen; r++) {
      if (typeof headerRowCollapse[i][r] !== 'boolean') headerRowCollapse[i][r] = true
    }
    // 移除多餘的 collapse 狀態
    rowCollapse[i].length = cfg.dataRowsLen
    headerRowCollapse[i].length = cfg.headerRowsLen
  }
}
function onMergeChange() {
  // nothing, just for v-model sync
}
function syncDataRowCells(idx: number) {
  const cfg = tableConfigs.value[idx]
  const leaf = getLeaf(cfg)
  cfg.dataRowsCfg.forEach((row: any) => {
    while (row.cells.length < leaf.length) row.cells.push(createDefaultCell())
    row.cells.length = leaf.length
  })
}
function onHeaderRowsLenChange(idx: number) {
  const cfg = tableConfigs.value[idx]
  while (cfg.headerRows.length < cfg.headerRowsLen) cfg.headerRows.push([createDefaultHeaderCell()])
  cfg.headerRows.length = cfg.headerRowsLen
  for (let r = 0; r < cfg.headerRowsLen; r++) {
    if (!Array.isArray(cfg.headerRows[r])) cfg.headerRows[r] = [createDefaultHeaderCell()]
  }
  syncDataRowCells(idx)
}
function onDataRowsLenChange(idx: number) {
  const cfg = tableConfigs.value[idx]
  while (cfg.dataRowsCfg.length < cfg.dataRowsLen) cfg.dataRowsCfg.push({ color: '#ffffff', cells: [] })
  cfg.dataRowsCfg.length = cfg.dataRowsLen
  // 修正 rowCollapse 狀態同步
  if (!rowCollapse[idx]) rowCollapse[idx] = []
  for (let j = 0; j < cfg.dataRowsLen; j++) {
    if (typeof rowCollapse[idx][j] !== 'boolean') rowCollapse[idx][j] = true
  }
  // 移除多餘的 collapse 狀態
  rowCollapse[idx].length = cfg.dataRowsLen
  syncDataRowCells(idx)
}
function addHeaderCell(t: number, r: number) {
  tableConfigs.value[t].headerRows[r].push(createDefaultHeaderCell())
  syncDataRowCells(t)
}
function removeHeaderCell(t: number, r: number, i: number) {
  tableConfigs.value[t].headerRows[r].splice(i, 1)
  syncDataRowCells(t)
}
function toggleHeaderCellCollapse(cell: any) {
  cell.collapsed = !cell.collapsed
}
function toggleDataCellCollapse(cell: any) {
  cell.collapsed = !cell.collapsed
}
function toggleRowCollapse(tIdx: number, rIdx: number) {
  if (!rowCollapse[tIdx]) rowCollapse[tIdx] = []
  // 若未初始化則預設展開
  if (typeof rowCollapse[tIdx][rIdx] !== 'boolean') rowCollapse[tIdx][rIdx] = true
  rowCollapse[tIdx][rIdx] = !rowCollapse[tIdx][rIdx]
}
function toggleHeaderRowCollapse(tIdx: number, rIdx: number) {
  if (!headerRowCollapse[tIdx]) headerRowCollapse[tIdx] = []
  headerRowCollapse[tIdx][rIdx] = !headerRowCollapse[tIdx][rIdx]
}
function createDefaultHeaderCell(): HeaderCell {
  return {
    text: '', en: '', colspan: 1, rowspan: 1, width: '', align: 'left', color: '#000000', size: 16, indexed: false, collapsed: false, bg: '#e0eaff'
  }
}
function createDefaultCell(): DataCell {
  return {
    text: '', colspan: 1, rowspan: 1, align: 'left', color: '#000000', size: 16, collapsed: false
  }
}
function createDefaultConfig(): TableConfig {
  return {
    headerRowsLen: 1,
    headerRows: [[]],
    dataRowsLen: 1,
    dataRowsCfg: [{ color: '#ffffff', cells: [] }],
    dataBg: '#ffffff'
  }
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

// 取得索引欄排序數字（僅遇到索引欄且 colspan/rowspan=1 時才遞增）
function getIndexNumber(cfg: any, ri: number, ci: number) {
  const leaf = getLeaf(cfg)
  let count = 1
  for (let r = 0; r <= ri; r++) {
    const cell = cfg.dataRowsCfg[r].cells[ci]
    if (leaf[ci]?.indexed && (+cell.colspan === 1) && (+cell.rowspan === 1)) {
      if (r === ri) return count
      count++
    }
  }
  return ''
}

// 拖曳排序
let dragRowIdx = -1
function onRowDragStart(e: DragEvent,  rIdx: number) {
  dragRowIdx = rIdx
  e.dataTransfer?.setData('text/plain', String(rIdx))
}
function onRowDragOver(e: DragEvent) {
  e.preventDefault()
}
function onRowDrop( tIdx: number, rIdx: number) {
  if (dragRowIdx === -1 || dragRowIdx === rIdx) return
  const cfg = tableConfigs.value[tIdx]
  const moved = cfg.dataRowsCfg.splice(dragRowIdx, 1)[0]
  cfg.dataRowsCfg.splice(rIdx, 0, moved)
  dragRowIdx = -1
  alert(`已將資料列 ${dragRowIdx + 1} 與 ${rIdx + 1} 交換順序`)
}

// 預覽產生
function generatePreview() {
  let html = ''
  tableConfigs.value.forEach((cfg, idx) => {
    const dBg = cfg.dataBg || '#fff'
    const leaf = getLeaf(cfg)
    const colgroup = `<colgroup>${leaf.map((l: any) => `<col style="${l.width ? `width:${l.width}%;` : ''}"></col>`).join('')}</colgroup>`
    const thead = cfg.headerRows.map((r: any[]) => `<tr>${r.map((cell: any) => `<th${cell.colspan>1?` colspan=\"${cell.colspan}\"`:''}${cell.rowspan>1?` rowspan=\"${cell.rowspan}\"`:''}${cell.en?` data-column=\"${cell.en}\"`:''} style=\"background:${cell.bg||'#e0eaff'};text-align:${cell.align};color:${cell.color};font-size:${cell.size}px;\">${cell.text||'&nbsp;'}${cell.en?`<br><small>${cell.en}</small>`:''}</th>`).join('')}</tr>`).join('')
    const tbody = buildTbody(cfg, dBg)
    html += `<table class=\"preview tbl-${idx}${mergeTables.value&&idx>0?' merged':''}\">${colgroup}<thead>${thead}</thead><tbody>${tbody}</tbody></table><br>`
  })
  previewTables.value = html
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
      const data = cs === 1 && rs === 1 && leaf[c].en ? ` data-column="${leaf[c].en}"` : ''
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
      // 修正: 產生 <td> 屬性時，所有屬性皆用單層雙引號，避免 escape 問題
      out += `<td${data}${cs > 1 ? ` colspan="${cs}"` : ''}${rs > 1 ? ` rowspan="${rs}"` : ''} style="align-content: center;text-align:${align};${color?`color:${color};`:''}${size?`font-size:${size}px;`:''}">${html}</td>`
    }
    if (rowIndexed) indexCounter++
    out += `</tr>`
  }
  return out
}
function getContrastColor(hex: string) {
  if (!hex || hex.length !== 7) return '#000'
  const r = parseInt(hex.substr(1, 2), 16)
  const g = parseInt(hex.substr(3, 2), 16)
  const b = parseInt(hex.substr(5, 2), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 >= 128 ? '#000' : '#fff'
}
function saveToLocal() {
  // 儲存前先將索引欄排序數字寫入 cell.text
  tableConfigs.value.forEach(cfg => {
    const leaf = getLeaf(cfg)
    const cols = leaf.length
    let indexCounters = Array(cols).fill(1)
    cfg.dataRowsCfg.forEach((row: any) => {
      row.cells.forEach((cell: any, ci: number) => {
        if (leaf[ci]?.indexed && (+cell.colspan === 1) && (+cell.rowspan === 1)) {
          cell.text = String(indexCounters[ci])
          indexCounters[ci]++
        }
      })
    })
  })
  const name = saveName.value.trim()
  if (!name) { alert('請輸入檔名！'); return }
  const key = 'dynamicTableMulti__' + name
  if (localStorage.getItem(key) && !confirm('已存在同名檔案，是否覆蓋？')) return
  const payload = {
    configs: tableConfigs.value,
    numTables: numTables.value,
    merge: mergeTables.value
  }
  localStorage.setItem(key, JSON.stringify(payload))
  const list = getNameList()
  if (!list.includes(name)) { list.push(name); localStorage.setItem('dynamicTableMulti__names', JSON.stringify(list)) }
  refreshNameOptions(name)
  alert('已儲存為「' + name + '」')
}
function loadFromLocal() {
  const name = loadName.value
  if (!name) { alert('請先選擇檔案'); return }
  const raw = localStorage.getItem('dynamicTableMulti__' + name)
  console.log('loadFromLocal', name, raw)
  if (!raw) { alert('找不到資料！'); refreshNameOptions(); return }
  try {
    const obj = JSON.parse(raw)
    numTables.value = obj.numTables
    mergeTables.value = obj.merge
    tableConfigs.value = obj.configs
    onNumTablesChange()
    generatePreview()
  } catch {
    alert('資料格式錯誤！')
  }
}
// 初始化
onNumTablesChange()
</script>
<style scoped>
html,
body {
  overscroll-behavior: contain;
}
body {
  font-family: Arial, "Noto Sans TC", sans-serif;
  margin: 24px;
  line-height: 1.5;
}
h1 {
  margin-bottom: 16px;
}
fieldset {
  border: 1px solid #ccc;
  padding: 12px;
  margin-bottom: 16px;
  border-radius: 6px;
  min-width: 0;
}
legend {
  padding: 0 6px;
  font-weight: 600;
}
label {
  display: inline-block;
  margin-right: 8px;
  margin-bottom: 4px;
}
input[type="number"],
select {
  width: 60px;
}
textarea {
  max-width: 100%;
  min-height: 100px;
  width: 100%;
  resize: none;
}
button {
  padding: 4px 10px;
  margin: 4px 4px;
  cursor: pointer;
}


/* —— 編輯面板 —— */
.row-config {
  margin: 8px 0;
  padding: 8px;
  border: 1px dashed #aaa;
  border-radius: 4px;
}
.cell-config {
  align-items: baseline;
  display: flex;
  flex-direction: column;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 6px;
  background: #f9f9f9;
  min-width: 0;
  max-width: 100%;
  box-sizing: border-box;
  word-break: break-all;
}
.cell-config input[type="text"],
.cell-config input[type="number"] {
  /* width: 100%; */
  min-width: 0;
  box-sizing: border-box;
  margin: 0 10px 0 10px;
}
.cells-wrapper {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 12px;
  margin-top: 6px;
  align-items: start;
  width: 100%;
  box-sizing: border-box;
}
.title {
  font-size: 14px;
  font-weight: bold;
  color: #333;
  background: #e0eaff;
  padding: 4px 8px;
  border-left: 4px solid #3a78c3;
  border-radius: 4px 0 0 4px;
  margin-bottom: 4px;
  display: inline-block;
  user-select: none;
}
.remove-button {
  background: #dc3545;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 6px 16px;
  cursor: pointer;
}
.row-main-title {
  cursor: pointer;
  background: #e0eaff;
  font-weight: bold;
  padding: 6px;
  margin: 6px 0;
  user-select: none;
}
.row-main-title.drag-over {
  background: #cfe7ff !important;
}
.cell-config .body {
    align-items: baseline;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  background: #f9f9f9;
  transition: max-height 0.3s ease;
  box-sizing: border-box;
  width: 100%;
}
.cell-config.collapsed .body {
  display: none;
}
.cell-config .collapse-btn {
  background: transparent;
  border: none;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
}
.preview.merged {
  margin-top: -1px;
}

/* —— table‑output 捲動 —— */
#table-output-wrapper {
  max-height: 60vh;
  overflow: auto;
  border: 1px solid #ddd;
  padding: 4px;
  margin-top: 12px;
}
.dataRowsDetail {
  overflow: auto;
  max-height: 600px;
}
@media (max-width: 600px) {
  .cells-wrapper {
    grid-template-columns: 1fr;
  }
}
</style>
