/**
 * PDF 匯出工具 - 使用 Puppeteer (最佳品質)
 * 這是一個使用 Puppeteer 的 PDF 匯出實現，提供最佳的 HTML 渲染品質
 */

import type { TableConfig, TableMultiFile } from '../types/table'

/**
 * 計算表格的實際欄位數量和寬度
 * @param {TableConfig} config - 表格配置
 * @returns {{totalCols: number, colWidths: string[]}} 欄位資訊
 */
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

/**
 * 表格配置轉 HTML
 * @param {TableConfig} config - 表格配置
 * @returns {string} HTML 字串
 */
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
  
  // 表頭 - 直接渲染所有儲存格，就像 Vue 組件一樣
  config.headerRows.forEach(row => {
    html += '<tr style="height: 40px;">'
    
    row.forEach(cell => {
      // 修正 colspan 邏輯：與 Vue 組件保持一致，只在 > 1 時才添加
      const colspan = cell.colspan && cell.colspan > 1 ? ` colspan="${cell.colspan}"` : ''
      const rowspan = cell.rowspan && cell.rowspan > 1 ? ` rowspan="${cell.rowspan}"` : ''
      const bgColor = cell.bg || '#f5f5f5'
      const textAlign = cell.align || 'center'
      const fontSize = cell.size ? `${cell.size}px` : '12px'
      const textColor = cell.color || '#000'
      const style = `padding: 8px; text-align: ${textAlign}; font-weight: bold; background-color: ${bgColor}; border: 1px solid #ccc; height: 40px; vertical-align: middle; font-size: ${fontSize}; color: ${textColor};`
      
      // 修正：包含中文和英文文字內容
      const cellContent = getCellDisplayText(cell.text, cell.en)
      html += `<th style="${style}"${colspan}${rowspan}>${cellContent}</th>`
    })
    html += '</tr>'
  })
  
  // 資料列 - 使用 Vue 組件相同的邏輯，跳過被覆蓋的儲存格
  config.dataRowsCfg.forEach((row, rowIndex) => {
    html += '<tr style="height: 35px;">'
    
    row.cells.forEach((cell, cellIndex) => {
      // 檢查這個儲存格是否被覆蓋（類似 Vue 組件的 isCellCovered）
      if (!isCellCoveredInData(rowIndex, cellIndex, config)) {
        // 修正 colspan 邏輯：與 Vue 組件保持一致，只在 > 1 時才添加
        const colspan = cell.colspan && cell.colspan > 1 ? ` colspan="${cell.colspan}"` : ''
        const rowspan = cell.rowspan && cell.rowspan > 1 ? ` rowspan="${cell.rowspan}"` : ''
        
        // 修正顏色邏輯：優先順序 cell.bg > row.color > config.dataBg
        // 注意：這裡需要區分 cell.color (文字顏色) 和背景色
        // 假設 row.color 是背景色，cell.color 是文字顏色
        const bgColor = row.color || config.dataBg || '#ffffff'
        const textAlign = cell.align || 'center'
        const fontSize = cell.size ? `${cell.size}px` : '12px'
        const textColor = cell.color || '#000'
        const style = `padding: 8px; text-align: ${textAlign}; background-color: ${bgColor}; border: 1px solid #ccc; min-height: 35px; vertical-align: top; font-size: ${fontSize}; color: ${textColor}; word-wrap: break-word; white-space: pre-wrap;`
        
        // 處理資料列文字中的換行符號
        const cellText = processTextWithLineBreaks(cell.text || '')
        html += `<td style="${style}"${colspan}${rowspan}>${cellText}</td>`
      }
    })
    html += '</tr>'
  })
  
  html += '</table>'
  return html
}

/**
 * 檢查資料列中的儲存格是否被 colspan/rowspan 覆蓋
 * @param {number} r - 行索引
 * @param {number} c - 列索引
 * @param {TableConfig} config - 表格配置
 * @returns {boolean} 是否被覆蓋
 */
