import request from '@/utils/request';

export interface GenerateImageDto {
  model?: string;
  prompt: string;
  image?: string[];
  size?: string;
  count?: number;
  resolution?: string;
  response_format?: string;
}

export interface GenerateImageItem {
  url?: string;
  thumbnail_url?: string;
  [key: string]: unknown;
}

export interface GenerateImageResponse {
  id?: number;
  created?: number;
  data?: GenerateImageItem[];
  usage?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface DrawGenerationRecord {
  id: number;
  userId: number;
  model: string;
  prompt: string;
  image: unknown[];
  size?: string;
  responseFormat?: string;
  status: 'pending' | 'success' | 'failed' | string;
  generatedUrls: string[];
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
  requestBody?: Record<string, unknown>;
  responseBody?: Record<string, unknown>;
}

export interface DrawGenerationHistoryParams {
  page?: number;
  pageSize?: number;
  keyword?: string;
  status?: 'pending' | 'success' | 'failed';
}

export interface DrawGenerationHistoryResponse {
  list: DrawGenerationRecord[];
  total: number;
  page: number;
  pageSize: number;
}

export const generateImage = (data: GenerateImageDto) => {
  return request<GenerateImageResponse>({
    url: '/draw/v1/images/generations',
    method: 'post',
    data,
    timeout: 0,
  }) as unknown as Promise<GenerateImageResponse>;
};

export const getDrawGenerationHistory = (
  params?: DrawGenerationHistoryParams,
) => {
  return request<DrawGenerationHistoryResponse>({
    url: '/draw/v1/images/generations/history',
    method: 'get',
    params,
    timeout: 0,
  }) as unknown as Promise<DrawGenerationHistoryResponse>;
};

export const getDrawGenerationDetail = (id: number) => {
  return request<DrawGenerationRecord>({
    url: `/draw/v1/images/generations/${id}`,
    method: 'get',
    timeout: 0,
  }) as unknown as Promise<DrawGenerationRecord>;
};
