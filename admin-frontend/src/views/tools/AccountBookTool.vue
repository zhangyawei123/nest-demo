<template>
  <div class="tool-panel-content account-book">
    <!-- 汇总卡片 -->
    <div class="summary-grid">
      <div class="summary-card income">
        <span class="summary-label">总收入</span>
        <span class="summary-value">¥ {{ totalIncome.toFixed(2) }}</span>
      </div>
      <div class="summary-card expense">
        <span class="summary-label">总支出</span>
        <span class="summary-value">¥ {{ totalExpense.toFixed(2) }}</span>
      </div>
      <div class="summary-card net" :class="{ negative: netAmount < 0 }">
        <span class="summary-label">净额</span>
        <span class="summary-value">¥ {{ netAmount.toFixed(2) }}</span>
      </div>
      <div class="summary-card count">
        <span class="summary-label">流水笔数</span>
        <span class="summary-value">{{ transactions.length }}</span>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="account-book-tabs">
      <!-- 记一笔 -->
      <el-tab-pane label="记一笔" name="new">
        <el-form :model="form" label-width="120px" class="entry-form">
          <el-form-item label="类型">
            <el-radio-group v-model="form.type" @change="onTypeChange">
              <el-radio-button value="expense">支出</el-radio-button>
              <el-radio-button value="income">收入</el-radio-button>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="金额">
            <el-input-number
              v-model="form.amount"
              :min="0"
              :precision="2"
              :step="10"
              style="width: 220px"
            />
          </el-form-item>

          <el-form-item label="账户">
            <el-select v-model="form.accountId" placeholder="请选择账户" style="width: 240px">
              <el-option
                v-for="a in accounts"
                :key="a.id"
                :label="`${a.name} (${a.type})`"
                :value="a.id!"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="分类">
            <div class="category-grid">
              <div
                v-for="c in filteredCategories"
                :key="c.id"
                class="category-chip"
                :class="{ active: form.categoryId === c.id }"
                :style="{ borderColor: form.categoryId === c.id ? c.color : undefined }"
                @click="form.categoryId = c.id!"
              >
                <span class="icon">{{ c.icon }}</span>
                <span>{{ c.name }}</span>
              </div>
            </div>
          </el-form-item>

          <el-form-item label="日期">
            <el-date-picker v-model="form.occurredAt" type="datetime" style="width: 240px" />
          </el-form-item>

          <el-form-item label="备注">
            <el-input v-model="form.note" placeholder="可选，简单说明下" maxlength="50" />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" :disabled="!canSubmit" @click="addTransaction">保存</el-button>
            <el-button @click="resetForm">重置</el-button>
          </el-form-item>
        </el-form>
      </el-tab-pane>

      <!-- 流水 -->
      <el-tab-pane :label="`流水 (${transactions.length})`" name="list">
        <el-table :data="transactions" stripe empty-text="还没有流水，去记一笔吧" style="width: 100%">
          <el-table-column label="日期" width="170">
            <template #default="{ row }">{{ formatDate(row.occurredAt) }}</template>
          </el-table-column>
          <el-table-column label="分类" width="120">
            <template #default="{ row }">
              <span class="cat-cell">
                <span>{{ getCategory(row.categoryId)?.icon || '📄' }}</span>
                <span>{{ getCategory(row.categoryId)?.name || '-' }}</span>
              </span>
            </template>
          </el-table-column>
          <el-table-column label="账户" width="140">
            <template #default="{ row }">{{ getAccount(row.accountId)?.name || '-' }}</template>
          </el-table-column>
          <el-table-column label="金额" width="130">
            <template #default="{ row }">
              <span :class="row.type === 'income' ? 'amount-income' : 'amount-expense'">
                {{ row.type === 'income' ? '+' : '-' }} ¥ {{ row.amount.toFixed(2) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="备注" prop="note" show-overflow-tooltip />
          <el-table-column label="操作" width="80" fixed="right">
            <template #default="{ row }">
              <el-button link type="danger" @click="removeTransaction(row.id)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 账户 -->
      <el-tab-pane :label="`账户 (${accounts.length})`" name="accounts">
        <div class="inline-form">
          <el-input v-model="newAccount.name" placeholder="账户名" style="width: 180px" />
          <el-input v-model="newAccount.type" placeholder="类型（现金/银行卡...)" style="width: 180px" />
          <el-input-number
            v-model="newAccount.initialBalance"
            :precision="2"
            :step="100"
            placeholder="初始余额"
            style="width: 160px"
          />
          <el-button type="primary" :disabled="!newAccount.name" @click="addAccount">新增账户</el-button>
        </div>

        <el-table :data="accountsWithBalance" stripe style="width: 100%; margin-top: 16px">
          <el-table-column prop="name" label="账户" width="160" />
          <el-table-column prop="type" label="类型" width="140" />
          <el-table-column label="初始余额" width="140">
            <template #default="{ row }">¥ {{ row.initialBalance.toFixed(2) }}</template>
          </el-table-column>
          <el-table-column label="当前余额" width="160">
            <template #default="{ row }">
              <span :class="row.balance < 0 ? 'amount-expense' : 'amount-income'">
                ¥ {{ row.balance.toFixed(2) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="流水数" width="100">
            <template #default="{ row }">{{ row.txCount }}</template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button link type="danger" @click="removeAccount(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- 分类 -->
      <el-tab-pane :label="`分类 (${categories.length})`" name="categories">
        <div class="inline-form">
          <el-input v-model="newCategory.icon" placeholder="图标(emoji)" maxlength="2" style="width: 120px" />
          <el-input v-model="newCategory.name" placeholder="分类名" style="width: 160px" />
          <el-select v-model="newCategory.type" style="width: 120px">
            <el-option label="支出" value="expense" />
            <el-option label="收入" value="income" />
          </el-select>
          <el-color-picker v-model="newCategory.color" />
          <el-button type="primary" :disabled="!newCategory.name" @click="addCategory">新增分类</el-button>
        </div>

        <el-table :data="categoriesWithStats" stripe style="width: 100%; margin-top: 16px">
          <el-table-column label="图标" width="70">
            <template #default="{ row }">
              <span class="cat-icon" :style="{ background: row.color }">{{ row.icon }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="name" label="名称" width="140" />
          <el-table-column label="类型" width="100">
            <template #default="{ row }">
              <el-tag :type="row.type === 'income' ? 'success' : 'danger'" size="small">
                {{ row.type === 'income' ? '收入' : '支出' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="流水数" width="100" prop="txCount" />
          <el-table-column label="累计金额" width="160">
            <template #default="{ row }">¥ {{ row.totalAmount.toFixed(2) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="100" fixed="right">
            <template #default="{ row }">
              <el-button link type="danger" @click="removeCategory(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <div class="footer-bar">
      <span class="hint">数据完全存储在浏览器 IndexedDB（Dexie），不上传服务器</span>
      <el-button link type="danger" @click="clearAll">清空所有数据</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { liveQuery, type Subscription } from 'dexie'
import { db, type Account, type Category, type Transaction } from './accountBookDb'

const activeTab = ref('new')

// 使用 Dexie liveQuery 实时订阅三张表，任一 CRUD 都会自动更新 ref
const accounts = ref<Account[]>([])
const categories = ref<Category[]>([])
const transactions = ref<Transaction[]>([])

const subscriptions: Subscription[] = []

const subscribeAll = () => {
  subscriptions.push(
    liveQuery(() => db.accounts.orderBy('createdAt').toArray()).subscribe({
      next: (data) => (accounts.value = data),
    }),
    liveQuery(() => db.categories.orderBy('id').toArray()).subscribe({
      next: (data) => (categories.value = data),
    }),
    liveQuery(() => db.transactions.orderBy('occurredAt').reverse().toArray()).subscribe({
      next: (data) => (transactions.value = data),
    }),
  )
}

// 记一笔表单
const form = reactive({
  type: 'expense' as 'income' | 'expense',
  amount: 0,
  accountId: undefined as number | undefined,
  categoryId: undefined as number | undefined,
  occurredAt: new Date(),
  note: '',
})

const resetForm = () => {
  form.type = 'expense'
  form.amount = 0
  form.accountId = undefined
  form.categoryId = undefined
  form.occurredAt = new Date()
  form.note = ''
}

const onTypeChange = () => {
  form.categoryId = undefined
}

const filteredCategories = computed(() =>
  (categories.value || []).filter((c: Category) => c.type === form.type),
)

const canSubmit = computed(
  () => form.amount > 0 && form.accountId != null && form.categoryId != null,
)

const addTransaction = async () => {
  if (!canSubmit.value) return
  await db.transactions.add({
    accountId: form.accountId!,
    categoryId: form.categoryId!,
    amount: form.amount,
    type: form.type,
    note: form.note.trim(),
    occurredAt: form.occurredAt,
    createdAt: new Date(),
  })
  ElMessage.success('已记录')
  resetForm()
  activeTab.value = 'list'
}

const removeTransaction = async (id: number) => {
  await db.transactions.delete(id)
  ElMessage.success('已删除')
}

// 账户相关
const newAccount = reactive({ name: '', type: '', initialBalance: 0 })

const addAccount = async () => {
  if (!newAccount.name.trim()) return
  await db.accounts.add({
    name: newAccount.name.trim(),
    type: newAccount.type.trim() || '其他',
    initialBalance: Number(newAccount.initialBalance) || 0,
    createdAt: new Date(),
  })
  newAccount.name = ''
  newAccount.type = ''
  newAccount.initialBalance = 0
  ElMessage.success('已新增账户')
}

const removeAccount = async (account: Account & { txCount: number }) => {
  if (account.txCount > 0) {
    ElMessage.warning('该账户还有流水，请先删除相关流水')
    return
  }
  await db.accounts.delete(account.id!)
  ElMessage.success('已删除账户')
}

// 分类相关
const newCategory = reactive({
  name: '',
  icon: '🏷️',
  color: '#409eff',
  type: 'expense' as 'income' | 'expense',
})

const addCategory = async () => {
  if (!newCategory.name.trim()) return
  await db.categories.add({
    name: newCategory.name.trim(),
    icon: newCategory.icon || '🏷️',
    color: newCategory.color || '#409eff',
    type: newCategory.type,
  })
  newCategory.name = ''
  newCategory.icon = '🏷️'
  ElMessage.success('已新增分类')
}

const removeCategory = async (cat: Category & { txCount: number }) => {
  if (cat.txCount > 0) {
    ElMessage.warning('该分类已被流水使用，无法删除')
    return
  }
  await db.categories.delete(cat.id!)
  ElMessage.success('已删除分类')
}

// 关联查找
const getAccount = (id: number) => (accounts.value || []).find((a: Account) => a.id === id)
const getCategory = (id: number) => (categories.value || []).find((c: Category) => c.id === id)

// 统计
const totalIncome = computed(() =>
  (transactions.value || [])
    .filter((t: Transaction) => t.type === 'income')
    .reduce((s: number, t: Transaction) => s + t.amount, 0),
)
const totalExpense = computed(() =>
  (transactions.value || [])
    .filter((t: Transaction) => t.type === 'expense')
    .reduce((s: number, t: Transaction) => s + t.amount, 0),
)
const netAmount = computed(() => totalIncome.value - totalExpense.value)

const accountsWithBalance = computed(() => {
  return (accounts.value || []).map((a: Account) => {
    const txs = (transactions.value || []).filter((t: Transaction) => t.accountId === a.id)
    const delta = txs.reduce(
      (s: number, t: Transaction) => s + (t.type === 'income' ? t.amount : -t.amount),
      0,
    )
    return { ...a, balance: a.initialBalance + delta, txCount: txs.length }
  })
})

const categoriesWithStats = computed(() => {
  return (categories.value || []).map((c: Category) => {
    const txs = (transactions.value || []).filter((t: Transaction) => t.categoryId === c.id)
    const totalAmount = txs.reduce((s: number, t: Transaction) => s + t.amount, 0)
    return { ...c, txCount: txs.length, totalAmount }
  })
})

// 格式化
const formatDate = (d: Date | string) => {
  const date = d instanceof Date ? d : new Date(d)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())} ${p(date.getHours())}:${p(date.getMinutes())}`
}

// 清空
const clearAll = async () => {
  try {
    await ElMessageBox.confirm('将清空所有账户、分类、流水数据（本地浏览器），确定继续？', '确认', {
      type: 'warning',
    })
    await db.clearAll()
    ElMessage.success('已清空')
  } catch {
    // cancelled
  }
}

onMounted(async () => {
  // 确保 populate 触发
  await db.accounts.count()
  subscribeAll()
})

onUnmounted(() => {
  subscriptions.forEach((s) => s.unsubscribe())
  subscriptions.length = 0
})
</script>

<style scoped>
.account-book {
  gap: 20px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.summary-card {
  position: relative;
  overflow: hidden;
  padding: 18px 20px;
  border-radius: 20px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: #fff;
  box-shadow: 0 14px 28px rgba(95, 124, 170, 0.14);
}

.summary-card::after {
  content: '';
  position: absolute;
  top: -28px;
  right: -24px;
  width: 92px;
  height: 92px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.16);
  pointer-events: none;
}

.summary-label {
  position: relative;
  z-index: 1;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.94);
  opacity: 1;
  letter-spacing: 0.02em;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
}

.summary-value {
  position: relative;
  z-index: 1;
  font-size: 24px;
  font-weight: 700;
  color: #ffffff;
  font-variant-numeric: tabular-nums;
  line-height: 1.2;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
}

.summary-card.income {
  background: linear-gradient(135deg, #2dcf9f, #56dba5);
}
.summary-card.expense {
  background: linear-gradient(135deg, #ff6f91, #ff8d6b);
}
.summary-card.net {
  background: linear-gradient(135deg, #2f91ff, #7c4dff);
}
.summary-card.net.negative {
  background: linear-gradient(135deg, #ff7a45, #ff5c8a);
}
.summary-card.count {
  background: linear-gradient(135deg, #6f7bf7, #9f6fff);
}

.account-book-tabs {
  border-radius: 24px;
}

.account-book-tabs :deep(.el-tabs__header) {
  margin: 0 0 18px;
}

.account-book-tabs :deep(.el-tabs__nav-wrap::after) {
  display: none;
}

.account-book-tabs :deep(.el-tabs__nav-wrap) {
  display: flex;
  align-items: center;
  padding: 6px;
  border-radius: 18px;
  background: rgba(47, 145, 255, 0.07);
  border: 1px solid rgba(122, 160, 211, 0.14);
}

.account-book-tabs :deep(.el-tabs__nav) {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.account-book-tabs :deep(.el-tabs__active-bar) {
  display: none;
}

.account-book-tabs :deep(.el-tabs__item) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 40px;
  padding: 0 16px;
  border-radius: 14px;
  line-height: 1;
  color: #4d6488;
  font-size: 14px;
  font-weight: 700;
  transition: all 0.2s ease;
}

.account-book-tabs :deep(.el-tabs__item:hover) {
  color: #2f69d0;
}

.account-book-tabs :deep(.el-tabs__item.is-active) {
  color: #2f69d0;
  background: rgba(255, 255, 255, 0.96);
  box-shadow:
    0 10px 20px rgba(95, 124, 170, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.95);
}

.account-book-tabs :deep(.el-tabs__content) {
  padding: 20px;
  border-radius: 22px;
  border: 1px solid rgba(122, 160, 211, 0.14);
  background:
    radial-gradient(circle at top left, rgba(47, 145, 255, 0.06), transparent 22%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(246, 250, 255, 0.94));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

.entry-form {
  max-width: 760px;
}

.account-book :deep(.el-form-item) {
  margin-bottom: 22px;
}

.account-book :deep(.el-form-item__label) {
  color: #42597c;
  font-weight: 700;
}

.account-book :deep(.el-input__wrapper),
.account-book :deep(.el-select__wrapper),
.account-book :deep(.el-textarea__inner),
.account-book :deep(.el-input-number),
.account-book :deep(.el-date-editor.el-input__wrapper) {
  border-radius: 14px;
}

.account-book :deep(.el-input__wrapper),
.account-book :deep(.el-select__wrapper),
.account-book :deep(.el-textarea__inner),
.account-book :deep(.el-input-number__wrapper),
.account-book :deep(.el-date-editor.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.9);
  box-shadow:
    0 1px 0 rgba(255, 255, 255, 0.94) inset,
    0 0 0 1px rgba(122, 160, 211, 0.12);
}

.account-book :deep(.el-input__wrapper.is-focus),
.account-book :deep(.el-select__wrapper.is-focused),
.account-book :deep(.el-textarea__inner:focus),
.account-book :deep(.el-date-editor.el-input__wrapper.is-focus) {
  box-shadow:
    0 0 0 3px rgba(47, 145, 255, 0.1),
    0 0 0 1px rgba(47, 145, 255, 0.18);
}

.account-book :deep(.el-radio-group) {
  display: inline-flex;
  align-items: center;
  overflow: hidden;
  padding: 4px;
  border-radius: 16px;
  background: rgba(47, 145, 255, 0.06);
  border: 1px solid rgba(122, 160, 211, 0.12);
}

.account-book :deep(.el-radio-button__inner) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 86px;
  height: 38px;
  border: none !important;
  border-radius: 12px !important;
  background: transparent;
  box-shadow: none !important;
  color: #5c769c;
  font-weight: 700;
  line-height: 1;
  transform: translateZ(0);
  transition: background-color 0.18s ease, color 0.18s ease, box-shadow 0.18s ease;
}

.account-book :deep(.el-radio-button__original-radio:checked + .el-radio-button__inner) {
  background: linear-gradient(135deg, #2f91ff, #7c4dff);
  color: #fff;
  box-shadow: 0 6px 12px rgba(66, 121, 255, 0.18) !important;
}

.category-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.category-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid rgba(122, 160, 211, 0.14);
  font-size: 13px;
  color: #42597c;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.84);
  cursor: pointer;
  transition: all 0.18s ease;
  user-select: none;
}

.category-chip:hover {
  transform: translateY(-1px);
  background: rgba(255, 255, 255, 0.98);
  border-color: rgba(95, 148, 226, 0.2);
  box-shadow: 0 10px 18px rgba(95, 124, 170, 0.1);
}

.category-chip.active {
  background: linear-gradient(135deg, rgba(47, 145, 255, 0.12), rgba(124, 77, 255, 0.12));
  border-width: 1px;
  font-weight: 700;
  color: #244774;
}

.category-chip .icon {
  font-size: 16px;
}

.account-book :deep(.el-table) {
  --el-table-border-color: rgba(122, 160, 211, 0.12);
  --el-table-header-bg-color: rgba(244, 248, 255, 0.9);
  --el-table-row-hover-bg-color: rgba(47, 145, 255, 0.05);
  border-radius: 18px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.76);
}

.account-book :deep(.el-table__inner-wrapper::before) {
  display: none;
}

.account-book :deep(.el-table th.el-table__cell) {
  background: rgba(244, 248, 255, 0.92);
  color: #5c769c;
  font-weight: 700;
}

.account-book :deep(.el-table td.el-table__cell),
.account-book :deep(.el-table th.el-table__cell) {
  padding: 14px 0;
}

.account-book :deep(.el-table--striped .el-table__body tr.el-table__row--striped td.el-table__cell) {
  background: rgba(247, 250, 255, 0.7);
}

.account-book :deep(.el-table__body tr:hover > td.el-table__cell) {
  background: rgba(47, 145, 255, 0.05) !important;
}

.cat-cell {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: #243755;
  font-weight: 600;
}

.cat-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 12px;
  color: #fff;
  font-size: 16px;
  box-shadow: 0 10px 16px rgba(95, 124, 170, 0.16);
}

.amount-income {
  color: #17b77e;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.amount-expense {
  color: #f05a78;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.inline-form {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
  padding: 16px;
  border-radius: 18px;
  border: 1px solid rgba(122, 160, 211, 0.14);
  background: rgba(255, 255, 255, 0.74);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.footer-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 16px 18px;
  border: 1px dashed rgba(122, 160, 211, 0.2);
  border-radius: 18px;
  margin-top: 4px;
  background: rgba(255, 255, 255, 0.72);
}

.footer-bar .hint {
  font-size: 12px;
  color: #667c9f;
  line-height: 1.6;
}

.footer-bar :deep(.el-button.is-link),
.footer-bar :deep(.el-button.is-text) {
  color: #d84e72;
  font-weight: 700;
}

.footer-bar :deep(.el-button.is-link:hover),
.footer-bar :deep(.el-button.is-text:hover) {
  color: #c83b62;
  background: rgba(255, 111, 145, 0.08);
}

@media (max-width: 768px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .account-book-tabs :deep(.el-tabs__content) {
    padding: 16px;
    border-radius: 18px;
  }

  .entry-form {
    max-width: none;
  }

  .footer-bar {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 640px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .summary-card {
    padding: 16px 18px;
  }
}
</style>
