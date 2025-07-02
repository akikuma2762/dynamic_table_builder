<template>
  <div class="warpper">
    <h2>多表格暫存/完成區（Saved Area）</h2>
    <div id="savedArea">
      <select v-model="selectedName" @change="loadSavedTable">
        <option value="">-- 選擇已儲存預覽表格 --</option>
        <option v-for="n in nameList" :key="n" :value="n">{{ n }}</option>
      </select>
      <button @click="reload">重新讀取</button>
      <button @click="saveAllChanges" :disabled="!selectedName">儲存所有更動</button>
      <div v-if="tableConfigs.length === 0 && selectedName">（找不到資料或尚未儲存）</div>
      <div v-else-if="tableConfigs.length > 0">
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
                  :style="`text-align:${cell.align};color:${cell.color};font-size:${cell.size}px;${cell.bg ? `background:${cell.bg};` : ''}`"
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
                    <template v-else-if="cell.value && cell.value.type === 'checkbox'">
                      <label>
                        <input type="checkbox" v-model="cell.value.props.checked" />
                        {{ cell.value.props.label || '勾選' }}
                      </label>
                    </template>
                    <template v-else-if="cell.value && cell.value.type === 'textarea'">
                      <textarea
                        v-model="cell.value.props.text"
                        :placeholder="cell.value.props.placeholder || ''"
                        style="width:100%;min-height:32px;overflow:hidden;resize:none;"
                        ref="el => el && (el as HTMLTextAreaElement).style.height = 'auto', el && (el as HTMLTextAreaElement).style.height = (el as HTMLTextAreaElement).scrollHeight + 'px'"
                        @input="e => { const t = e.target as HTMLTextAreaElement; if(t){ t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; } }"
                      ></textarea>
                    </template>
                    <template v-else-if="isCustomValue(cell.value)">
                      <template v-for="field in cell.value.fields" :key="field.key">
                        <component :is="resolveFieldComponent()" :field="field" />
                      </template>
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
    </div>
  </div>
</template>
<script setup lang="ts">



import { onMounted, ref, nextTick } from 'vue'
import PaletteSignature from './PaletteSignature.vue'
import type { TableConfig, PaletteField } from '../types/table'
import { multiTableSavedAreaApi } from '../utils/api'
import type { MultiTableSavedAreaResponse } from '../types/multiTableSavedAreaResponse'

// @ts-ignore
function isCustomValue(val: any): val is { type: 'custom'; fields: PaletteField[] } {
  return val && val.type === 'custom' && Array.isArray(val.fields)
}

const nameList = ref<string[]>([])
const selectedName = ref('')
const tableConfigs = ref<TableConfig[]>([])

async function reload() {
  try {
    console.log('重新讀取多表格暫存區清單...')
    const res = await multiTableSavedAreaApi.getAll()
    nameList.value = res.data.data?.map((item: MultiTableSavedAreaResponse) => item.name) || []
    if (selectedName.value) await loadSavedTable()
  } catch (err: any) {
    alert('取得清單失敗：' + (err?.message || err))
    nameList.value = []
  }
}

