import axios from 'axios';
import type {
  DynamicTableMultiListResponse,
  DynamicTableMultiSingleResponse
} from '../types/dynamicTableMultiResponse';
import type {
  PreviewTableMultiListResponse,
  PreviewTableMultiSingleResponse
} from '../types/previewTableMultiResponse';
import type {
  PaletteCustomListResponse,
  PaletteCustomSingleResponse,
  CreatePaletteCustomRequest,
  UpdatePaletteCustomRequest
} from '../types/paletteCustomResponse';

import type { MultiTableSavedAreaListResponse, MultiTableSavedAreaSingleResponse } from '../types/multiTableSavedAreaResponse';

// API 基礎 URL 常數 - 從環境變數讀取
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5048/api';

// 用於代理的 axios 實例 (開發環境通過 Vite 代理)
const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

// 用於直接呼叫的 axios 實例 (生產環境或跨域呼叫)
const directApi = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' }
});

// paletteCustom CRUD
export const paletteCustomApi = {
  getAll: () => directApi.get<PaletteCustomListResponse>('/PaletteCustom'),
  get: (id: string) => directApi.get<PaletteCustomSingleResponse>(`/PaletteCustom/${id}`),
  create: (data: CreatePaletteCustomRequest) => directApi.post<PaletteCustomSingleResponse>('/PaletteCustom', data),
  update: (id: string, data: UpdatePaletteCustomRequest) => directApi.put<PaletteCustomSingleResponse>(`/PaletteCustom/${id}`, data),
  delete: (id: string) => directApi.delete(`/PaletteCustom/${id}`)
};

// dynamicTableMulti CRUD
export const dynamicTableMultiApi = {
  getAll: () => directApi.get<DynamicTableMultiListResponse>('/DynamicTableMulti'),
  get: (name: string) => directApi.get<DynamicTableMultiSingleResponse>(`/DynamicTableMulti/${name}`),
  create: (data: any) => directApi.post('/DynamicTableMulti', data),
  update: (name: string, data: any) => directApi.put(`/DynamicTableMulti/${name}`, data),
  delete: (name: string) => directApi.delete(`/DynamicTableMulti/${name}`)
};

// previewTableMulti CRUD
export const previewTableMultiApi = {
  getAll: () => directApi.get<PreviewTableMultiListResponse>('/PreviewTableMulti'),
  get: (name: string) => directApi.get<PreviewTableMultiSingleResponse>(`/PreviewTableMulti/${name}`),
  create: (data: any) => directApi.post('/PreviewTableMulti', data),
  update: (name: string, data: any) => directApi.put(`/PreviewTableMulti/${name}`, data),
  delete: (name: string) => directApi.delete(`/PreviewTableMulti/${name}`)
};



export const multiTableSavedAreaApi = {
  getAll: () => directApi.get<MultiTableSavedAreaListResponse>('/MultiTableSavedArea'),
  get: (name: string) => directApi.get<MultiTableSavedAreaSingleResponse>(`/MultiTableSavedArea/${name}`),
  create: (data: { name: string; configs: string }) => directApi.post('/MultiTableSavedArea', data),
  update: (name: string, data: { name: string; configs: string }) => directApi.put(`/MultiTableSavedArea/${name}`, data),
  delete: (name: string) => directApi.delete(`/MultiTableSavedArea/${name}`)
};

export default api;
