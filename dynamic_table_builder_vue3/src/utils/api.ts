import axios from 'axios';
import type {
  DynamicTableMultiListResponse,
  DynamicTableMultiSingleResponse
} from '../types/dynamicTableMultiResponse';
import type {
  PreviewTableMultiListResponse,
  PreviewTableMultiSingleResponse
} from '../types/previewTableMultiResponse';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' }
});

// paletteCustom CRUD
export const paletteCustomApi = {
  getAll: () => api.get('/paletteCustom'),
  get: (id: string) => api.get(`/paletteCustom/${id}`),
  create: (data: any) => api.post('/paletteCustom', data),
  update: (id: string, data: any) => api.put(`/paletteCustom/${id}`, data),
  delete: (id: string) => api.delete(`/paletteCustom/${id}`)
};

// dynamicTableMulti CRUD
export const dynamicTableMultiApi = {
  getAll: () => api.get<DynamicTableMultiListResponse>('http://localhost:81/api/DynamicTableMulti'),
  get: (name: string) => api.get<DynamicTableMultiSingleResponse>(`http://localhost:81/api/DynamicTableMulti/${name}`),
  create: (data: any) => api.post('http://localhost:81/api/DynamicTableMulti', data),
  update: (name: string, data: any) => api.put(`http://localhost:81/api/DynamicTableMulti/${name}`, data),
  delete: (name: string) => api.delete(`http://localhost:81/api/DynamicTableMulti/${name}`)
};

// previewTableMulti CRUD
export const previewTableMultiApi = {
  getAll: () => api.get<PreviewTableMultiListResponse>('http://localhost:81/api/PreviewTableMulti'),
  get: (name: string) => api.get<PreviewTableMultiSingleResponse>(`http://localhost:81/api/PreviewTableMulti/${name}`),
  create: (data: any) => api.post('http://localhost:81/api/PreviewTableMulti', data),
  update: (name: string, data: any) => api.put(`http://localhost:81/api/PreviewTableMulti/${name}`, data),
  delete: (name: string) => api.delete(`http://localhost:81/api/PreviewTableMulti/${name}`)
};


// multiTableSavedArea CRUD (與其他 API 統一 baseURL 寫法)
import type { MultiTableSavedAreaResponse } from '../types/multiTableSavedAreaResponse';

export const multiTableSavedAreaApi = {
  getAll: () => api.get<MultiTableSavedAreaResponse[]>('http://localhost:81/api/MultiTableSavedArea'),
  get: (name: string) => api.get<MultiTableSavedAreaResponse>(`http://localhost:81/api/MultiTableSavedArea/${name}`),
  create: (data: { name: string; configs: string }) => api.post('http://localhost:81/api/MultiTableSavedArea', data),
  update: (name: string, data: { name: string; configs: string }) => api.put(`http://localhost:81/api/MultiTableSavedArea/${name}`, data),
  delete: (name: string) => api.delete(`http://localhost:81/api/MultiTableSavedArea/${name}`)
};

export default api;
