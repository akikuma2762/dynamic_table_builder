<template>
  <div class="multi-table-builder">
    <h2>🛠️ 多表格產生器</h2>
    <fieldset>
      <legend>📊 表格數量設定</legend>
      <div class="builder-input-group">
        <label>
          <div>表格數量</div>
          <input type="number" v-model.number="numTables" min="1" max="10" @input="onNumTablesChange" />
        </label>
        <div class="table-count-indicator">
          <span v-for="n in numTables" :key="n" class="table-dot">{{ n }}</span>
        </div>
      </div>
    </fieldset>
    <fieldset v-show="numTables > 1" class="merge-settings">
      <legend>🔗 表格合併設定</legend>
      <label class="merge-checkbox">
        <input type="checkbox" v-model="mergeTables" @change="onMergeChange" />
        <span>合併所有表格為單一表格</span>
      </label>
    </fieldset>    <div id="tablesConfig" class="tables-config-container">
      <div v-for="(cfg, idx) in tableConfigs" :key="idx" class="table-config-block">
        <h3>📋 表格 {{ idx + 1 }} 設定</h3>
        <!-- 表頭設定 -->
        <fieldset class="header-config">
          <legend>🎯 表頭設定</legend>
          <div class="builder-input-group">
            <label>
              <div>表頭列數</div>
              <select v-model.number="cfg.headerRowsLen" @change="onHeaderRowsLenChange(idx)">
                <option v-for="n in [1,2,3]" :key="n" :value="n">{{ n }} 列</option>
              </select>
            </label>
          </div>
          <div class="headerRows">
            <div v-for="r in cfg.headerRowsLen" :key="r" class="header-row-section">
              <div class="row-main-title" @click="toggleHeaderRowCollapse(idx, r-1)">
                <span class="collapse-indicator">{{ headerRowCollapse[idx] && headerRowCollapse[idx][r-1] !== false ? '📂' : '📁' }}</span>
                <span>表頭第 {{ r }} 列</span>
                <span class="cell-count-badge">{{ cfg.headerRows[r-1]?.length || 0 }} 個儲存格</span>
              </div>
              <div class="row-config" v-show="headerRowCollapse[idx] && headerRowCollapse[idx][r-1] !== false">
                <div class="row-config-header">
                  <strong>第 {{ r }} 列配置</strong>
                  <button type="button" class="add-cell-btn" @click="addHeaderCell(idx, r-1)">
                    ➕ 新增儲存格
                  </button>
                </div>                <div class="cells-wrapper">
                  <div v-for="(cell, i) in cfg.headerRows[r-1]" :key="i" class="cell-config" :class="{collapsed: cell.collapsed}">
                    <div class="cell-header" @click="toggleHeaderCellCollapse(cell)">
                      <span class="cell-title">
                        <span class="cell-icon">🔧</span>
                        儲存格 {{ i+1 }}
                        <span v-if="cell.text" class="cell-preview">- {{ cell.text.substring(0, 10) }}{{ cell.text.length > 10 ? '...' : '' }}</span>
                      </span>
                      <button type="button" class="collapse-btn">{{ cell.collapsed ? '➕' : '➖' }}</button>
                    </div>
                    <div class="body" v-show="!cell.collapsed">
                      <div class="cell-config-grid">
                        <label class="config-item">
                          <div class="title">🎨 背景色</div>
                          <input type="color" v-model="cell.bg">
                        </label>
                        <label class="config-item">
                          <div class="title">🇹🇼 中文內容</div>
                          <input type="text" v-model="cell.text" maxlength="50">
                        </label>
                        <label class="config-item">
                          <div class="title">🇺🇸 英文內容</div>
                          <input type="text" v-model="cell.en" maxlength="50">
                        </label>
                        <label class="config-item">
                          <div class="title">📏 合併欄位</div>
                          <input type="number" min="1" max="20" v-model.number="cell.colspan">
                        </label>
                        <label class="config-item">
                          <div class="title">📐 合併列數</div>
                          <input type="number" min="1" max="10" v-model.number="cell.rowspan">
                        </label>
                        <label class="config-item">
                          <div class="title">📊 寬度比例</div>
                          <input type="number" min="0" max="1000" v-model="cell.width" placeholder="自動">
                        </label>
                        <label class="config-item">
                          <div class="title">📝 文字對齊</div>
                          <select v-model="cell.align">
                            <option value="left">⬅️ 靠左</option>
                            <option value="center">🎯 置中</option>
                            <option value="right">➡️ 靠右</option>
                          </select>
                        </label>
                        <label class="config-item">
                          <div class="title">🖋️ 字體顏色</div>
                          <input type="color" v-model="cell.color">
                        </label>
                        <label class="config-item">
                          <div class="title">📏 字體大小</div>
                          <input type="number" min="8" max="72" v-model.number="cell.size">
                        </label>
                        <label class="config-item">
                          <div class="title">🔢 自動索引</div>
                          <select v-model="cell.indexed">
                            <option :value="false">❌ 不啟用</option>
                            <option :value="true">✅ 啟用</option>
                          </select>
                        </label>
                      </div>
                      <button type="button" class="remove-button" @click="removeHeaderCell(idx, r-1, i)">
                        🗑️ 移除儲存格
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </fieldset>        <!-- 資料列設定 -->
        <fieldset class="data-rows-config">
          <legend>📋 資料列設定</legend>
          <div class="builder-input-group">
            <label>
              <div>資料列數</div>
              <input type="number" min="1" max="100" v-model.number="cfg.dataRowsLen" @input="onDataRowsLenChange(idx)">
            </label>
            <div class="data-row-indicator">
              <span class="row-count">{{ cfg.dataRowsLen }} 列資料</span>
            </div>
          </div>
        </fieldset>
        <!-- 色彩設定 -->
        <fieldset class="color-config">
          <legend>🎨 色彩設定</legend>
          <div class="builder-input-group">
            <label>
              <div>預設資料列背景色</div>
              <input type="color" v-model="cfg.dataBg">
            </label>
            <div class="color-preview" :style="{ backgroundColor: cfg.dataBg }">
              預覽色彩
            </div>
          </div>
        </fieldset>        <!-- 詳細設定 -->
        <fieldset class="detailed-config">
          <legend>📝 資料列詳細設定</legend>
          <div class="config-hint">
            <small>
              💡 <strong>使用提示：</strong>
              <br>• 需要先建立表頭後才能進行詳細設定
              <br>• 可拖拽列標題來調整順序
              <br>• 索引欄會自動產生序號
            </small>
          </div>
          <div class="dataRowsDetail">
            <div v-for="(row, ri) in cfg.dataRowsCfg" :key="ri" class="data-row-item">
              <div 
                class="row-main-title" 
                :draggable="true" 
                @dragstart="onRowDragStart($event, ri)" 
                @dragover.prevent="onRowDragOver($event)" 
                @drop.prevent="onRowDrop(idx, ri)" 
                @click="toggleRowCollapse(idx, ri)"
              >
                <span class="drag-handle">📐</span>
                <span class="collapse-indicator">{{ rowCollapse[idx][ri] ? '📂' : '📁' }}</span>
                <span class="row-title">資料列 {{ ri+1 }}</span>
                <div class="row-color-preview" :style="{ backgroundColor: row.color }"></div>
              </div>
              <div class="row-config" v-show="rowCollapse[idx][ri]">
                <div class="row-basic-config">
                  <label class="config-item">
                    <div class="title">🎨 列背景色</div>
                    <input type="color" v-model="row.color">
                  </label>
                </div>                <div class="cells-wrapper">
                  <div v-for="(cell, ci) in row.cells" :key="ci" class="cell-config" :class="{collapsed: cell.collapsed}">
                    <div class="cell-header" @click="toggleDataCellCollapse(cell)">                      <span class="cell-title">
                        <span class="cell-icon">📊</span>
                        {{ getLeaf(cfg)[ci]?.text || `欄位 ${ci+1}` }}
                        <span v-if="cell.text && !isIndexCell(cfg, ci, cell)" class="cell-preview">- {{ cell.text.substring(0, 10) }}{{ cell.text.length > 10 ? '...' : '' }}</span>
                        <span v-if="isIndexCell(cfg, ci, cell)" class="index-badge">🔢 自動</span>
                      </span>
                      <button type="button" class="collapse-btn">{{ cell.collapsed ? '➕' : '➖' }}</button>
                    </div>
                    <div class="body" v-show="!cell.collapsed">
                      <div class="cell-config-grid">
                        <label class="config-item full-width">
                          <div class="title">
                            📝 內容
                            <span v-if="getLeaf(cfg)[ci]?.indexed && (+cell.colspan === 1) && (+cell.rowspan === 1)" 
                                  class="auto-index-note">
                              (自動編號: {{ getIndexNumber(cfg, ri, ci) }})
                            </span>
                          </div>
                          <textarea
                            :value="getLeaf(cfg)[ci]?.indexed && (+cell.colspan === 1) && (+cell.rowspan === 1) ? getIndexNumber(cfg, ri, ci) : cell.text"
                            :disabled="getLeaf(cfg)[ci]?.indexed && (+cell.colspan === 1) && (+cell.rowspan === 1)"
                            :placeholder="getLeaf(cfg)[ci]?.indexed && (+cell.colspan === 1) && (+cell.rowspan === 1) ? '自動產生序號' : '請輸入內容...'"
                            @input="e => { const target = e.target as HTMLTextAreaElement; if (!(getLeaf(cfg)[ci]?.indexed && (+cell.colspan === 1) && (+cell.rowspan === 1))) cell.text = target.value }"
                          ></textarea>
                        </label>
                        <label class="config-item">
                          <div class="title">📏 合併欄位</div>
                          <input type="number" min="1" max="20" v-model.number="cell.colspan">
                        </label>
                        <label class="config-item">
                          <div class="title">📐 合併列數</div>
                          <input type="number" min="1" max="10" v-model.number="cell.rowspan">
                        </label>
                        <label class="config-item">
                          <div class="title">📝 文字對齊</div>
                          <select v-model="cell.align">
                            <option value="left">⬅️ 靠左</option>
                            <option value="center">🎯 置中</option>
                            <option value="right">➡️ 靠右</option>
                          </select>
                        </label>
                        <label class="config-item">
                          <div class="title">🖋️ 字體顏色</div>
                          <input type="color" v-model="cell.color">
                        </label>
                        <label class="config-item">
                          <div class="title">📏 字體大小</div>
                          <input type="number" min="8" max="72" v-model.number="cell.size">
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </fieldset>
      </div>    </div>
    
    <div class="action-section">
      <fieldset class="generate-section">
        <legend>🎯 產生表格</legend>
        <div class="generate-actions">
          <button @click="generatePreview" class="generate-btn">
            ✨ 產生表格預覽
          </button>
          <div class="preview-info">
            <span v-if="previewTables">✅ 已產生預覽</span>
            <span v-else>⏳ 等待產生</span>
          </div>
        </div>
      </fieldset>
      
      <fieldset class="save-load-section">
        <legend>💾 儲存 / 讀取</legend>
        <div class="save-load-grid">
          <div class="save-group">
            <label>
              <div class="title">📝 檔案名稱</div>
              <input v-model="saveName" type="text" placeholder="請輸入儲存名稱..." maxlength="50" />
            </label>
            <button @click="saveToLocal" :disabled="!saveName.trim()" class="save-btn">
              💾 儲存設定
            </button>
          </div>
          <div class="load-group">
            <label>
              <div class="title">📂 選擇檔案</div>
              <select v-model="loadName">
                <option value="">-- 選擇已儲存的檔案 --</option>
                <option v-for="n in nameList" :key="n" :value="n">{{ n }}</option>
              </select>
            </label>
            <button @click="loadFromLocal" :disabled="!loadName" class="load-btn">
              📂 讀取設定
            </button>
          </div>
        </div>
        <div class="saved-files-info" v-if="nameList.length > 0">
          <small>📁 已儲存 {{ nameList.length }} 個設定檔</small>
        </div>
      </fieldset>
    </div>
    
    <div id="table-output-wrapper" v-if="previewTables">
      <fieldset class="preview-section">
        <legend>👀 表格預覽</legend>
        <div id="table-output">
          <div class="preview-area" v-html="previewTables"></div>
        </div>
      </fieldset>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import type { TableConfig, HeaderCell, DataCell } from '../types/table'
