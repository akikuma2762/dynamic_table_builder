export interface MultiTableSavedAreaResponse {
  name: string;
  configs: string;
}

export interface MultiTableSavedAreaListResponse {
  success: boolean;
  data: MultiTableSavedAreaResponse[];
}

export interface MultiTableSavedAreaSingleResponse {
  success: boolean;
  data: MultiTableSavedAreaResponse;
}
