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

## 特色功能

- **多層表頭設定**：可自訂 1~3 層表頭，每格可設定中文、英文、合併欄/列、寬度比例。
- **動態資料列**：可自訂資料列數，每列每格可設定內容、合併欄/列、背景色。
- **色彩自訂**：表頭、資料列背景色可自訂，並自動調整文字顏色以確保可讀性。
- **本機儲存/載入**：可將設定儲存至本機 localStorage，隨時載入回復。
- **即時預覽**：即時產生並預覽 HTML 表格，支援 data-column 屬性，方便資料處理。
- **友善操作介面**：欄位設定支援摺疊/展開，操作直覺。
- **拖放與元件擴充**：支援拖放元件（checkbox、簽名、文字輸入等）到表格中，並可自訂 palette。

## 使用方式

1. 下載或打開 `dynamic_table_builder.html`，設計表格結構並儲存。
2. 開啟 `inspection_form_builder_preview.html`，進行互動式檢查表設計、拖放元件、暫存/完成。
3. 開啟 `inspection_form_saved_area.html`，檢視與管理暫存/完成的檢查表。

---

## 多表格（multi 版）功能說明

### 1. `inspection_form_builder_preview_multi.html`
- 功能：多表格互動式檢查表設計工具。
- 支援 palette 拖放、簽名、Quill 編輯器、自訂 palette、暫存/完成、行選取等功能，且每份表格皆獨立互動與儲存。
- 每個表格的 palette、builder、table、output、savedArea 皆分離，資料結構獨立，localStorage key 以 multi 版分離命名。
- 適用於同時設計、管理多份檢查表，避免資料混淆。
- 主要資料流：
  - 讀取多份 `dynamicTableJSON` 結構，分別產生多個 builder 區塊。
  - 各表格的 palette 拖放、簽名、Quill 編輯器等互動元件皆獨立運作。
  - 暫存/完成時，分別儲存至對應的 localStorage key（如 `saveTableJSON_temp_multi_{id}`）。

### 2. `inspection_form_saved_area_multi.html`
- 功能：多表格暫存/完成區，支援多份檢查表資料的顯示與管理。
- 可同時檢視、管理多份暫存/完成的檢查表，並以分區方式呈現。
- 讀取多個 `saveTableJSON_temp_multi_{id}`、`saveTableJSON_final_multi_{id}`，以及對應的 `dynamicTableJSON_multi_{id}`。
- 適合需要同時追蹤多份檢查表進度與內容的場景。

### 3. multi 版與單表格版差異
- 單表格版（`inspection_form_builder_preview.html`, `inspection_form_saved_area.html`）僅支援單一檢查表的互動與管理。
- multi 版則可同時操作多份檢查表，所有 palette、互動元件、資料儲存皆分離，互不干擾。
- multi 版 localStorage key 皆加上 multi 與唯一 id 以區分。

### 4. 使用方式（multi 版）
1. 下載或打開 `dynamic_table_builder_multi.html`，設計多份表格結構並儲存（每份表格皆有獨立設定）。
2. 開啟 `inspection_form_builder_preview_multi.html`，可同時設計、互動多份檢查表，palette/簽名/Quill/暫存/完成等功能皆獨立。
3. 開啟 `inspection_form_saved_area_multi.html`，同時檢視、管理多份暫存/完成的檢查表。

---

本專案為純前端工具，無需安裝任何套件，歡迎自由修改與擴充。
