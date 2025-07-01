export interface PreviewTableMultiResponse {
  name: string;
  configs: string; // JSON 字串
}

export interface PreviewTableMultiListResponse {
  success: boolean;
  data: PreviewTableMultiResponse[];
}

export interface PreviewTableMultiSingleResponse {
  success: boolean;
  data: PreviewTableMultiResponse;
}
