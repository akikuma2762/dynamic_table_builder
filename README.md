# 動態欄位表格產生器

這是一個純前端的動態表格產生器，支援多層表頭、動態資料列、欄位合併、色彩自訂與本機儲存。

## 方案架構與檔案關聯

本專案包含三個主要 HTML 工具，彼此透過 localStorage 串接，組成完整的「表格/檢查表設計、編輯、保存、展示」流程：

### 1. `dynamic_table_builder.html`
- 功能：設計表格結構（表頭、資料列、合併、顏色等），並將設定存到 localStorage（key: `dynamicTableJSON`）。
- 產生的資料格式（headerRows, dataRowsCfg）是後續流程的基礎。

### 2. `inspection_form_builder_preview.html`
- 功能：進階「檢查表設計與預覽」工具。
- 會讀取 `dynamicTableJSON`，將表格結構轉為可拖放、可插入元件（checkbox、簽名、文字輸入等）的互動式表格。
- 支援暫存（`saveTableJSON_temp`）與完成（`saveTableJSON_final`）狀態，並可預覽、再編輯。
- 提供 palette（調色盤）功能，可自訂常用元件並拖放到表格中。

### 3. `inspection_form_saved_area.html`
- 功能：檢查表的「暫存/完成區」。
- 讀取 `saveTableJSON_temp`（暫存）與 `saveTableJSON_final`（完成）資料，並以唯讀或可編輯方式顯示表格。
- 也會用到 `dynamicTableJSON` 來還原表頭結構。
- 主要用途是讓使用者檢視、管理已設計好的檢查表內容。

---

## 🆕 多表格（multi 版）功能

### 4. `dynamic_table_builder_multi.html`
- 功能：支援同時設計多份表格（多表格設定），可設定每份表格的表頭、資料列、顏色等。
- 儲存至 localStorage（key: `dynamicTableMulti`），資料結構為 `{ configs: [多份表格設定], numTables, merge }`。
- 適合需要一次管理多份檢查表的場景。

### 5. `inspection_form_builder_preview_multi.html`
- 功能：多表格檢查表設計與預覽工具。
- 讀取 `dynamicTableMulti`，針對每份表格分別產生 palette、拖放、簽名、自訂元件、暫存/完成、行選取等互動功能。
- 暫存/完成資料分別存於 `saveTableJSON_multi_temp`、`saveTableJSON_multi_final`（陣列型態，每份表格一份）。
- 支援 palette 自訂、Quill 編輯器、拖放元件進表格、簽名互動等，與單表格版功能一致但多表格分離。
- 每份表格的 palette、builder、table、output、savedArea 皆獨立，資料結構分離，互不干擾。
- 適合需要同時設計、預覽、管理多份檢查表的場景。

### 6. `inspection_form_saved_area_multi.html`
- 功能：多表格的「暫存/完成區」。
- 讀取 `saveTableJSON_multi_temp`、`saveTableJSON_multi_final`，分別顯示多份表格的暫存/完成內容。
- 適合管理多份檢查表的暫存與完成資料。

---

## 特色功能

- **多層表頭設定**：可自訂 1~3 層表頭，每格可設定中文、英文、合併欄/列、寬度比例。
- **動態資料列**：可自訂資料列數，每列每格可設定內容、合併欄/列、背景色。
- **色彩自訂**：表頭、資料列背景色可自訂，並自動調整文字顏色以確保可讀性。
- **本機儲存/載入**：可將設定儲存至本機 localStorage，隨時載入回復。
- **即時預覽**：即時產生並預覽 HTML 表格，支援 data-column 屬性，方便資料處理。
- **友善操作介面**：欄位設定支援摺疊/展開，操作直覺。
- **拖放與元件擴充**：支援拖放元件（checkbox、簽名、文字輸入等）到表格中，並可自訂 palette。
- **多表格管理**：multi 版可同時設計、預覽、管理多份表格，資料結構分離，互不干擾。

## 使用方式

1. 下載或打開 `dynamic_table_builder.html` 或 `dynamic_table_builder_multi.html`，設計單一或多份表格結構並儲存。
2. 開啟 `inspection_form_builder_preview.html` 或 `inspection_form_builder_preview_multi.html`，進行互動式檢查表設計、拖放元件、暫存/完成。
3. 開啟 `inspection_form_saved_area.html` 或 `inspection_form_saved_area_multi.html`，檢視與管理暫存/完成的檢查表。

---

本專案為純前端工具，無需安裝任何套件，歡迎自由修改與擴充。
