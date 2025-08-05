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
      <button @click="exportToPDFPuppeteer" :disabled="!selectedName || tableConfigs.length === 0">匯出全部表格 PDF (Puppeteer)</button>
      <button @click="exportSingleTablePuppeteer" :disabled="!selectedName || tableConfigs.length === 0">匯出單個表格 PDF (Puppeteer)</button>
      <button @click="debugTableData" :disabled="!selectedName || tableConfigs.length === 0">調試表格資料</button>
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

// PDF 匯出函數
async function exportToPDF() {
  if (!selectedName.value || tableConfigs.value.length === 0) {
    alert('沒有表格資料可以匯出')
    return
  }
  
  try {
    console.log('開始匯出多表格 PDF，表格數量:', tableConfigs.value.length)
    console.log('表格配置:', tableConfigs.value)
    
    // 動態載入 Puppeteer 匯出模組
    const { exportAllTablesWithPuppeteer } = await import('../utils/pdfExportPuppeteer')
    
    const tableData = {
      configs: tableConfigs.value,
      numTables: tableConfigs.value.length,
      merge: false
    }
    
    const filename = `${selectedName.value}_多表格.pdf`
    await exportAllTablesWithPuppeteer(tableData, filename)
    alert('多表格 PDF 匯出成功！')
  } catch (error: any) {
    console.error('PDF 匯出錯誤:', error)
    alert('PDF 匯出失敗：' + (error?.message || error))
  }
}

// Puppeteer 方法單表格 PDF 匯出函數
async function exportSingleTablePuppeteer() {
  if (!selectedName.value || tableConfigs.value.length === 0) {
    alert('沒有表格資料可以匯出')
    return
  }
  
  try {
    console.log('開始使用 Puppeteer 方法匯出單表格 PDF')
    console.log('第一個表格配置:', tableConfigs.value[0])
    
    // 動態載入 Puppeteer 匯出模組
    const { exportSingleTableWithPuppeteer } = await import('../utils/pdfExportPuppeteer')
    
    const filename = `${selectedName.value}_單表格_Puppeteer.pdf`
    await exportSingleTableWithPuppeteer(tableConfigs.value[0], filename, 1)
    alert('Puppeteer 方法單表格 PDF 匯出成功！')
  } catch (error: any) {
    console.error('Puppeteer 單表格 PDF 匯出錯誤:', error)
    alert('Puppeteer 單表格 PDF 匯出失敗：' + (error?.message || error))
  }
}

async function exportToPDFPuppeteer() {
  if (!selectedName.value || tableConfigs.value.length === 0) {
    alert('沒有表格資料可以匯出')
    return
  }
  
  try {
    console.log('開始使用 Puppeteer 最佳品質方法匯出多表格 PDF，表格數量:', tableConfigs.value.length)
    console.log('表格配置:', tableConfigs.value)
    
    // 動態載入 Puppeteer 匯出模組
    const { exportAllTablesWithPuppeteer } = await import('../utils/pdfExportPuppeteer')
    
    const tableData = {
      configs: tableConfigs.value,
      numTables: tableConfigs.value.length,
      merge: false
    }
    console.log("tableData",tableData);
    const filename = `${selectedName.value}_多表格_Puppeteer.pdf`
    await exportAllTablesWithPuppeteer(tableData, filename)
    alert('Puppeteer 最佳品質方法多表格 PDF 匯出成功！')
  } catch (error: any) {
    console.error('Puppeteer PDF 匯出錯誤:', error)
    
    if (error.message === '用戶取消匯出操作') {
      // 用戶主動取消，不顯示錯誤
      return
    }
    
    // 提供更詳細的錯誤信息和解決方案
    const errorMessage = error?.message || error
    const helpMessage = '建議解決方案：\n' +
      '1. 確保網路連線正常\n' +
      '2. 如果使用 API 服務，請確保後端服務正在運行\n' +
      '3. 可以嘗試使用其他 PDF 匯出方法\n' +
      '4. 如需幫助，請參考 PUPPETEER_PDF_README.md 文件'
    
    alert(`Puppeteer PDF 匯出失敗：${errorMessage}\n\n${helpMessage}`)
  }
}

