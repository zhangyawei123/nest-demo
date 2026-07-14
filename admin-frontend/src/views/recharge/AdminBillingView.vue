<template>
  <div class="billing-page">
    <section class="page-header">
      <div>
        <span class="eyebrow">BILLING OPS</span>
        <h2>计费管理</h2>
        <p>管理充值套餐和订单确认，确认支付会自动给用户增加积分并写入流水。</p>
      </div>
      <el-button type="primary" @click="openPackageDialog()">新增套餐</el-button>
    </section>

    <el-tabs v-model="activeTab" class="billing-tabs">
      <el-tab-pane label="套餐管理" name="packages">
        <section class="table-section">
          <div class="section-head">
            <h3>套餐列表</h3>
            <el-button @click="loadPackages">刷新</el-button>
          </div>
          <el-table :data="packages" v-loading="packageLoading">
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column prop="name" label="套餐名" min-width="150" />
            <el-table-column label="金额" width="110">
              <template #default="{ row }">¥ {{ formatMoney(row.priceCents) }}</template>
            </el-table-column>
            <el-table-column prop="points" label="基础积分" width="110" />
            <el-table-column prop="bonusPoints" label="赠送积分" width="110" />
            <el-table-column label="总积分" width="100">
              <template #default="{ row }">{{ row.points + row.bonusPoints }}</template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.enabled ? 'success' : 'info'">{{ row.enabled ? '启用' : '停用' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="sort" label="排序" width="80" />
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-button text type="primary" @click="openPackageDialog(row)">编辑</el-button>
              </template>
            </el-table-column>
          </el-table>
        </section>
      </el-tab-pane>

      <el-tab-pane label="充值订单" name="orders">
        <section class="table-section">
          <div class="order-filters">
            <el-input v-model="orderKeyword" clearable placeholder="订单号、套餐、用户名" style="width: 240px" @keyup.enter="handleOrderSearch" />
            <el-select v-model="orderStatus" clearable placeholder="全部状态" style="width: 150px" @change="handleOrderSearch">
              <el-option label="待支付" value="pending" />
              <el-option label="已支付" value="paid" />
              <el-option label="退款审核" value="refund_pending" />
              <el-option label="已取消" value="cancelled" />
              <el-option label="已退款" value="refunded" />
            </el-select>
            <el-button type="primary" @click="handleOrderSearch">查询</el-button>
            <el-button @click="resetOrderSearch">重置</el-button>
            <el-button @click="handleExport">导出账务</el-button>
          </div>

          <el-table :data="orders" v-loading="orderLoading">
            <el-table-column prop="orderNo" label="订单号" min-width="190" />
            <el-table-column label="用户" width="120">
              <template #default="{ row }">{{ row.user?.username || row.userId }}</template>
            </el-table-column>
            <el-table-column prop="packageName" label="套餐" min-width="140" />
            <el-table-column label="金额" width="100">
              <template #default="{ row }">¥ {{ formatMoney(row.amountCents) }}</template>
            </el-table-column>
            <el-table-column prop="totalPoints" label="到账积分" width="100" />
            <el-table-column label="支付凭证" width="100">
              <template #default="{ row }">
                <el-link v-if="row.paymentProofUrl" :href="row.paymentProofUrl" target="_blank" type="primary">查看凭证</el-link>
                <span v-else class="muted">未提交</span>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="statusType(row.status)">{{ statusLabel(row.status) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="创建时间" width="180">
              <template #default="{ row }">{{ formatDate(row.createdAt) }}</template>
            </el-table-column>
            <el-table-column label="支付时间" width="180">
              <template #default="{ row }">{{ formatDate(row.paidAt) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="280" fixed="right">
              <template #default="{ row }">
                <el-button v-if="row.status === 'pending'" size="small" type="success" :disabled="!row.paymentProofUrl" @click="handleConfirm(row)">确认支付</el-button>
                <el-button v-if="row.status === 'pending'" size="small" type="danger" @click="handleCancel(row)">取消</el-button>
                <el-button v-if="row.status === 'refund_pending'" size="small" type="success" @click="handleRefundReview(row, true)">同意退款</el-button>
                <el-button v-if="row.status === 'refund_pending'" size="small" type="danger" @click="handleRefundReview(row, false)">驳回</el-button>
                <el-button size="small" text type="primary" @click="openOrderDetail(row)">明细</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-pagination
            v-model:current-page="orderPage"
            :page-size="orderPageSize"
            :total="orderTotal"
            layout="total, prev, pager, next"
            class="pagination"
            @current-change="loadOrders"
          />
        </section>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="packageDialogVisible" :title="packageForm.id ? '编辑套餐' : '新增套餐'" width="520px">
      <el-form ref="packageFormRef" :model="packageForm" :rules="packageRules" label-width="92px">
        <el-form-item label="套餐名" prop="name">
          <el-input v-model="packageForm.name" maxlength="80" placeholder="如：入门包" />
        </el-form-item>
        <el-form-item label="说明">
          <el-input v-model="packageForm.description" maxlength="200" placeholder="展示给用户的简短说明" />
        </el-form-item>
        <el-form-item label="金额" prop="priceYuan">
          <el-input-number v-model.number="packageForm.priceYuan" :min="0.01" :precision="2" :step="1" style="width: 180px" />
          <span class="form-tip">元</span>
        </el-form-item>
        <el-form-item label="基础积分" prop="points">
          <el-input-number v-model.number="packageForm.points" :min="1" :step="10" style="width: 180px" />
        </el-form-item>
        <el-form-item label="赠送积分">
          <el-input-number v-model.number="packageForm.bonusPoints" :min="0" :step="10" style="width: 180px" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model.number="packageForm.sort" :min="0" :step="1" style="width: 180px" />
        </el-form-item>
        <el-form-item label="启用">
          <el-switch v-model="packageForm.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="packageDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="packageSubmitting" @click="submitPackage">保存</el-button>
      </template>
    </el-dialog>

    <el-drawer v-model="orderDetailVisible" title="订单审计明细" size="520px">
      <template v-if="selectedOrder">
        <el-descriptions :column="1" border class="order-detail">
          <el-descriptions-item label="订单号">{{ selectedOrder.orderNo }}</el-descriptions-item>
          <el-descriptions-item label="用户">{{ selectedOrder.user?.username || selectedOrder.userId }}</el-descriptions-item>
          <el-descriptions-item label="金额">¥ {{ formatMoney(selectedOrder.amountCents) }}</el-descriptions-item>
          <el-descriptions-item label="积分">{{ selectedOrder.totalPoints }}</el-descriptions-item>
          <el-descriptions-item label="退款原因">{{ selectedOrder.refundReason || '-' }}</el-descriptions-item>
          <el-descriptions-item label="审核备注">{{ selectedOrder.refundDecisionRemark || selectedOrder.remark || '-' }}</el-descriptions-item>
        </el-descriptions>
        <el-timeline v-loading="eventLoading" class="order-timeline">
          <el-timeline-item v-for="event in orderEvents" :key="event.id" :timestamp="formatDate(event.createdAt)">
            <strong>{{ eventActionLabel(event.action) }}</strong>
            <p>{{ event.detail || event.toStatus || '-' }}</p>
          </el-timeline-item>
        </el-timeline>
      </template>
    </el-drawer>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import {
  cancelAdminRechargeOrder,
  confirmAdminRechargeOrder,
  createAdminRechargePackage,
  exportAdminRechargeOrders,
  getAdminRechargeOrderEvents,
  getAdminRechargeOrders,
  getAdminRechargePackages,
  reviewAdminRechargeRefund,
  updateAdminRechargePackage,
  type RechargeOrderItem,
  type RechargeOrderEventItem,
  type RechargeOrderStatus,
  type RechargePackageItem,
} from '@/api/recharge'

const activeTab = ref('packages')
const packages = ref<RechargePackageItem[]>([])
const orders = ref<RechargeOrderItem[]>([])
const packageLoading = ref(false)
const orderLoading = ref(false)
const packageDialogVisible = ref(false)
const packageSubmitting = ref(false)
const packageFormRef = ref<FormInstance>()
const orderPage = ref(1)
const orderPageSize = ref(10)
const orderTotal = ref(0)
const orderStatus = ref<RechargeOrderStatus | ''>('')
const orderKeyword = ref('')
const orderDetailVisible = ref(false)
const selectedOrder = ref<RechargeOrderItem | null>(null)
const orderEvents = ref<RechargeOrderEventItem[]>([])
const eventLoading = ref(false)

const defaultPackageForm = () => ({
  id: 0,
  name: '',
  description: '',
  priceYuan: 9.9,
  points: 100,
  bonusPoints: 0,
  enabled: true,
  sort: 0,
})

const packageForm = reactive(defaultPackageForm())
const packageRules: FormRules = {
  name: [{ required: true, message: '请输入套餐名', trigger: 'blur' }],
  priceYuan: [{ required: true, message: '请输入金额', trigger: 'change' }],
  points: [{ required: true, message: '请输入基础积分', trigger: 'change' }],
}

const formatMoney = (cents: number) => (Number(cents || 0) / 100).toFixed(2)
const formatDate = (date?: string | null) => date ? new Date(date).toLocaleString('zh-CN') : '-'
const statusLabel = (status: RechargeOrderStatus) => ({
  pending: '待支付',
  paid: '已支付',
  refund_pending: '退款审核',
  cancelled: '已取消',
  refunded: '已退款',
}[status] || status)
const statusType = (status: RechargeOrderStatus) => ({
  pending: 'warning',
  paid: 'success',
  refund_pending: 'warning',
  cancelled: 'info',
  refunded: 'danger',
}[status] || '')

const loadPackages = async () => {
  packageLoading.value = true
  try {
    packages.value = await getAdminRechargePackages()
  } finally {
    packageLoading.value = false
  }
}

const loadOrders = async () => {
  orderLoading.value = true
  try {
    const res = await getAdminRechargeOrders({
      page: orderPage.value,
      pageSize: orderPageSize.value,
      status: orderStatus.value || undefined,
      keyword: orderKeyword.value || undefined,
    })
    orders.value = res.list || []
    orderTotal.value = res.total || 0
  } finally {
    orderLoading.value = false
  }
}

const handleOrderSearch = () => {
  orderPage.value = 1
  loadOrders()
}

const resetOrderSearch = () => {
  orderKeyword.value = ''
  orderStatus.value = ''
  handleOrderSearch()
}

const openPackageDialog = (row?: RechargePackageItem) => {
  Object.assign(packageForm, defaultPackageForm())
  if (row) {
    Object.assign(packageForm, {
      id: row.id,
      name: row.name,
      description: row.description || '',
      priceYuan: Number(formatMoney(row.priceCents)),
      points: row.points,
      bonusPoints: row.bonusPoints,
      enabled: row.enabled,
      sort: row.sort,
    })
  }
  packageDialogVisible.value = true
}

const submitPackage = async () => {
  await packageFormRef.value?.validate()
  packageSubmitting.value = true
  try {
    const payload = {
      name: packageForm.name.trim(),
      description: packageForm.description.trim() || undefined,
      priceCents: Math.round(Number(packageForm.priceYuan) * 100),
      points: Number(packageForm.points),
      bonusPoints: Number(packageForm.bonusPoints || 0),
      enabled: packageForm.enabled,
      sort: Number(packageForm.sort || 0),
    }
    if (packageForm.id) {
      await updateAdminRechargePackage(packageForm.id, payload)
      ElMessage.success('套餐已更新')
    } else {
      await createAdminRechargePackage(payload)
      ElMessage.success('套餐已创建')
    }
    packageDialogVisible.value = false
    loadPackages()
  } finally {
    packageSubmitting.value = false
  }
}

const handleConfirm = async (row: RechargeOrderItem) => {
  const result = await ElMessageBox.prompt(
    `确认订单 ${row.orderNo} 已收款？确认后将到账 ${row.totalPoints} 积分。`,
    '确认支付',
    {
      confirmButtonText: '确认到账',
      cancelButtonText: '取消',
      inputPlaceholder: '备注，可留空',
      type: 'warning',
    },
  )
  await confirmAdminRechargeOrder(row.id, result.value)
  ElMessage.success('订单已确认，积分已到账')
  loadOrders()
}

const handleCancel = async (row: RechargeOrderItem) => {
  await ElMessageBox.confirm(`确定取消订单 ${row.orderNo}？`, '提示', { type: 'warning' })
  await cancelAdminRechargeOrder(row.id)
  ElMessage.success('订单已取消')
  loadOrders()
}

const handleRefundReview = async (row: RechargeOrderItem, approved: boolean) => {
  const result = await ElMessageBox.prompt(
    approved
      ? `同意订单 ${row.orderNo} 退款？系统会扣回 ${row.totalPoints} 积分。`
      : `驳回订单 ${row.orderNo} 的退款申请？`,
    approved ? '同意退款' : '驳回退款',
    {
      confirmButtonText: approved ? '确认退款' : '确认驳回',
      cancelButtonText: '取消',
      inputPlaceholder: '审核备注，可留空',
      type: approved ? 'warning' : 'info',
    },
  )
  await reviewAdminRechargeRefund(row.id, approved, result.value)
  ElMessage.success(approved ? '退款完成，积分已扣回' : '退款申请已驳回')
  loadOrders()
}

const openOrderDetail = async (row: RechargeOrderItem) => {
  selectedOrder.value = row
  orderDetailVisible.value = true
  eventLoading.value = true
  try {
    orderEvents.value = await getAdminRechargeOrderEvents(row.id)
  } finally {
    eventLoading.value = false
  }
}

const eventActionLabel = (action: string) => ({
  created: '创建订单',
  payment_proof_submitted: '提交支付凭证',
  payment_confirmed: '确认支付',
  cancelled: '取消订单',
  refund_requested: '申请退款',
  refund_approved: '退款通过',
  refund_rejected: '退款驳回',
  legacy_import: '历史订单基线',
}[action] || action)

const escapeCsv = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`
const handleExport = async () => {
  const rows = await exportAdminRechargeOrders({
    status: orderStatus.value || undefined,
    keyword: orderKeyword.value || undefined,
  })
  const header = ['订单号', '用户', '套餐', '金额(元)', '积分', '状态', '创建时间', '支付时间', '退款时间', '备注']
  const body = rows.map((row) => [
    row.orderNo,
    row.user?.username || row.userId,
    row.packageName,
    formatMoney(row.amountCents),
    row.totalPoints,
    statusLabel(row.status),
    formatDate(row.createdAt),
    formatDate(row.paidAt),
    formatDate(row.refundedAt),
    row.refundDecisionRemark || row.remark || '',
  ])
  const csv = `\uFEFF${[header, ...body].map((row) => row.map(escapeCsv).join(',')).join('\n')}`
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `充值账务-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

onMounted(() => {
  loadPackages()
  loadOrders()
})
</script>

<style scoped>
.billing-page {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.page-header,
.table-section {
  border: 1px solid rgba(118, 148, 190, 0.16);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.96);
  box-shadow: 0 14px 32px rgba(69, 101, 150, 0.1);
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  padding: 26px;
}

.eyebrow {
  display: inline-flex;
  margin-bottom: 10px;
  color: #2f7eea;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.page-header h2,
.section-head h3 {
  margin: 0;
  color: #1f2f46;
}

.page-header p {
  margin: 8px 0 0;
  color: #7b879b;
}

.billing-tabs {
  padding: 0 2px;
}

.table-section {
  padding: 20px;
}

.section-head,
.order-filters {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.section-head {
  justify-content: space-between;
}

.order-filters {
  flex-wrap: wrap;
}

.form-tip {
  margin-left: 8px;
  color: #7b879b;
}

.muted {
  color: #9aa6b8;
}

.pagination {
  margin-top: 16px;
  justify-content: flex-end;
  display: flex;
}

.order-detail {
  margin-bottom: 28px;
}

.order-timeline p {
  margin: 6px 0 0;
  color: #7b879b;
  line-height: 1.5;
}

@media (max-width: 720px) {
  .page-header {
    align-items: stretch;
    flex-direction: column;
  }
}
</style>
