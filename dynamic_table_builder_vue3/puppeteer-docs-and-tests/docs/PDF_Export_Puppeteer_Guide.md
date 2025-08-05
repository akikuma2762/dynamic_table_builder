# PDF 匯出功能 - Puppeteer 實作指南

## 📋 概述

本文件詳細說明動態表格建構器中 Puppeteer PDF 匯出功能的實作、修改內容和使用方式。此功能提供高品質的 HTML 轉 PDF 解決方案，支援複雜表格結構、多語言內容和文字格式處理。

## 🔧 主要修改內容

### 1. 表格渲染邏輯修正

#### 原問題
- 表頭儲存格消失或顯示不正確
- 合併儲存格 (colspan/rowspan) 處理錯誤
- 英文文字內容丟失

#### 解決方案
```typescript
// 修正前：使用複雜的 calculateVisibleCells 邏輯
// 修正後：直接渲染所有儲存格，與 Vue 組件保持一致

config.headerRows.forEach(row => {
  html += '<tr style="height: 40px;">'
  
  row.forEach(cell => {
    // 修正 colspan 邏輯：只在 > 1 時才添加屬性
    const colspan = cell.colspan && cell.colspan > 1 ? ` colspan="${cell.colspan}"` : ''
    const rowspan = cell.rowspan && cell.rowspan > 1 ? ` rowspan="${cell.rowspan}"` : ''
    
    // 包含中英文文字內容
    const cellContent = getCellDisplayText(cell.text, cell.en)
    html += `<th style="${style}"${colspan}${rowspan}>${cellContent}</th>`
  })
  html += '</tr>'
})
```

### 2. 雙語顯示功能

#### 新增功能
```typescript
/**
 * 取得儲存格顯示文字（包含中英文）
 * @param {string} text - 中文文字
 * @param {string} en - 英文文字
 * @returns {string} 格式化的顯示文字
 */
function getCellDisplayText(text: string, en: string): string {
  // 處理主文字中的換行符號
  const processedText = processTextWithLineBreaks(text) || '&nbsp;'
  
  if (en) {
    // 也處理英文文字中的換行符號
    const processedEn = processTextWithLineBreaks(en)
    return `${processedText}<br><small>${processedEn}</small>`
  }
  return processedText
}
```

#### 顯示效果
- **中文內容**：正常大小字體
- **英文內容**：小字體，顯示在中文下方
- **換行處理**：兩種語言都支援 `\n` 轉 `<br>` 換行

### 3. 換行符號處理

#### 新增功能
```typescript
/**
 * 處理文字內容中的換行符號
 * @param {string} text - 原始文字
 * @returns {string} 處理後的 HTML 文字
 */
function processTextWithLineBreaks(text: string): string {
  if (!text) return ''
  // 將 \n 換行符號轉換為 HTML <br> 標籤
  return text.replace(/\n/g, '<br>')
}
```

#### 應用場景
- 長文字描述的多行顯示
- 技術規格的分段說明
- 多項目列表的逐行顯示

### 4. 儲存格覆蓋檢測

#### 修正邏輯
```typescript
/**
 * 檢查資料列中的儲存格是否被 colspan/rowspan 覆蓋
 */
function isCellCoveredInData(r: number, c: number, config: TableConfig): boolean {
  if (!config.dataRowsCfg || config.dataRowsCfg.length === 0) {
    return false
  }
  
  const rows = config.dataRowsCfg.length
  const cols = config.dataRowsCfg[0].cells.length
  let occ = Array.from({ length: rows }, () => Array(cols).fill(false))
  
  // 標記所有被合併儲存格覆蓋的位置
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      if (occ[i][j]) continue
      const cell = config.dataRowsCfg[i].cells[j]
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
```

#### 解決問題
- ✅ 合併儲存格不會重複渲染
- ✅ 被覆蓋的儲存格正確跳過
- ✅ 與 Vue 組件渲染行為一致

### 5. 樣式優化

#### 表格樣式
```css
table {
  border-collapse: collapse;
  width: 100%;
  font-family: Microsoft JhengHei, PingFang TC, sans-serif;
  border: 1px solid #ccc;
  background-color: white;
  table-layout: auto;
}
```

#### 儲存格樣式
```css
td {
  padding: 8px;
  text-align: center;
  background-color: #ffffff;
  border: 1px solid #ccc;
  min-height: 35px;
  vertical-align: top;          /* 多行內容頂部對齊 */
  word-wrap: break-word;        /* 長單字自動換行 */
  white-space: pre-wrap;        /* 保留換行格式 */
}
```

## 🚀 使用方式

### 1. 匯出單一表格

```typescript
import { exportSingleTableWithPuppeteer } from '@/utils/pdfExportPuppeteer'

// 匯出當前表格
await exportSingleTableWithPuppeteer(
  tableConfig,           // TableConfig 物件
  'my_table.pdf',       // 檔案名稱
  1                     // 表格索引（可選）
)
```

### 2. 匯出多個表格

```typescript
import { exportAllTablesWithPuppeteer } from '@/utils/pdfExportPuppeteer'

// 匯出所有表格
await exportAllTablesWithPuppeteer(
  tableMultiFile,       // TableMultiFile 物件
  'all_tables.pdf'      // 檔案名稱
)
```

