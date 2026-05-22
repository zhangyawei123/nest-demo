import request from '@/utils/request'

export interface GenerateImageDto {
  model?: string
  prompt: string
  image?: string[]
  size?: string
  response_format?: string
}

export interface GenerateImageItem {
  url?: string
  [key: string]: unknown
}

export interface GenerateImageResponse {
  id?: number
  created?: number
  data?: GenerateImageItem[]
  usage?: Record<string, unknown>
  [key: string]: unknown
}

export const generateImage = (data: GenerateImageDto) => {
  return request<GenerateImageResponse>({
    url: '/draw/v1/images/generations',
    method: 'post',
    data,
    timeout: 120000,
  })
}