async function loadSavedTable() {
  console.log('讀取已選擇的表格：', selectedName.value)
  const name = selectedName.value
  if (!name) { tableConfigs.value = []; return }
  try {
    const res = await multiTableSavedAreaApi.get(name)
    if (!res.data) { tableConfigs.value = []; return }
    let obj: any = res.data.data.configs
    if (typeof obj === 'string') {
      try { obj = JSON.parse(obj) } catch { obj = { configs: [] } }
    }
    let configsArr: any[] = []
    if (Array.isArray(obj)) {
      configsArr = obj
    } else if (Array.isArray(obj.configs)) {
      configsArr = obj.configs
    }
    tableConfigs.value = configsArr
    nextTick(() => {
      document.querySelectorAll('textarea').forEach(el => {
        if (el instanceof HTMLTextAreaElement) {
          el.style.height = 'auto'
          el.style.height = el.scrollHeight + 'px'
        }
      })
    })
  } catch (err: any) {
    alert('讀取失敗：' + (err?.message || err))
    tableConfigs.value = []
  }
}
// @ts-ignore
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
// @ts-ignore
function getContrastColor(hex: string) {
  if (!hex || hex.length !== 7) return '#000'
  const r = parseInt(hex.substr(1, 2), 16)
  const g = parseInt(hex.substr(3, 2), 16)
  const b = parseInt(hex.substr(5, 2), 16)
  return (r * 299 + g * 587 + b * 114) / 1000 >= 128 ? '#000' : '#fff'
}
// @ts-ignore
function isCellCovered(r: number, c: number, cfg: TableConfig) {
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
// @ts-ignore
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
// @ts-ignore
function stripPaletteHtml(html: string): string {
  if (!html) return ''
  return html
    .replace(/<div class=['\"]draggable-item reusable['\"][^>]*>/g, '')
    .replace(/<div class=["']draggable-item reusable["'][^>]*>/g, '')
    .replace(/<div class=['\"]del-btn['\"][^>]*>.*?<\/div>/g, '')
    .replace(/<div class=["']del-btn["'][^>]*>.*?<\/div>/g, '')
    .replace(/<div[^>]*>/g, '')
    .replace(/<\/div>/g, '')
}

async function saveAllChanges() {
  if (!selectedName.value) {
    alert('請先選擇檔案');
    return;
  }
  const payload = {
    name: selectedName.value,
    configs: JSON.stringify({ configs: tableConfigs.value })
  }
  try {
    // 先查詢是否已存在
    let exists = false
    try {
      const res = await multiTableSavedAreaApi.get(selectedName.value)
      exists = !!res.data
    } catch {}
    if (exists) {
      await multiTableSavedAreaApi.update(selectedName.value, payload)
    } else {
      await multiTableSavedAreaApi.create(payload)
    }
    alert('已儲存所有更動！')
    await reload()
  } catch (err: any) {
    alert('儲存失敗：' + (err?.message || err))
  }
}
onMounted(() => {
  reload()
})
</script>
<script lang="ts">
import { defineComponent, h } from 'vue'

// FieldRenderer: palette textarea 自動高度修正
const FieldRenderer = defineComponent({
  name: 'FieldRenderer',
  props: { field: { type: Object, required: true } },
  setup(props) {
    // textarea 自動高度
    function autoResize(el: HTMLTextAreaElement | null) {
      if (!el) return
      el.style.height = 'auto'
      el.style.height = el.scrollHeight + 'px'
    }
    function renderField(field: any) {
      if (field.type === 'p') {
        return h('p', {}, (field.children || []).map(renderField))
      } else if (field.type === 'br') {
        return h('br')
      } else if (field.type === 'text') {
        return h('span', {}, field.props.text)
      } else if (field.type === 'checkbox') {
        return h('label', { style: 'margin-right:8px;' }, [
          h('input', {
            type: 'checkbox',
            checked: field.props.checked,
            onInput: (e: Event) => {
              const target = e.target as HTMLInputElement | null
              if (target) field.props.checked = target.checked
            }
          }),
          field.props.label
        ])
      } else if (field.type === 'inputText') {
        return h('input', {
          type: 'text',
          value: field.props.value,
          placeholder: field.props.placeholder,
          style: 'width:100px;margin:0 4px 0 0;',
          onInput: (e: Event) => {
            const target = e.target as HTMLInputElement | null
            if (target) field.props.value = target.value
          }
        })
      } else if (field.type === 'textarea') {
        // textarea 自動高度，初次渲染與內容變動都觸發
        return h('textarea', {
          value: field.props.text,
          placeholder: field.props.placeholder || '',
          style: 'width:100%;min-height:32px;overflow:hidden;resize:none;',
          onVnodeMounted: ({ el }: any) => autoResize(el as HTMLTextAreaElement),
          onInput: (e: Event) => {
            const target = e.target as HTMLTextAreaElement | null
            if (target) {
              field.props.text = target.value
              autoResize(target)
            }
          }
        })
      } else if (field.type === 'fragment') {
        return (field.children || []).map(renderField)
      }
      return null
    }
    return () => renderField(props.field)
  }
})
function resolveFieldComponent() {
  return FieldRenderer
}
</script>
<style scoped>
.table-block {
  margin-bottom: 2rem;
}
</style>
