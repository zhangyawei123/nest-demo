import request from '@/utils/request'

export function getOperationLogs(params?: { page?: number; pageSize?: number; keyword?: string }) {
  return request.get('/operation-log/list', { params })
}

export function clearOperationLogs() {
  return request.post('/operation-log/clear')
}