### 3. 預覽 HTML（除錯用）

```typescript
import { previewTableHTML, previewAllTablesHTML } from '@/utils/pdfExportPuppeteer'

// 預覽單一表格 HTML
const singleHTML = previewTableHTML(tableConfig, 1)
console.log(singleHTML)

// 預覽多表格 HTML
const allHTML = previewAllTablesHTML(tableMultiFile)
console.log(allHTML)
```

## 🔄 降級策略

### 三層降級方案

1. **優先：本地 Puppeteer**
   ```typescript
   // 嘗試使用本地安裝的 Puppeteer
   await exportWithPuppeteerNode(fullHTML, filename)
   ```

2. **次選：API 服務**
   ```typescript
   // 調用後端 Puppeteer API 服務
   await exportWithPuppeteerAPI(fullHTML, filename)
   ```

3. **保底：瀏覽器列印**
   ```typescript
   // 使用瀏覽器內建列印功能
   await exportWithBrowserPrint(fullHTML, filename)
   ```

### 環境檢測

```typescript
function isNodeEnvironment(): boolean {
  return typeof (globalThis as any).process !== 'undefined' && 
         (globalThis as any).process.versions && 
         (globalThis as any).process.versions.node
}
```

## 📦 依賴安裝

### Node.js 環境
```bash
# 安裝 Puppeteer（可選，用於最佳效果）
npm install puppeteer

# 或使用較輕量的版本
npm install puppeteer-core
```

### 後端 API 服務
如果需要建立後端 API 服務：

```javascript
// server.js
const express = require('express')
const puppeteer = require('puppeteer')
const app = express()

app.post('/api/generate-pdf', async (req, res) => {
  const { html, options } = req.body
  
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  
  await page.setContent(html)
  const pdf = await page.pdf(options)
  
  await browser.close()
  
  res.setHeader('Content-Type', 'application/pdf')
  res.send(pdf)
})
```

## 🧪 測試與驗證

### 1. 測試複雜表格結構

```javascript
// 測試資料：包含合併儲存格和多語言內容
const testConfig = {
  headerRows: [
    [
      { text: "設備型號", en: "Model", colspan: 2 },
      { text: "規格", en: "Specification", rowspan: 2 }
    ]
  ],
  dataRowsCfg: [
    {
      cells: [
        { text: "MAZAK\nVP02057813", align: "center" },
        { text: "特殊要求\nSpecial Request", colspan: 2 }
      ]
    }
  ]
}
```

### 2. 驗證換行功能

```javascript
// 測試換行符號處理
const textWithLineBreaks = "第一行\n第二行\n第三行"
const processed = processTextWithLineBreaks(textWithLineBreaks)
// 結果：第一行<br>第二行<br>第三行
```

### 3. 檢查雙語顯示

```javascript
// 測試中英文混合顯示
const cellDisplay = getCellDisplayText("設備型號", "Equipment Model")
// 結果：設備型號<br><small>Equipment Model</small>
```

## 🐛 常見問題與解決方案

### 1. Puppeteer 安裝失敗

**問題**：`npm install puppeteer` 失敗或下載 Chromium 超時

**解決方案**：
```bash
# 使用淘寶鏡像
npm config set puppeteer_download_host=https://npm.taobao.org/mirrors
npm install puppeteer

# 或跳過 Chromium 下載，使用系統 Chrome
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true npm install puppeteer
```

### 2. 字體顯示問題

**問題**：PDF 中中文字體顯示異常

**解決方案**：
```css
/* 使用系統字體 fallback */
font-family: 'Microsoft JhengHei', 'PingFang TC', 'Noto Sans TC', sans-serif;
```

### 3. 表格過寬問題

**問題**：表格寬度超出 A4 頁面

**解決方案**：
```css
/* 添加響應式表格樣式 */
table {
  table-layout: auto;
  max-width: 100%;
}

td {
  word-wrap: break-word;
  max-width: 200px;
}
```

## 📊 效能最佳化

### 1. 記憶體管理

```typescript
// 確保 Puppeteer 資源正確釋放
try {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  
  // ... PDF 生成邏輯
  
} finally {
  if (browser) {
    await browser.close()  // 重要：釋放瀏覽器資源
  }
}
```

### 2. 批次處理

```typescript
// 對於大量表格，考慮分批處理
const batchSize = 10
for (let i = 0; i < configs.length; i += batchSize) {
  const batch = configs.slice(i, i + batchSize)
  await processBatch(batch)
}
```

## 🔮 未來改進方向

1. **支援更多輸出格式**：Word、Excel 等
2. **表格樣式自訂**：用戶可調整顏色、字體等
3. **浮水印功能**：添加公司 Logo 或版權資訊
4. **分頁控制**：自動分頁或手動分頁點
5. **快取機制**：重複表格結構的快取最佳化

## 📞 技術支援

如有問題或建議，請聯繫開發團隊或在 GitHub 上提交 Issue。

---

**最後更新**：2025年8月5日  
**版本**：v1.0.0  
**維護者**：開發團隊
