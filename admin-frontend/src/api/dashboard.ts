import request from '@/utils/request'

export function getDashboardOverview() {
  return request.get('/dashboard/overview')
}
