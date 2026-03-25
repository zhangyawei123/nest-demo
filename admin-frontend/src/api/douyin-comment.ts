import request from '@/utils/request'

export interface DouyinCommentItem {
  id: number
  videoUrl: string
  nickname: string
  content: string
  likeCount: number
  avatarUrl?: string
  createdAt: string
}

export const getComments = (url: string) => {
  return request<DouyinCommentItem[]>({
    url: '/douyin-comment',
    method: 'get',
    params: { url }
  })
}

export const fetchComments = (url: string) => {
  return request<DouyinCommentItem[]>({
    url: '/douyin-comment/fetch',
    method: 'post',
    params: { url }
  })
}
