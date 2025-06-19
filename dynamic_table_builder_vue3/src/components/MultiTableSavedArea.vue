<template>
  <div>
    <h2>多表格暫存/完成區（Saved Area）</h2>
    <div id="savedArea">
      <select v-model="selectedName" @change="loadSavedTable">
        <option value="">-- 選擇已儲存預覽表格 --</option>
        <option v-for="n in nameList" :key="n" :value="n">{{ n }}</option>
      </select>
      <button @click="reload">重新讀取</button>
      <div v-if="tableConfigs.length === 0 && selectedName">（找不到資料或尚未儲存）</div>
      <div v-else-if="tableConfigs.length > 0">
        <div v-for="(cfg, idx) in tableConfigs" :key="idx" class="table-block">
          <div style="font-weight:bold;">表格 {{ idx + 1 }}</div>
          <div v-html="buildPreviewTable(cfg, idx)"></div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'

const nameList = ref<string[]>([])
const selectedName = ref('')
const tableConfigs = ref<any[]>([])

function getSavedNameList() {
  try {
    return JSON.parse(localStorage.getItem('previewTableMulti__names') || '[]')
  } catch {
    return []
  }
}
function reload() {
  nameList.value = getSavedNameList()
  if (selectedName.value) loadSavedTable()
}
function loadSavedTable() {
  const name = selectedName.value
  if (!name) { tableConfigs.value = []; return }
  const raw = localStorage.getItem('previewTableMulti__' + name)
  if (!raw) { tableConfigs.value = []; return }
  try {
    const obj = JSON.parse(raw)
    tableConfigs.value = obj.configs || []
  } catch {
    tableConfigs.value = []
  }
}
function buildPreviewTable(cfg: any, idx: number) {
  const hBg = cfg.headerBg || '#e0eaff'
  const dBg = cfg.dataBg || '#fff'
  const hColor = getContrastColor(hBg)
  const leaf = getLeaf(cfg)
  const colgroup = `<colgroup>${leaf.map((l: any) => `<col style="${l.width ? `width:${l.width}%;` : ''}"></col>`).join('')}</colgroup>`
  const thead = cfg.headerRows.map((r: any[]) => `<tr>${r.map((cell: any) => `<th${cell.colspan>1?` colspan=\"${cell.colspan}\"`:''}${cell.rowspan>1?` rowspan=\"${cell.rowspan}\"`:''}${cell.en?` data-column=\"${cell.en}\"`:''} style=\"text-align:${cell.align};color:${cell.color};font-size:${cell.size}px;\">${cell.text||'&nbsp;'}${cell.en?`<br><small>${cell.en}</small>`:''}</th>`).join('')}</tr>`).join('')
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
      out += `<td data-row=\"${r}\" data-col=\"${c}\"${data}${cs > 1 ? ` colspan=\"${cs}\"` : ''}${rs > 1 ? ` rowspan=\"${rs}\"` : ''} style=\"text-align:${align};${color?`color:${color};`:''}${size?`font-size:${size}px;`:''}\">${html}</td>`
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
onMounted(reload)
</script>
