# dynamic_table_builder_vue3

本專案以 Vue 3 + Vite + TypeScript 重構原有多表格產生器，包含：
- 多表格產生器（builder）
- 預覽/匯出/儲存
- Palette 拖放與自訂
- 暫存/完成區（saved area）
- 支援 cell 樣式（align/color/size）、索引欄自動排序、名稱清單維護等

## 開發啟動

```powershell
npm install
npm run dev
```

## 目標
- 將原 dynamic_table_builder_multi.html、inspection_form_builder_preview_multi.html、inspection_form_saved_area_multi.html 功能模組化為 Vue 元件
- 支援多表格建立、儲存、讀取、palette 拖放、cell 樣式、索引欄自動排序、暫存/完成區等

## 專案結構建議
- `src/components/`：多表格產生器、Palette、SavedArea、TablePreview 等元件
- `src/views/`：主頁、預覽頁、儲存區頁
- `src/utils/`：localStorage、資料轉換、樣式處理等工具

---

如需將原有 HTML/JS 功能搬移，請參考原始檔案並以 Vue 3 標準方式重構。
