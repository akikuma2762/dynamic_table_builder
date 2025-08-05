# Puppeteer 相關文件與測試集合

此資料夾集中管理所有與 Puppeteer PDF 匯出功能相關的文件和測試檔案。

## 📁 資料夾結構

```
puppeteer-docs-and-tests/
├── docs/           # 說明文件
│   ├── PUPPETEER_PDF_README.md
│   ├── PDF_Export_Puppeteer_Guide.md
│   └── COLSPAN_FIX_REPORT.md
├── tests/          # 測試檔案
│   ├── puppeteer_colspan_test.html
│   ├── test_colspan_debug.html
│   ├── colspan_diagnostic.html
│   ├── colspan_debug_tracker.html
│   ├── vue_real_data_test.html
│   ├── vue_colspan_logic_test.html
│   ├── real_data_linebreak_test.html
│   └── linebreak_test.html
└── README.md       # 本檔案
```

## 📚 文件說明

### docs/ - 說明文件
- **PUPPETEER_PDF_README.md** - Puppeteer PDF 匯出工具使用說明
- **PDF_Export_Puppeteer_Guide.md** - PDF 匯出功能 Puppeteer 實作指南
- **COLSPAN_FIX_REPORT.md** - Colspan 修正報告，包含問題分析和解決方案

### tests/ - 測試檔案
- **puppeteer_colspan_test.html** - Puppeteer Colspan 功能專門測試
- **test_colspan_debug.html** - 基本 Colspan 測試和偵錯
- **colspan_diagnostic.html** - Colspan 診斷工具
- **colspan_debug_tracker.html** - Colspan 偵錯追蹤器
- **vue_real_data_test.html** - Vue 真實資料結構測試
- **vue_colspan_logic_test.html** - Vue Colspan 邏輯測試
- **real_data_linebreak_test.html** - 真實資料換行處理測試
- **linebreak_test.html** - 一般換行功能測試

## 🎯 使用目的

1. **集中管理** - 所有 Puppeteer 相關的文件和測試都在此資料夾
2. **問題追蹤** - 記錄 PDF 匯出和表格處理的問題解決過程
3. **測試驗證** - 提供完整的測試套件驗證功能正確性
4. **文件維護** - 統一的文件管理和版本控制

## 🔧 核心功能

- PDF 匯出（使用 Puppeteer）
- 表格 Colspan 處理
- 中文字體支援
- 換行和格式處理
- Vue.js 整合測試

## 📝 維護說明

- 新增 Puppeteer 相關檔案時，請放置在適當的子資料夾
- 更新功能時，請同步更新相關的測試檔案
- 重要的修正和改進請記錄在相應的說明文件中

---

**建立日期**: 2025-08-05
**用途**: Puppeteer PDF 匯出功能開發與測試
**維護者**: 專案團隊
