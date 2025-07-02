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

## 建置與部署

### 本地建置
```powershell
npm run build
```

### IIS 部署
1. 執行 `npm run build` 建置專案
2. 將 `dist` 目錄中的所有內容複製到 IIS 網站根目錄
3. `web.config` 文件已自動包含在建置結果中，使用簡化配置以確保相容性：
   - **僅包含 SPA 路由重寫規則**
   - 避免複雜的 MIME 類型和標頭設定（可能在某些 IIS 環境產生異常）
   - 確保 Vue Router 的客戶端路由正常工作

**注意**：web.config 使用最簡化的配置，經測試可在 IIS 環境正常運行。

### API 串接
專案已全面改為 API 串接，需要後端 .NET Core 8 API 支援：
- `http://localhost:81/api/DynamicTableMulti` - 多表格建立器 CRUD
- `http://localhost:81/api/PreviewTableMulti` - 預覽表格 CRUD
- `http://localhost:81/api/MultiTableSavedArea` - 暫存區 CRUD

## 目標
- 將原 dynamic_table_builder_multi.html、inspection_form_builder_preview_multi.html、inspection_form_saved_area_multi.html 功能模組化為 Vue 元件
- 支援多表格建立、儲存、讀取、palette 拖放、cell 樣式、索引欄自動排序、暫存/完成區等
- 完全替代 localStorage，改用 .NET Core 8 API

## 專案結構
- `src/components/`：多表格產生器、Palette、SavedArea、TablePreview 等元件
- `src/views/`：主頁、預覽頁、儲存區頁
- `src/utils/`：API 串接、資料轉換、樣式處理等工具
- `src/types/`：TypeScript 型別定義
- `public/web.config`：IIS 部署設定文件

## 技術特色
- Vue 3 Composition API + `<script setup>`
- TypeScript 完整型別支援
- Vite 快速開發與建置
- Axios API 串接
- IIS 自動部署支援

---

如需將原有 HTML/JS 功能搬移，請參考原始檔案並以 Vue 3 標準方式重構。