// 直接從 DOM 匯出 PDF (測試功能)
async function exportDirectFromDOM() {
  if (!selectedName.value || tableConfigs.value.length === 0) {
    alert('沒有表格資料可以匯出')
    return
  }
  
  try {
    console.log('開始使用 Puppeteer 從表格配置匯出 PDF')
    
    // 動態載入 Puppeteer 匯出模組
    const { exportAllTablesWithPuppeteer } = await import('../utils/pdfExportPuppeteer')
    
    const tableData = {
      configs: tableConfigs.value,
      numTables: tableConfigs.value.length,
      merge: false
    }
    
    const filename = `${selectedName.value}_頁面表格_Puppeteer.pdf`
    await exportAllTablesWithPuppeteer(tableData, filename)
    alert('頁面表格 PDF 匯出成功！')
  } catch (error: any) {
    console.error('頁面表格匯出錯誤:', error)
    alert('頁面表格匯出失敗：' + (error?.message || error))
  }
}
// 調試表格資料
function debugTableData() {
  console.log('=== 調試表格資料 ===')
  console.log('selectedName:', selectedName.value)
  console.log('tableConfigs 數量:', tableConfigs.value.length)
  console.log('完整 tableConfigs:', JSON.stringify(tableConfigs.value, null, 2))
  
  if (tableConfigs.value.length > 0) {
    const firstConfig = tableConfigs.value[0]
    console.log('第一個表格配置:')
    console.log('- headerRows 數量:', firstConfig.headerRows?.length || 0)
    console.log('- dataRowsCfg 數量:', firstConfig.dataRowsCfg?.length || 0)
    
    if (firstConfig.headerRows && firstConfig.headerRows.length > 0) {
      console.log('- 第一行表頭:', firstConfig.headerRows[0])
      firstConfig.headerRows.forEach((row, rIdx) => {
        console.log(`- 表頭第 ${rIdx + 1} 行:`, row)
        row.forEach((cell, cIdx) => {
          console.log(`  - 儲存格 [${rIdx},${cIdx}]:`, cell)
        })
      })
    }
    
    if (firstConfig.dataRowsCfg && firstConfig.dataRowsCfg.length > 0) {
      console.log('- 第一行資料:', firstConfig.dataRowsCfg[0])
      console.log('- 第一行資料的 cells:', firstConfig.dataRowsCfg[0].cells)
      firstConfig.dataRowsCfg.forEach((row, rIdx) => {
        console.log(`- 資料第 ${rIdx + 1} 行:`, row)
        if (row.cells) {
          row.cells.forEach((cell, cIdx) => {
            console.log(`  - 儲存格 [${rIdx},${cIdx}]:`, cell)
          })
        }
      })
    }
    
    // 測試 tableConfigToHtml 轉換
    console.log('\n=== 測試 tableConfigToHtml 轉換 ===')
    try {
      // 直接測試轉換
      const testHtml = createTestTableHtml(firstConfig)
      console.log('轉換結果 HTML (前 2000 字元):')
      console.log(testHtml.substring(0, 2000))
      
      // 創建測試元素並添加到頁面上查看效果
      const testElement = document.createElement('div')
      testElement.innerHTML = testHtml
      testElement.style.position = 'fixed'
      testElement.style.top = '10px'
      testElement.style.right = '10px'
      testElement.style.width = '400px'
      testElement.style.height = '300px'
      testElement.style.overflow = 'auto'
      testElement.style.backgroundColor = 'white'
      testElement.style.border = '2px solid red'
      testElement.style.zIndex = '9999'
      testElement.style.padding = '10px'
      
      document.body.appendChild(testElement)
      
      console.log('測試元素已添加到頁面右上角（紅框），5 秒後自動移除')
      
      setTimeout(() => {
        if (document.body.contains(testElement)) {
          document.body.removeChild(testElement)
          console.log('測試元素已移除')
        }
      }, 5000)
      
      console.log('表格資料分析完成，請查看控制台輸出')
      alert('表格資料分析完成，請查看控制台輸出')
      
    } catch (error) {
      console.error('測試轉換時發生錯誤:', error)
    }
  }
  
  alert('詳細調試信息已輸出到控制台，並在頁面右上角顯示轉換結果（5秒後消失），請查看 F12 開發者工具')
}

