# dynamic_table_builder_vue3_ssr

本專案為 Vite + Vue3 + TypeScript + SSR 架構，支援伺服器端渲染（Server-Side Rendering），可串接 .NET API。

## 主要特點
- Vite 官方 SSR 架構
- Vue3 + TypeScript
- 可直接串接 .NET API
- 保留原 SPA 專案所有元件、樣式、型別

## 啟動方式
1. 安裝依賴：
   ```sh
   npm install
   ```
2. 啟動 SSR 伺服器（開發模式）：
   ```sh
   node server.js
   ```
3. 瀏覽器開啟 http://localhost:5173

## 目錄結構
- `src/entry-client.ts`：瀏覽器端入口
- `src/entry-server.ts`：伺服器端入口
- `server.js`：Node SSR 伺服器

## 參考
- [Vite SSR 官方文件](https://vitejs.dev/guide/ssr.html)
- [Vue 官方 SSR](https://ssr.vuejs.org/)
