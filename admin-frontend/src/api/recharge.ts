import request from '@/utils/request'

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
  user?: {
    id: number
    username: string
  }
}

export interface RechargeOrderEventItem {
  id: number
  orderId: number
  actorId: number | null
  actorType: 'user' | 'admin' | 'system'
  action: string
  fromStatus: string | null
  toStatus: string | null
  detail: string | null
  createdAt: string
}

export interface RechargeOrderListResponse {
  list: RechargeOrderItem[]
  total: number
  page: number
  pageSize: number
}

export interface RechargePackagePayload {
  name: string
  description?: string
  priceCents: number
  points: number
  bonusPoints?: number
  enabled?: boolean
  sort?: number
}

export const getAdminRechargePackages = () => {
  return request.get('/admin/recharge/packages') as unknown as Promise<RechargePackageItem[]>
}

export const createAdminRechargePackage = (data: RechargePackagePayload) => {
  return request.post('/admin/recharge/packages', data) as unknown as Promise<RechargePackageItem>
}

export const updateAdminRechargePackage = (id: number, data: Partial<RechargePackagePayload>) => {
  return request.post(`/admin/recharge/packages/${id}`, data) as unknown as Promise<RechargePackageItem>
}

export const getAdminRechargeOrders = (params?: {
  page?: number
  pageSize?: number
  status?: RechargeOrderStatus
  keyword?: string
}) => {
  return request.get('/admin/recharge/orders', { params }) as unknown as Promise<RechargeOrderListResponse>
}

export const confirmAdminRechargeOrder = (id: number, remark?: string) => {
  return request.post(`/admin/recharge/orders/${id}/confirm`, { remark }) as unknown as Promise<RechargeOrderItem>
}

export const cancelAdminRechargeOrder = (id: number) => {
  return request.post(`/admin/recharge/orders/${id}/cancel`) as unknown as Promise<RechargeOrderItem>
}

export const reviewAdminRechargeRefund = (id: number, approved: boolean, remark?: string) => {
  return request.post(`/admin/recharge/orders/${id}/refund/review`, {
    approved,
    remark,
  }) as unknown as Promise<RechargeOrderItem>
}

export const getAdminRechargeOrderEvents = (id: number) => {
  return request.get(`/admin/recharge/orders/${id}/events`) as unknown as Promise<RechargeOrderEventItem[]>
}

export const exportAdminRechargeOrders = (params?: {
  status?: RechargeOrderStatus
  keyword?: string
}) => {
  return request.get('/admin/recharge/orders/export', { params }) as unknown as Promise<RechargeOrderItem[]>
}
