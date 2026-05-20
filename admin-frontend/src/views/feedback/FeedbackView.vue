<template>
  <div class="feedback-container">
    <div class="page-header">
      <div>
        <h2>意见反馈</h2>
        <p>查看小程序用户提交的问题、建议和联系方式</p>
      </div>
      <el-button type="primary" @click="fetchList">刷新</el-button>
    </div>

    <el-card class="filter-card">
      <el-form :inline="true" :model="filters">
        <el-form-item label="状态">
          <el-select v-model="filters.status" clearable placeholder="全部状态" style="width: 160px" @change="handleSearch">
            <el-option label="待处理" value="pending" />
            <el-option label="已处理" value="handled" />
            <el-option label="已忽略" value="ignored" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="filters.keyword" clearable placeholder="内容、用户或联系方式" style="width: 240px" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="feedback-card">
      <el-table :data="list" v-loading="loading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="类型" width="110">
          <template #default="{ row }">
            <el-tag>{{ row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="反馈内容" min-width="280" show-overflow-tooltip />
        <el-table-column label="提交用户" width="120">
          <template #default="{ row }">{{ row.username || '未知用户' }}</template>
        </el-table-column>
        <el-table-column label="联系方式" width="160">
          <template #default="{ row }">{{ row.contact || '-' }}</template>
        </el-table-column>
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="statusTag(row.status)">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="提交时间" width="180">
          <template #default="{ row }">{{ fmtDate(row.createdAt) }}</template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button size="small" type="success" :disabled="row.status === 'handled'" @click="setStatus(row, 'handled')">处理</el-button>
            <el-button size="small" :disabled="row.status === 'ignored'" @click="setStatus(row, 'ignored')">忽略</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        class="pagination"
        @current-change="fetchList"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { deleteFeedback, getFeedbackList, updateFeedbackStatus } from '@/api/feedback'

const loading = ref(false)
const list = ref<any[]>([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)
const filters = reactive({ status: '', keyword: '' })

const statusLabel = (status: string) => ({ pending: '待处理', handled: '已处理', ignored: '已忽略' }[status] || status)
const statusTag = (status: string) => ({ pending: 'warning', handled: 'success', ignored: 'info' }[status] || '')
const fmtDate = (date: string) => date ? new Date(date).toLocaleString('zh-CN') : '-'

const fetchList = async () => {
  loading.value = true
  try {
    const res: any = await getFeedbackList({
      page: page.value,
      pageSize: pageSize.value,
      status: filters.status || undefined,
      keyword: filters.keyword || undefined,
    })
    list.value = res?.list || []
    total.value = res?.total || 0
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  page.value = 1
  fetchList()
}

const resetSearch = () => {
  filters.status = ''
  filters.keyword = ''
  handleSearch()
}

const setStatus = async (row: any, status: string) => {
  await updateFeedbackStatus({ id: row.id, status })
  ElMessage.success('状态已更新')
  fetchList()
}

const handleDelete = async (row: any) => {
  await ElMessageBox.confirm('确定删除这条反馈吗？', '提示', { type: 'warning' })
  await deleteFeedback({ id: row.id })
  ElMessage.success('删除成功')
  fetchList()
}

onMounted(fetchList)
</script>

<style scoped>
.feedback-container { width: 100%; }
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.page-header h2 { margin: 0; font-size: 24px; font-weight: 600; color: #303133; }
.page-header p { margin: 8px 0 0; color: #909399; font-size: 14px; }
.filter-card { margin-bottom: 16px; border-radius: 12px; }
.filter-card :deep(.el-form-item) { margin-bottom: 0; }
.feedback-card { border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.pagination { margin-top: 16px; justify-content: flex-end; display: flex; }
</style>
