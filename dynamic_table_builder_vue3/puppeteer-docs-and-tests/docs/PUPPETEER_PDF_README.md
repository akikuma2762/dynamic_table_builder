# Puppeteer PDF 匯出工具使用說明

## 概述
這是一個使用 Puppeteer 的 PDF 匯出工具，提供最佳的 HTML 渲染品質和表格樣式支援。

## 功能特點
- ✅ 完美支援 CSS 樣式，包括 colgroup 欄位寬度
- ✅ 高品質的字體渲染
- ✅ 準確的顏色和背景處理
- ✅ 自動分頁處理
- ✅ A4 紙張格式優化
- ✅ 支援繁體中文字體

## 使用環境

### 瀏覽器環境（推薦）
在瀏覽器中使用時，工具會嘗試調用後端 API 服務來生成 PDF。

### Node.js 環境
如果在 Node.js 環境中運行，需要安裝 Puppeteer：

```bash
npm install puppeteer
```

## 安裝 Puppeteer（可選）

如果您想要在本地 Node.js 環境中使用 Puppeteer：

```bash
# 安裝 Puppeteer
npm install puppeteer

# 或使用 yarn
yarn add puppeteer
```

## API 服務設置（瀏覽器環境）

如果您想要在瀏覽器環境中使用此工具，需要設置一個後端 API 服務。

### Express.js 示例

創建 `server.js`：

```javascript
const express = require('express')
const puppeteer = require('puppeteer')
const app = express()

app.use(express.json({ limit: '50mb' }))

app.post('/api/generate-pdf', async (req, res) => {
  try {
    const { html, options } = req.body
    
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: 'networkidle0' })
    
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '15mm',
        right: '15mm'
      },
      ...options
    })
    
    await browser.close()
    
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 'attachment; filename=table.pdf')
    res.send(pdfBuffer)
    
  } catch (error) {
    console.error('PDF 生成錯誤:', error)
    res.status(500).json({ error: error.message })
  }
})

app.listen(3001, () => {
  console.log('PDF 服務運行在 http://localhost:3001')
})
```

啟動服務：

```bash
node server.js
```

## 使用方法

### 在 Vue 組件中使用

```javascript
import { exportAllTablesWithPuppeteer, exportSingleTableWithPuppeteer } from '../utils/pdfExportPuppeteer'

// 匯出多表格
await exportAllTablesWithPuppeteer(tableData, 'tables.pdf')

// 匯出單表格
await exportSingleTableWithPuppeteer(config, 'table.pdf', 1)
```

### 預覽 HTML（除錯用）

```javascript
import { previewTableHTML, previewAllTablesHTML } from '../utils/pdfExportPuppeteer'

// 預覽單表格 HTML
const htmlContent = previewTableHTML(config, 1)
console.log(htmlContent)

// 預覽多表格 HTML
const allHtmlContent = previewAllTablesHTML(tableData)
console.log(allHtmlContent)
```

## 注意事項

1. **字體支援**：工具使用 Google Fonts 的 Noto Sans TC 作為繁體中文字體，確保良好的顯示效果。

2. **網路連線**：如果使用 Google Fonts，需要確保有網路連線。

3. **記憶體使用**：Puppeteer 會消耗較多記憶體，特別是處理大型表格時。

4. **安全性**：在生產環境中使用 API 服務時，請注意安全性設置，避免 XSS 攻擊。

## 疑難排解

### 常見問題

**Q: 在瀏覽器中顯示 "Puppeteer 需要在 Node.js 環境中運行"**
A: 這是正常的，工具會自動嘗試使用 API 服務。確保您的後端 API 服務正在運行。

**Q: 字體顯示不正常**
A: 檢查網路連線，確保可以訪問 Google Fonts。或者使用本地字體。

**Q: PDF 品質不佳**
A: Puppeteer 通常提供最佳品質。如果有問題，可以調整 PDF 生成選項。

**Q: 表格寬度不正確**
A: 確保 TableConfig 中的 width 屬性設置正確，工具會使用 colgroup 來控制欄位寬度。

## 開發者選項

### 自定義 PDF 選項

您可以修改 `pdfExportPuppeteer.ts` 中的 PDF 生成選項：

```javascript
const pdfBuffer = await page.pdf({
  format: 'A4',           // 紙張格式
  printBackground: true,  // 列印背景
  margin: {               // 邊距設置
    top: '20mm',
    bottom: '20mm',
    left: '15mm',
    right: '15mm'
  },
  // 其他選項...
})
```

### 自定義樣式

修改 `createFullHTMLPage` 函數中的 CSS 樣式來自定義外觀。

## 版本資訊

- 版本：1.0.0
- 建立日期：2025年8月5日
- 相容性：Vue 3, TypeScript, Puppeteer
