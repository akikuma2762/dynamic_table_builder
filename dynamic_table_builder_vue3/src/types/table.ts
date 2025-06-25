export interface HeaderCell {
  text: string
  en: string
  colspan: number
  rowspan: number
  width: string
  align: string
  color: string
  size: number
  indexed: boolean
  collapsed?: boolean // UI用，可選
  bg: string // 新增：表頭儲存格背景色
}

export interface PaletteField {
  type: string; // 'checkbox' | 'inputText' | 'textarea' | ...
  key: string; // 唯一識別
  props: any;
}

export interface DataCell {
  text: string
  colspan: number
  rowspan: number
  align: string
  color: string
  size: number
  collapsed?: boolean // UI用，可選
  value?:
    | { type: string; props: any } // 單一 palette
    | { type: 'custom'; fields: PaletteField[] } // 複合 palette
  type?: string // palette 型別判斷用，如 'signature'、'text' 等
}

export interface DataRow {
  color: string
  cells: DataCell[]
}

export interface TableConfig {
  headerRowsLen: number
  headerRows: HeaderCell[][]
  dataRowsLen: number
  dataRowsCfg: DataRow[]
  // headerBg: string // 已移除，改由 cell.bg 控制
  dataBg: string // 若要移除預設資料列背景色可再調整
}

export interface TableMultiFile {
  configs: TableConfig[]
  numTables: number
  merge: boolean
}