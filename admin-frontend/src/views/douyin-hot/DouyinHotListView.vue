<template>
  <div class="douyin-hot-list">
    <div class="page-header">
      <h2>抖音热点榜</h2>
      <el-button type="primary" @click="handleRefresh">
        <el-icon><Refresh /></el-icon>
        刷新热点
      </el-button>
    </div>

    <el-card class="hot-card">
      <el-table :data="hotList" v-loading="loading" style="width: 100%">
        <el-table-column label="排名" width="80">
          <template #default="{ row }">
            <div class="rank-badge" :class="'rank-' + row.rank">
              {{ row.rank }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="封面" width="120">
          <template #default="{ row }">
            <el-image
              v-if="row.cover"
              :src="row.cover"
              fit="cover"
              style="width: 80px; height: 60px; border-radius: 4px"
              :preview-src-list="[row.cover]"
              preview-teleported
            />
            <span v-else style="color: #909399">无封面</span>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="300">
          <template #default="{ row }">
            <div class="hot-title">
              {{ row.title }}
            </div>
          </template>
        </el-table-column>
        <el-table-column label="热度" width="150">
          <template #default="{ row }">
            <div class="hot-value">
              <el-tag type="danger" size="small">
                🔥 {{ formatHotValue(row.hotValue) }}
              </el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import { getDouyinHotList, refreshDouyinHotList, type DouyinHotItem } from '@/api/douyin-hot'

const loading = ref(false)
const hotList = ref<DouyinHotItem[]>([])

const fetchHotList = async () => {
  loading.value = true
  try {
    const res: any = await getDouyinHotList()
    hotList.value = res || []
  } catch (error) {
    ElMessage.error('获取抖音热点榜失败')
  } finally {
    loading.value = false
  }
}

const handleRefresh = async () => {
  loading.value = true
  try {
    const res: any = await refreshDouyinHotList()
    hotList.value = res || []
    ElMessage.success('热点榜已刷新')
  } catch (error) {
    ElMessage.error('刷新热点榜失败')
  } finally {
    loading.value = false
  }
}

const formatHotValue = (value: number): string => {
  if (value >= 10000000) {
    return (value / 10000000).toFixed(1) + '千万'
  } else if (value >= 10000) {
    return (value / 10000).toFixed(1) + '万'
  }
  return value.toString()
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

onMounted(() => {
  fetchHotList()
})
</script>

<style scoped>
.douyin-hot-list {
  width: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-header h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.hot-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.hot-card :deep(.el-card__body) {
  padding: 24px;
}

.hot-card :deep(.el-table) {
  border-radius: 8px;
}

.hot-card :deep(.el-button) {
  border-radius: 6px;
}

.rank-badge {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: white;
  font-size: 14px;
}

.rank-1 {
  background: linear-gradient(135deg, #ffd700, #ffb700);
}

.rank-2 {
  background: linear-gradient(135deg, #c0c0c0, #a0a0a0);
}

.rank-3 {
  background: linear-gradient(135deg, #cd7f32, #b06c2a);
}

.rank-badge:not(.rank-1):not(.rank-2):not(.rank-3) {
  background: #909399;
  font-size: 12px;
}

.hot-title {
  font-weight: 500;
  color: #303133;
}

.hot-value {
  display: flex;
  align-items: center;
}
</style>
