import request from '@/utils/request'

export interface DouyinHotItem {
  id: number
  title: string
  hotValue: number
  url?: string
  cover?: string
  rank: number
  createdAt: string
}

export const getDouyinHotList = () => {
  return request<DouyinHotItem[]>({
    url: '/douyin-hot',
    method: 'get'
  })
}

export const refreshDouyinHotList = () => {
  return request<DouyinHotItem[]>({
    url: '/douyin-hot/refresh',
    method: 'post'
  })
}