// 簡化的表格 HTML 創建函數，用於調試
function createTestTableHtml(config: any): string {
  let html = `
    <div style="font-family: 'Microsoft JhengHei', sans-serif; padding: 20px; background: white;">
      <h2>調試轉換結果</h2>
      <table style="border-collapse: collapse; width: 100%; border: 2px solid #000;">
  `

  // 處理表頭
  if (config.headerRows && config.headerRows.length > 0) {
    html += '<thead>'
    config.headerRows.forEach((row: any) => {
      html += '<tr>'
      row.forEach((cell: any) => {
        const styles = [
          'border: 1px solid #000',
          'padding: 8px',
          'text-align: ' + (cell.align || 'center'),
          'background-color: ' + (cell.bg || '#f0f0f0'),
          'font-weight: bold'
        ]
        if (cell.color) {
          styles.push('color: ' + cell.color)
        }
        if (cell.size) {
          styles.push('font-size: ' + cell.size + 'px')
        }
        html += `<th style="${styles.join('; ')}"${cell.colspan > 1 ? ` colspan="${cell.colspan}"` : ''}${cell.rowspan > 1 ? ` rowspan="${cell.rowspan}"` : ''}>`
        html += cell.text || '&nbsp;'
        if (cell.en) {
          html += `<br><small>${cell.en}</small>`
        }
        html += '</th>'
      })
      html += '</tr>'
    })
    html += '</thead>'
  }

  // 處理資料行 - 使用改進的合併儲存格處理邏輯
  if (config.dataRowsCfg && config.dataRowsCfg.length > 0) {
    html += '<tbody>'
    config.dataRowsCfg.forEach((row: any) => {
      html += '<tr>'
      if (row.cells) {
        // 追蹤當前行已被合併覆蓋的欄位
        const skipColumns = new Set<number>()
        
        row.cells.forEach((cell: any, cIdx: number) => {
          // 如果這個欄位已被前面的合併儲存格覆蓋，跳過
          if (skipColumns.has(cIdx)) {
            return
          }
          
          const styles = [
            'border: 1px solid #000',
            'padding: 8px',
            'text-align: ' + (cell.align || 'left'),
            'vertical-align: middle',
            'min-width: 80px'
          ]
          
          if (cell.color) {
            styles.push('color: ' + cell.color)
          }
          if (cell.size) {
            styles.push('font-size: ' + cell.size + 'px')
          }
          
          // 計算此儲存格的合併範圍
          const colspan = cell.colspan || 1
          const rowspan = cell.rowspan || 1
          
          // 標記被此儲存格覆蓋的欄位（同一行內）
          for (let c = 1; c < colspan; c++) {
            skipColumns.add(cIdx + c)
          }
          
          html += `<td style="${styles.join('; ')}"${colspan > 1 ? ` colspan="${colspan}"` : ''}${rowspan > 1 ? ` rowspan="${rowspan}"` : ''}>`
          
          let cellContent = ''
          if (cell.value) {
            if (cell.value.type === 'checkbox') {
              const checked = cell.value.props?.checked ? '☑' : '☐'
              cellContent = `${checked} ${cell.value.props?.label || '勾選'}`
            } else if (cell.value.type === 'textarea') {
              cellContent = (cell.value.props?.text || '').replace(/\n/g, '<br>')
            } else if (cell.value.type === 'signature') {
              cellContent = '[簽名區域]'
            }
          } else if (cell.text) {
            // 處理換行符號
            cellContent = cell.text.replace(/\n/g, '<br>')
          }
          
          html += cellContent || '&nbsp;'
          html += '</td>'
        })
      }
      html += '</tr>'
    })
    html += '</tbody>'
  }

  html += '</table></div>'
  return html
}

// 測試 Puppeteer PDF 匯出函數
async function testPDFExport() {
  if (!selectedName.value || tableConfigs.value.length === 0) {
    alert('沒有表格資料可以測試')
    return
  }
  
  try {
    console.log('=== 測試 Puppeteer PDF 匯出 ===')
    console.log('開始測試 PDF 匯出，表格數量:', tableConfigs.value.length)
    
    // 使用 Puppeteer 預覽功能
    const { previewTableHTML } = await import('../utils/pdfExportPuppeteer')
    
    const htmlPreview = previewTableHTML(tableConfigs.value[0], 1)
    console.log('HTML 預覽生成完成，長度:', htmlPreview.length)
    
    // 創建預覽窗口
    const previewWindow = window.open('', '_blank')
    if (previewWindow) {
      previewWindow.document.write(htmlPreview)
      previewWindow.document.close()
      console.log('預覽窗口已開啟')
    }
    
    alert('Puppeteer PDF 預覽已開啟，請查看新窗口')
    
  } catch (error: any) {
    console.error('測試 PDF 匯出錯誤:', error)
    alert('測試 PDF 匯出失敗：' + (error?.message || error))
  }
}







