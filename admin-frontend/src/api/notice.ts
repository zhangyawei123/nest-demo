import request from '@/utils/request'

export function getActiveNotices() {
  return request.get('/notice/active')
}

export function getNoticeList(params?: { page?: number; pageSize?: number }) {
  return request.get('/notice/list', { params })
}

export function createNotice(data: { title: string; content: string; type?: string; enabled?: boolean }) {
  return request.post('/notice/create', data)
}

export function updateNotice(id: number, data: any) {
  return request.post(`/notice/update/${id}`, data)
}

export function deleteNotice(id: number) {
  return request.post(`/notice/delete/${id}`)
}
