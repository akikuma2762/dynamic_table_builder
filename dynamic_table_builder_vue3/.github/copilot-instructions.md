<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

本專案為 Vue 3 + Vite + TypeScript，目標將原有多表格產生器（dynamic_table_builder_multi.html）、builder/preview（inspection_form_builder_preview_multi.html）、saved area（inspection_form_saved_area_multi.html）重構為 Vue 元件。

- 請優先使用 Composition API 與 <script setup>。
- 請將多表格產生器、palette、暫存/完成區等功能模組化為獨立元件。
- 儲存/讀取/下拉選單/索引欄/欄位樣式等邏輯需與原版一致。
- 請避免 jQuery，優先使用 Vue 3 標準寫法。
- 請將 palette 拖放、cell 樣式、索引欄自動排序等功能以現代 Vue 方式實作。
- 請將本專案所有元件、邏輯、型別、狀態管理皆以可維護、可擴充為原則設計。
