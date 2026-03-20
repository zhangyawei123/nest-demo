<template>
  <div class="log-container">
    <div class="page-header">
      <h2>操作日志</h2>
      <el-button type="danger" plain @click="handleClear">
        <el-icon><Delete /></el-icon>
        清空日志
      </el-button>
    </div>

    <div class="toolbar">
      <el-input
        v-model="keyword"
        placeholder="搜索用户名/模块/操作"
        clearable
        style="max-width:320px"
        @keyup.enter="handleSearch"
        @clear="handleSearch"
      />
      <el-button type="primary" @click="handleSearch">搜索</el-button>
    </div>

    <el-card class="log-card">
      <el-table :data="list" v-loading="loading" style="width:100%">
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column prop="username" label="用户" width="120" />
        <el-table-column prop="module" label="模块" width="120" />
        <el-table-column prop="action" label="操作" min-width="160" />
        <el-table-column prop="detail" label="详情" min-width="200" show-overflow-tooltip />
        <el-table-column prop="ip" label="IP" width="130" />
        <el-table-column label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 'success' ? 'success' : 'danger'" size="small">
              {{ row.status === 'success' ? '成功' : '失败' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="时间" width="180">
          <template #default="{ row }">{{ fmtDate(row.createdAt) }}</template>
        </el-table-column>
      </el-table>
      <el-pagination
        v-model:current-page="page"
        :page-size="pageSize"
        :total="total"
        layout="total, prev, pager, next"
        style="margin-top:16px;justify-content:flex-end;display:flex"
        @current-change="fetchLogs"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete } from '@element-plus/icons-vue'
import { getOperationLogs, clearOperationLogs } from '@/api/operation-log'

const keyword = ref('')
const loading = ref(false)
const list = ref<any[]>([])
const page = ref(1)
const pageSize = ref(20)
const total = ref(0)

const fetchLogs = async () => {
  loading.value = true
  try {
    const res: any = await getOperationLogs({
      page: page.value,
      pageSize: pageSize.value,
      keyword: keyword.value.trim() || undefined
    })
    list.value = res?.list || []
    total.value = res?.total || 0
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  page.value = 1
  fetchLogs()
}

const handleClear = async () => {
  await ElMessageBox.confirm('确定要清空所有操作日志吗？', '提示', { type: 'warning' })
  await clearOperationLogs()
  ElMessage.success('日志已清空')
  fetchLogs()
}

const fmtDate = (d: string) => new Date(d).toLocaleString('zh-CN')

onMounted(fetchLogs)
</script>

<style scoped>
.log-container { width: 100%; }
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.page-header h2 { margin: 0; font-size: 24px; font-weight: 600; color: #303133; }
.toolbar { display: flex; gap: 12px; margin-bottom: 20px; }
.log-card { border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
</style>