import { safeGetLocalStorage, safeSetLocalStorage, isClientSide } from '../composables/useStorage'

const numTables = ref(1)
const mergeTables = ref(false)
const saveName = ref('')
const loadName = ref('')
const nameList = ref<string[]>([])
const tableConfigs = ref<TableConfig[]>([])
const previewTables = ref('')
const rowCollapse = reactive<any>({})
const headerRowCollapse = reactive<any>({})

// 計算索引儲存格狀態
const isIndexCell = computed(() => (cfg: any, ci: number, cell: any) => {
  return getLeaf(cfg)[ci]?.indexed && (+cell.colspan === 1) && (+cell.rowspan === 1)
})

function getNameList() {
  return safeGetLocalStorage('dynamicTableMulti__names', [])
}
function refreshNameOptions(selId = '') {
  nameList.value = getNameList()
  if (selId) loadName.value = selId
}

// 客戶端初始化
onMounted(() => {
  refreshNameOptions()
})

// 僅在客戶端時進行初始化
if (isClientSide()) {
  refreshNameOptions()
}

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
  const existingData = safeGetLocalStorage(key, null)
  if (existingData && !confirm('已存在同名檔案，是否覆蓋？')) return
  const payload = {
    configs: tableConfigs.value,
    numTables: numTables.value,
    merge: mergeTables.value
  }
  safeSetLocalStorage(key, payload)
  const list = getNameList()
  if (!list.includes(name)) { 
    list.push(name)
    safeSetLocalStorage('dynamicTableMulti__names', list)
  }
  refreshNameOptions(name)
  alert('已儲存為「' + name + '」')
}
function loadFromLocal() {
  const name = loadName.value
  if (!name) { alert('請先選擇檔案'); return }
  const raw = safeGetLocalStorage('dynamicTableMulti__' + name, null)
  console.log('loadFromLocal', name, raw)
  if (!raw) { alert('找不到資料！'); refreshNameOptions(); return }
  try {
    const obj = raw // 不需要再 JSON.parse，safeGetLocalStorage 已經處理了
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
