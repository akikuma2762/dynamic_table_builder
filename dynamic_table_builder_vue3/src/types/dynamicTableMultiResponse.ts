export interface DynamicTableMultiResponse {
  name: string;
  configs: string; // JSON 字串
  numTables: number;
  merge: boolean;
}

export interface DynamicTableMultiListResponse {
  success: boolean;
  data: DynamicTableMultiResponse[];
}

export interface DynamicTableMultiSingleResponse {
  success: boolean;
  data: DynamicTableMultiResponse;
}
