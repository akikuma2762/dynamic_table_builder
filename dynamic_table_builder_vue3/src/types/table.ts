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
}

export interface DataCell {
  text: string
  colspan: number
  rowspan: number
  align: string
  color: string
  size: number
  collapsed?: boolean // UI用，可選
  value?: any // palette 互動元件用
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
  headerBg: string
  dataBg: string
}
