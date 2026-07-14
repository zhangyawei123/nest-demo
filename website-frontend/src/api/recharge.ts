import request from './http'

export type RechargeOrderStatus = 'pending' | 'paid' | 'refund_pending' | 'cancelled' | 'refunded'

export interface RechargePackageItem {
  id: number
  name: string
  description: string | null
  priceCents: number
  points: number
  bonusPoints: number
  enabled: boolean
  sort: number
  createdAt: string
  updatedAt: string
}

export interface RechargeOrderItem {
  id: number
  orderNo: string
  userId: number
  packageId: number | null
  packageName: string
  amountCents: number
  points: number
  bonusPoints: number
  totalPoints: number
  status: RechargeOrderStatus
  paidAt: string | null
  paymentProofUrl: string | null
  paymentSubmittedAt: string | null
  cancelledAt: string | null
  refundedAt: string | null
  refundRequestedAt: string | null
  refundReason: string | null
  refundHandledAt: string | null
  refundHandledBy: number | null
  refundDecisionRemark: string | null
  confirmedBy: number | null
  remark: string | null
  createdAt: string
  updatedAt: string
}

export interface RechargeOrderListResponse {
  list: RechargeOrderItem[]
  total: number
  page: number
  pageSize: number
}

export const getRechargePackages = () => {
  return request.get('/recharge/packages') as unknown as Promise<RechargePackageItem[]>
}

export const createRechargeOrder = (packageId: number) => {
  return request.post('/recharge/orders', { packageId }) as unknown as Promise<RechargeOrderItem>
}

export const getMyRechargeOrders = (params?: {
  page?: number
  pageSize?: number
  status?: RechargeOrderStatus
}) => {
  return request.get('/recharge/orders/my', { params }) as unknown as Promise<RechargeOrderListResponse>
}

export const cancelMyRechargeOrder = (id: number) => {
  return request.post(`/recharge/orders/${id}/cancel`) as unknown as Promise<RechargeOrderItem>
}

export const submitRechargePaymentProof = (id: number, file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return request.post(`/recharge/orders/${id}/payment-proof`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }) as unknown as Promise<RechargeOrderItem>
}

export const requestRechargeRefund = (id: number, reason: string) => {
  return request.post(`/recharge/orders/${id}/refund`, { reason }) as unknown as Promise<RechargeOrderItem>
}
