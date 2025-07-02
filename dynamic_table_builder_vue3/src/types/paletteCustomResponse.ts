// PaletteCustom API 回應型別定義

export interface PaletteCustomItem {
  id: string
  html: string
  createdAt?: string
  updatedAt?: string
}

export interface PaletteCustomListResponse {
  success: boolean
  message: string
  data: PaletteCustomItem[]
}

export interface PaletteCustomSingleResponse {
  success: boolean
  message: string
  data: PaletteCustomItem
}

export interface CreatePaletteCustomRequest {
  id?: string
  html: string
}

export interface UpdatePaletteCustomRequest {
  html?: string
}
