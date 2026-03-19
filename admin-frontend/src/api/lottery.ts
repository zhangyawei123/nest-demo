import request from '@/utils/request'

export function getPrizes() {
  return request.get('/lottery/prizes')
}

export function createPrize(data: any) {
  return request.post('/lottery/prizes/create', data)
}

export function updatePrize(id: number, data: any) {
  return request.post(`/lottery/prizes/update/${id}`, data)
}

export function deletePrize(id: number) {
  return request.post(`/lottery/prizes/delete/${id}`)
}

export function drawLottery() {
  return request.post('/lottery/draw')
}

export function getRecords(page = 1, pageSize = 10) {
  return request.get('/lottery/records', { params: { page, pageSize } })
}
