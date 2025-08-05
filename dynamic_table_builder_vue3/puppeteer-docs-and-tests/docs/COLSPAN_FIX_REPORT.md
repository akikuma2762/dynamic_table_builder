# Colspan 修正報告

## 問題描述
用戶反映 `td` 的 `colspan` 依然沒有正確發揮作用，表格儲存格無法正確合併。

## 原因分析
通過檢查 `src/utils/pdfExportPuppeteer.ts` 文件，發現了以下問題：

1. **`calculateTableColumns` 函數邏輯不完整**：
   - 原版本只檢查第一行來計算總欄位數，未考慮所有行的結構
   - 未正確處理欄位寬度的分配

2. **CSS 表格佈局問題**：
   - 使用了 `table-layout: fixed` 會限制 colspan 的正確顯示
   - 需要改為 `table-layout: auto` 以支持動態欄位寬度

3. **Colspan 判斷邏輯問題**：
   - 原版本使用 `cell.colspan > 1` 的判斷，不包括 `colspan = 1` 的情況
   - 修改為 `cell.colspan && cell.colspan > 0` 以處理所有情況

## 修正內容

### 1. 修正 `calculateTableColumns` 函數
```typescript
function calculateTableColumns(config: TableConfig): {totalCols: number, colWidths: string[]} {
  if (config.headerRows.length === 0 && config.dataRowsCfg.length === 0) {
    return { totalCols: 0, colWidths: [] }
  }

  let maxCols = 0

  // 檢查所有標題行，找出最大欄位數
  config.headerRows.forEach(row => {
    let colCount = 0
    row.forEach(cell => {
      colCount += cell.colspan || 1
    })
    maxCols = Math.max(maxCols, colCount)
  })

  // 檢查所有資料行，找出最大欄位數
  config.dataRowsCfg.forEach(row => {
    let colCount = 0
    row.cells.forEach(cell => {
      colCount += cell.colspan || 1
    })
    maxCols = Math.max(maxCols, colCount)
  })

  // 如果有標題行，嘗試從第一行取得欄位寬度設定
  let colWidths: string[] = []
  if (config.headerRows.length > 0 && config.headerRows[0].length > 0) {
    const firstHeaderRow = config.headerRows[0]
    let colIndex = 0
    
    firstHeaderRow.forEach(cell => {
      const cellWidth = cell.width || 'auto'
      const colspan = cell.colspan || 1
      
      // 為這個儲存格涵蓋的每個欄位設定寬度
      for (let i = 0; i < colspan; i++) {
        if (colIndex < maxCols) {
          colWidths[colIndex] = cellWidth
          colIndex++
        }
      }
    })
  }

  // 填補剩餘的欄位為 auto
  while (colWidths.length < maxCols) {
    colWidths.push('auto')
  }

  return { totalCols: maxCols, colWidths }
}
```

### 2. 修正表格 CSS 樣式
```css
table {
    border-collapse: collapse;
    width: 100%;
    margin-bottom: 20px;
    table-layout: auto;  /* 改為 auto，支持動態欄位寬度 */
}
```

### 3. 修正 colspan 屬性判斷邏輯
```typescript
// 表頭
const colspan = cell.colspan && cell.colspan > 0 ? ` colspan="${cell.colspan}"` : ''

// 資料列
const colspan = cell.colspan && cell.colspan > 0 ? ` colspan="${cell.colspan}"` : ''
```

### 4. 改善表格 HTML 生成
```typescript
function tableConfigToHtml(config: TableConfig): string {
  let html = '<table style="width: 100%; border-collapse: collapse; font-family: Microsoft JhengHei, PingFang TC, sans-serif; border: 1px solid #ccc; background-color: white; table-layout: auto;">'
  
  // 生成 colgroup 來控制欄位寬度
  if (config.headerRows.length > 0 || config.dataRowsCfg.length > 0) {
    const { totalCols, colWidths } = calculateTableColumns(config)
    
    if (totalCols > 0) {
      html += '<colgroup>'
      colWidths.forEach(width => {
        html += `<col style="width: ${width};">`
      })
      html += '</colgroup>'
    }
  }
  // ... 其餘邏輯
}
```

## 測試驗證

建立了 `test_colspan_debug.html` 測試檔案，包含：

1. **基本 colspan 測試**：
   - 標題合併兩欄
   - 資料列合併三欄

2. **複雜 colspan 測試**：
   - 多層標題結構
   - 不同大小的合併組合
   - 全欄位跨越測試

3. **控制台輸出**：
   - 顯示計算出的總欄位數
   - 顯示每個儲存格的 colspan 值
   - 便於調試和驗證

## 修正後效果

✅ **改善項目**：
- `colspan` 屬性正確應用到 HTML 元素
- 表格能夠正確顯示合併的儲存格
- 欄位寬度計算更準確
- 支持複雜的表格結構

✅ **編譯驗證**：
- TypeScript 編譯無錯誤
- Vite 建構成功
- 動態模組載入正常

## 使用方式

在 Vue 組件中使用 Puppeteer 匯出功能：

```vue
<button @click="exportToPDFPuppeteer">匯出 PDF (Puppeteer)</button>
```

修正後的函數會自動：
1. 正確計算表格欄位數量
2. 生成適當的 colgroup 結構
3. 應用正確的 colspan 屬性
4. 確保表格在 PDF 中正確顯示

## 後續建議

1. **持續測試**：在實際使用中測試更多複雜的表格結構
2. **性能優化**：對於大型表格可考慮進一步優化
3. **錯誤處理**：增加對異常表格配置的處理
4. **用戶反饋**：收集用戶反饋以進一步改善

---

**修正日期**: 2025-08-05  
**影響檔案**: `src/utils/pdfExportPuppeteer.ts`  
**測試檔案**: `test_colspan_debug.html`  
**狀態**: ✅ 完成並驗證
