import request from './http'

export interface GenerateImageDto {
  model?: string
  prompt: string
  image?: string[]
  size?: string
  count?: number
  resolution?: string
  response_format?: string
}

export interface GenerateImageItem {
  url?: string
  thumbnail_url?: string
  [key: string]: unknown
}

export interface GenerateImageResponse {
  id?: number
  created?: number
  data?: GenerateImageItem[]
  usage?: Record<string, unknown>
  [key: string]: unknown
}

export interface DrawGenerationRecord {
  id: number
  userId: number
  model: string
  prompt: string
  image: unknown[]
  size?: string
  responseFormat?: string
  status: 'pending' | 'success' | 'failed' | string
  generatedUrls: string[]
  errorMessage?: string | null
  createdAt: string
  updatedAt: string
  requestBody?: Record<string, unknown>
  responseBody?: Record<string, unknown>
}

export interface DrawGenerationHistoryResponse {
  list: DrawGenerationRecord[]
  total: number
  page: number
  pageSize: number
}

export const generateImage = (data: GenerateImageDto) => {
  return request.post('/draw/v1/images/generations', data, { timeout: 0 }) as unknown as Promise<GenerateImageResponse>
}

export const getDrawGenerationHistory = (params?: {
  page?: number
  pageSize?: number
  keyword?: string
  status?: 'pending' | 'success' | 'failed'
}) => {
  return request.get('/draw/v1/images/generations/history', { params, timeout: 0 }) as unknown as Promise<DrawGenerationHistoryResponse>
}