function isCellCoveredInData(r: number, c: number, config: TableConfig): boolean {
  if (!config.dataRowsCfg || config.dataRowsCfg.length === 0) {
    return false
  }
  
  const rows = config.dataRowsCfg.length
  const cols = config.dataRowsCfg[0].cells.length
  let occ = Array.from({ length: rows }, () => Array(cols).fill(false))
  
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

/**
 * 創建表格容器 HTML
 * @param {TableConfig} config - 表格配置
 * @param {number} tableIndex - 表格索引
 * @returns {string} 完整的 HTML 容器
 */
function createTableContainer(config: TableConfig, tableIndex: number): string {
  return `<div style="font-family: Microsoft JhengHei, PingFang TC, sans-serif; font-size: 12px; color: #000; background-color: white; margin: 0; padding: 15px; width: 100%; box-sizing: border-box; min-height: 100px;">
<h3 style="color: #333; margin: 0 0 15px 0; font-size: 14px; background-color: transparent;">表格 ${tableIndex}</h3>
${tableConfigToHtml(config)}
</div>`
}

/**
 * 創建完整的 HTML 頁面
 * @param {string} content - 內容 HTML
 * @returns {string} 完整的 HTML 頁面
 */
function createFullHTMLPage(content: string): string {
  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>表格 PDF</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700&display=swap');
        
        * {
            box-sizing: border-box;
        }
        
        body {
            margin: 0;
            padding: 20px;
            font-family: 'Noto Sans TC', 'Microsoft JhengHei', 'PingFang TC', sans-serif;
            background-color: white;
            color: #000;
            line-height: 1.4;
            font-size: 12px;
        }
        
        .page-break {
            page-break-before: always;
        }
        
        table {
            border-collapse: collapse;
            width: 100%;
            margin-bottom: 20px;
            table-layout: auto;
        }
        
        th, td {
            border: 1px solid #ccc;
            padding: 8px;
            text-align: center;
            vertical-align: middle;
            word-wrap: break-word;
            overflow-wrap: break-word;
        }
        
        th {
            font-weight: bold;
            background-color: #f5f5f5;
        }
        
        /* 列印專用樣式 */
        @media print {
            @page {
                size: A4;
                margin: 20mm 15mm;
            }
            
            body {
                padding: 0;
                font-size: 11px;
            }
            
            .page-break {
                page-break-before: always;
            }
            
            table {
                margin-bottom: 15px;
            }
            
            th, td {
                padding: 6px;
                font-size: 10px;
            }
            
            /* 確保表格內容不會被截斷 */
            tr {
                page-break-inside: avoid;
            }
            
            /* 列印時隱藏不必要的元素 */
            .no-print {
                display: none !important;
            }
        }
        
        /* 手動列印提示 */
        .print-instructions {
            background-color: #e3f2fd;
            border: 1px solid #1976d2;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 4px;
            font-size: 14px;
        }
        
        .print-instructions h4 {
            margin: 0 0 10px 0;
            color: #1976d2;
        }
        
        .print-instructions ul {
            margin: 10px 0;
            padding-left: 20px;
        }
        
        .print-instructions li {
            margin: 5px 0;
        }
    </style>
</head>
<body>
    <div class="print-instructions no-print">
        <h4>🖨️ 列印說明</h4>
        <p>請按照以下步驟將此頁面儲存為 PDF：</p>
        <ul>
            <li><strong>Chrome/Edge：</strong> 按 Ctrl+P → 目的地選擇「另存為 PDF」→ 版面配置選擇「直向」→ 列印</li>
            <li><strong>Firefox：</strong> 按 Ctrl+P → 目的地選擇「另存為 PDF」→ 列印</li>
            <li><strong>Safari：</strong> 按 Cmd+P → PDF 下拉選單 → 另存為 PDF</li>
        </ul>
        <p><strong>建議設定：</strong> 紙張大小 A4，邊距 1.5cm，包含背景圖形</p>
    </div>
    
    ${content}
</body>
</html>`
}

/**
 * 檢查是否可以使用 Puppeteer
 * @returns {boolean} 是否可以使用 Puppeteer
 */
function canUsePuppeteer(): boolean {
  // 在 Node.js 環境中，或者在 Vite 開發環境中（因為它有 Node.js 後端）
  return typeof (globalThis as any).process !== 'undefined' || 
         (typeof window !== 'undefined' && (window as any).__VITE_DEV__)
}

/**
 * 檢查是否在 Node.js 環境中
 * @returns {boolean} 是否為 Node.js 環境
 */
function isNodeEnvironment(): boolean {
  return typeof (globalThis as any).process !== 'undefined' && 
         (globalThis as any).process.versions && 
         (globalThis as any).process.versions.node
}

/**
 * 使用 Puppeteer 匯出 PDF
 * @param {string} htmlContent - HTML 內容
 * @param {string} filename - 檔案名稱
 * @returns {Promise<void>}
 */
async function exportWithPuppeteerNode(htmlContent: string, filename: string): Promise<void> {
  try {
    // 動態載入 puppeteer
    let puppeteer: any
    try {
      // 使用字符串來避免編譯時檢查
      const puppeteerModule = 'puppeteer'
      puppeteer = await import(/* webpackIgnore: true */ puppeteerModule)
    } catch (importError) {
      throw new Error('無法載入 Puppeteer，請確保已安裝: npm install puppeteer')
    }
    
    console.log('🚀 啟動 Puppeteer...')
    const browser = await (puppeteer.default || puppeteer).launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    })
    
    const page = await browser.newPage()
    
    // 設置頁面大小為 A4
    await page.setViewport({ width: 794, height: 1123 }) // A4 size in pixels at 96 DPI
    
    // 載入 HTML 內容
    await page.setContent(htmlContent, { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    })
    
    console.log('📄 生成 PDF...')
    
    // 生成 PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        bottom: '20mm',
        left: '15mm',
        right: '15mm'
      }
    })
    
    await browser.close()
    
    // 下載檔案
    const blob = new Blob([pdfBuffer], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    console.log(`🎉 PDF 匯出完成: ${filename}`)
    
  } catch (error) {
    console.error('❌ Puppeteer PDF 匯出失敗:', error)
    throw error
  }
}

/**
 * 瀏覽器環境的替代方案 - 使用瀏覽器列印功能
 * @param {string} htmlContent - HTML 內容
 * @param {string} filename - 檔案名稱
 * @returns {Promise<void>}
 */
async function exportWithBrowserPrint(htmlContent: string, filename: string): Promise<void> {
  try {
    console.log('🖨️ 使用瀏覽器列印功能...')
    
    // 創建新視窗來預覽和列印
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      throw new Error('無法開啟列印視窗，請檢查彈出視窗設定')
    }
    
    printWindow.document.write(htmlContent)
    printWindow.document.close()
    
    // 等待內容載入完成
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.print()
        printWindow.close()
      }, 500)
    }
    
    console.log(`🎉 已開啟列印預覽視窗: ${filename}`)
    
  } catch (error) {
    console.error('❌ 瀏覽器列印失敗:', error)
    throw error
  }
}

/**
 * 匯出全部表格為 PDF (使用 Puppeteer)
 * @param {TableMultiFile} tableData - 表格資料
 * @param {string} filename - 檔案名稱
 * @returns {Promise<void>}
 */
export async function exportAllTablesWithPuppeteer(
  tableData: TableMultiFile,
  filename: string = 'tables_puppeteer.pdf'
): Promise<void> {
  try {
    console.log(`📚 開始處理 ${tableData.configs.length} 個表格`)
    
    let htmlContent = ''
    
    for (let i = 0; i < tableData.configs.length; i++) {
      const config = tableData.configs[i]
      console.log(`🔄 處理表格 ${i + 1}/${tableData.configs.length}`)
      
      const tableHTML = createTableContainer(config, i + 1)
      
      // 如果不是第一個表格，添加分頁符
      if (i > 0) {
        htmlContent += '<div class="page-break"></div>'
      }
      
      htmlContent += tableHTML
    }
    
    const fullHTML = createFullHTMLPage(htmlContent)
    
    // 嘗試使用不同的方法，優雅降級
    try {
      // 優先嘗試使用本地安裝的 Puppeteer
      console.log('🔧 嘗試使用本地 Puppeteer...')
      await exportWithPuppeteerNode(fullHTML, filename)
    } catch (puppeteerError) {
      console.warn('本地 Puppeteer 不可用，使用瀏覽器列印功能作為替代方案:', puppeteerError)
      
      // 詢問用戶是否要使用列印預覽
      const useBackupMethod = confirm(
        'Puppeteer 不可用。\n\n' +
        '是否要使用瀏覽器列印功能作為替代方案？\n' +
        '這將開啟一個新視窗，您可以在瀏覽器中列印或儲存為 PDF。\n\n' +
        '點擊「確定」繼續，或「取消」中止匯出。'
      )
      
      if (useBackupMethod) {
        await exportWithBrowserPrint(fullHTML, filename)
      } else {
        throw new Error('用戶取消匯出操作')
      }
    }
    
  } catch (error) {
    console.error('❌ PDF 匯出失敗:', error)
    throw error
  }
}

/**
 * 匯出單一表格為 PDF (使用 Puppeteer)
 * @param {TableConfig} config - 表格配置
 * @param {string} filename - 檔案名稱
 * @param {number} tableIndex - 表格索引
 * @returns {Promise<void>}
 */
export async function exportSingleTableWithPuppeteer(
  config: TableConfig,
  filename: string = 'table_puppeteer.pdf',
  tableIndex: number = 1
): Promise<void> {
  try {
    console.log(`🔄 處理單一表格 ${tableIndex}`)
    
    const tableHTML = createTableContainer(config, tableIndex)
    const fullHTML = createFullHTMLPage(tableHTML)
    
    // 嘗試使用不同的方法，優雅降級
    try {
      // 優先嘗試使用本地安裝的 Puppeteer
      console.log('🔧 嘗試使用本地 Puppeteer...')
      await exportWithPuppeteerNode(fullHTML, filename)
    } catch (puppeteerError) {
      console.warn('本地 Puppeteer 不可用，使用瀏覽器列印功能作為替代方案:', puppeteerError)
      
      // 詢問用戶是否要使用列印預覽
      const useBackupMethod = confirm(
        'Puppeteer 不可用。\n\n' +
        '是否要使用瀏覽器列印功能作為替代方案？\n' +
        '這將開啟一個新視窗，您可以在瀏覽器中列印或儲存為 PDF。\n\n' +
        '點擊「確定」繼續，或「取消」中止匯出。'
      )
      
      if (useBackupMethod) {
        await exportWithBrowserPrint(fullHTML, filename)
      } else {
        throw new Error('用戶取消匯出操作')
      }
    }
    
  } catch (error) {
    console.error('❌ PDF 匯出失敗:', error)
    throw error
  }
}

/**
 * 預覽 HTML 內容 (除錯用)
 * @param {TableConfig} config - 表格配置
 * @param {number} tableIndex - 表格索引
 * @returns {string} HTML 內容
 */
export function previewTableHTML(config: TableConfig, tableIndex: number = 1): string {
  const tableHTML = createTableContainer(config, tableIndex)
  return createFullHTMLPage(tableHTML)
}

/**
 * 預覽多表格 HTML 內容 (除錯用)
 * @param {TableMultiFile} tableData - 表格資料
 * @returns {string} HTML 內容
 */
export function previewAllTablesHTML(tableData: TableMultiFile): string {
  let htmlContent = ''
  
  for (let i = 0; i < tableData.configs.length; i++) {
    const config = tableData.configs[i]
    const tableHTML = createTableContainer(config, i + 1)
    
    if (i > 0) {
      htmlContent += '<div class="page-break"></div>'
    }
    
    htmlContent += tableHTML
  }
  
  return createFullHTMLPage(htmlContent)
}
