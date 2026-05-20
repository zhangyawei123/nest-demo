import request from '@/utils/request'

export function getFeedbackList(params?: { page?: number; pageSize?: number; status?: string; keyword?: string }) {
  return request.get('/feedback/list', { params })
}

export function updateFeedbackStatus(data: { id: number; status: string }) {
  return request.post('/feedback/update-status', data)
}

export function deleteFeedback(data: { id: number }) {
  return request.post('/feedback/delete', data)
}