// 測試 Canvas 渲染函數 - 診斷 html2canvas 問題
async function testCanvasRender() {
  if (!selectedName.value || tableConfigs.value.length === 0) {
    alert('沒有表格資料可以測試')
    return
  }
  
  try {
    console.log('=== 測試 Canvas 渲染 ===')
    
    // 動態導入 html2canvas
    const html2canvas = (await import('html2canvas')).default
    
    // 使用我們的簡化 HTML
    const testHtml = createTestTableHtml(tableConfigs.value[0])
    
    // 創建測試元素並保持在可見區域
    const element = document.createElement('div')
    element.innerHTML = testHtml
    element.style.position = 'fixed'
    element.style.top = '50px'
    element.style.left = '50px'
    element.style.width = '700px'
    element.style.backgroundColor = 'white'
    element.style.border = '3px solid green'
    element.style.zIndex = '10000'
    element.style.padding = '20px'
    element.style.fontFamily = "'Microsoft JhengHei', sans-serif"
    
    // 添加關閉按鈕
    const closeBtn = document.createElement('button')
    closeBtn.textContent = '開始 Canvas 測試'
    closeBtn.style.position = 'absolute'
    closeBtn.style.top = '10px'
    closeBtn.style.right = '10px'
    closeBtn.style.padding = '5px 10px'
    closeBtn.style.backgroundColor = '#44ff44'
    closeBtn.style.color = 'black'
    closeBtn.style.border = 'none'
    closeBtn.style.cursor = 'pointer'
    element.appendChild(closeBtn)
    
    document.body.appendChild(element)
    
    console.log('Canvas 測試元素已添加，點擊綠色按鈕開始測試')
    
    // 等待用戶點擊按鈕
    await new Promise((resolve) => {
      closeBtn.onclick = () => resolve(true)
    })
    
    // 移除按鈕
    closeBtn.remove()
    
    // 等待一下讓 DOM 更新
    await new Promise(resolve => setTimeout(resolve, 500))
    
    console.log('測試元素尺寸:', element.offsetWidth, 'x', element.offsetHeight)
    
    // 測試 html2canvas 的不同選項
    const tests = [
      {
        name: '基本設定',
        options: {
          logging: true,
          scale: 1
        }
      },
      {
        name: '禁用外來物件',
        options: {
          logging: true,
          scale: 1,
          foreignObjectRendering: false
        }
      },
      {
        name: '允許汙染',
        options: {
          logging: true,
          scale: 1,
          allowTaint: true,
          useCORS: true
        }
      },
      {
        name: '簡化設定',
        options: {
          logging: true,
          scale: 1,
          allowTaint: true,
          useCORS: true,
          foreignObjectRendering: false,
          removeContainer: true
        }
      }
    ]
    
    for (let i = 0; i < tests.length; i++) {
      const test = tests[i]
      console.log(`\n=== 測試 ${i + 1}: ${test.name} ===`)
      
      try {
        const canvas = await html2canvas(element, test.options)
        console.log(`測試 ${i + 1} 成功:`, canvas.width, 'x', canvas.height)
        
        // 檢查 canvas 是否為空白
        const ctx = canvas.getContext('2d')
        const imageData = ctx?.getImageData(0, 0, canvas.width, canvas.height)
        const data = imageData?.data
        
        let hasContent = false
        if (data) {
          for (let j = 0; j < data.length; j += 4) {
            // 檢查 RGB 值，忽略完全透明的像素
            if (data[j + 3] > 0 && (data[j] !== 255 || data[j + 1] !== 255 || data[j + 2] !== 255)) {
              hasContent = true
              break
            }
          }
        }
        
        console.log(`測試 ${i + 1} 內容檢查:`, hasContent ? '有內容' : '空白')
        
        // 將 canvas 顯示在頁面上以便檢查
        canvas.style.position = 'fixed'
        canvas.style.top = (100 + i * 120) + 'px'
        canvas.style.right = '10px'
        canvas.style.border = '2px solid blue'
        canvas.style.maxWidth = '200px'
        canvas.style.maxHeight = '100px'
        canvas.style.zIndex = '10001'
        
        document.body.appendChild(canvas)
        
        // 5 秒後移除
        setTimeout(() => {
          if (document.body.contains(canvas)) {
            document.body.removeChild(canvas)
          }
        }, 5000)
        
      } catch (error) {
        console.error(`測試 ${i + 1} 失敗:`, error)
      }
      
      // 等待一下再進行下一個測試
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    // 清理主要元素
    if (document.body.contains(element)) {
      document.body.removeChild(element)
    }
    
    alert('Canvas 渲染測試完成！請查看控制台和右側的 Canvas 預覽（5秒後消失）')
    
  } catch (error: any) {
    console.error('Canvas 渲染測試錯誤:', error)
    alert('Canvas 渲染測試失敗：' + (error?.message || error))
  }
}


// 測試 Canvas 直接轉 PDF - 跳過 html2pdf，直接使用 html2canvas + jsPDF
async function testCanvasToPDF() {
  if (!selectedName.value || tableConfigs.value.length === 0) {
    alert('沒有表格資料可以測試')
    return
  }
  
  try {
    console.log('=== 測試 Canvas 直接轉 PDF ===')
    
    // 動態導入必要的庫
    const html2canvas = (await import('html2canvas')).default
    
    // 檢查是否有 jsPDF
    let jsPDF
    try {
      jsPDF = (await import('jspdf')).jsPDF
    } catch {
      alert('需要安裝 jsPDF 庫才能進行此測試。請執行: npm install jspdf')
      return
    }
    
    // 找到頁面上第一個表格
    const tableElement = document.querySelector('.table-block') as HTMLElement
    if (!tableElement) {
      alert('找不到頁面上的表格')
      return
    }
    
    console.log('找到表格元素:', tableElement)
    console.log('表格尺寸:', tableElement.offsetWidth, 'x', tableElement.offsetHeight)
    
    // 創建用於 Canvas 渲染的包裝容器
    const wrapper = document.createElement('div')
    wrapper.style.fontFamily = "'Microsoft JhengHei', 'PingFang TC', '微軟正黑體', sans-serif"
    wrapper.style.padding = '20px'
    wrapper.style.backgroundColor = 'white'
    wrapper.style.position = 'fixed'
    wrapper.style.top = '10px'
    wrapper.style.left = '10px'
    wrapper.style.width = '800px'
    wrapper.style.zIndex = '10000'
    wrapper.style.border = '3px solid purple'
    
    // 克隆表格
    const clonedTable = tableElement.cloneNode(true) as HTMLElement
    
    // wrapper.innerHTML = `
    //   <h2 style="text-align: center; margin-bottom: 20px;">${selectedName.value} - Canvas 直接轉 PDF</h2>
    //   ${clonedTable.outerHTML}
    // `
    wrapper.innerHTML = `${clonedTable.outerHTML}`;
    
    document.body.appendChild(wrapper)
    
    console.log('Canvas 測試元素已添加，3 秒後開始轉換')
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    console.log('開始 Canvas 渲染...')
    const canvas = await html2canvas(wrapper, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      logging: true,
      backgroundColor: '#ffffff'
    })
    
    console.log('Canvas 渲染完成:', canvas.width, 'x', canvas.height)
    
    // 創建 PDF
    const pdf = new jsPDF('p', 'mm', 'a4')
    const imgData = canvas.toDataURL('image/jpeg', 0.98)
    
    // 計算適合的尺寸
    const pdfWidth = 210 - 20  // A4 寬度減去邊距
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width
    
    console.log('PDF 尺寸計算:', pdfWidth, 'x', pdfHeight)
    
    pdf.addImage(imgData, 'JPEG', 10, 10, pdfWidth, pdfHeight)
    pdf.save(`${selectedName.value}_Canvas直接轉PDF.pdf`)
    
    console.log('Canvas 直接轉 PDF 完成')
    
    // 清理
    if (document.body.contains(wrapper)) {
      document.body.removeChild(wrapper)
    }
    
    alert('Canvas 直接轉 PDF 成功！這種方法跳過了 html2pdf.js')
    
  } catch (error: any) {
    console.error('Canvas 直接轉 PDF 錯誤:', error)
    alert('Canvas 直接轉 PDF 失敗：' + (error?.message || error))
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
