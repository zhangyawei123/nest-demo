<template>
  <div class="douyin-hot-list">
    <div class="page-header hot-page-header">
      <div class="page-title-block">
        <div class="page-kicker">Trend Radar</div>
        <h2>抖音热点榜</h2>
        <p class="page-description">实时追踪抖音热点趋势，快速浏览热度值、更新时间与话题入口，适合做内容选题参考。</p>
      </div>

      <div class="header-actions">
        <div class="header-chip">
          <span class="header-chip-label">最近更新</span>
          <span class="header-chip-value">{{ latestUpdatedAt }}</span>
        </div>
        <el-button type="primary" :loading="loading" @click="handleRefresh">
          <el-icon><Refresh /></el-icon>
          刷新热点
        </el-button>
      </div>
    </div>

    <div class="overview-grid">
      <div class="overview-card overview-card-pink">
        <div class="overview-top">
          <span class="overview-label">榜单条数</span>
          <div class="overview-icon"><el-icon><Histogram /></el-icon></div>
        </div>
        <div class="overview-value">{{ hotList.length }}</div>
        <div class="overview-desc">当前已同步的抖音热点话题数量</div>
      </div>

      <div class="overview-card overview-card-blue">
        <div class="overview-top">
          <span class="overview-label">榜首热度</span>
          <div class="overview-icon"><el-icon><DataLine /></el-icon></div>
        </div>
        <div class="overview-value">{{ formatHotValue(topHotValue) }}</div>
        <div class="overview-desc">当前排名第一话题的热度值</div>
      </div>

      <div class="overview-card overview-card-orange">
        <div class="overview-top">
          <span class="overview-label">平均热度</span>
          <div class="overview-icon"><el-icon><TrendCharts /></el-icon></div>
        </div>
        <div class="overview-value">{{ formatHotValue(averageHotValue) }}</div>
        <div class="overview-desc">当前榜单整体热度的平均水平</div>
      </div>

      <div class="overview-card overview-card-cyan">
        <div class="overview-top">
          <span class="overview-label">榜单状态</span>
          <div class="overview-icon"><el-icon><Timer /></el-icon></div>
        </div>
        <div class="overview-value">{{ hotList.length ? '在线' : '空榜' }}</div>
        <div class="overview-desc">接口已适配直接返回数组的数据结构</div>
      </div>
    </div>

    <el-card class="hot-card">
      <template #header>
        <div class="hot-card-header">
          <div>
            <div class="card-kicker">Hotboard Overview</div>
            <div class="card-title-row">热点榜单</div>
          </div>
          <span class="card-pill">Top {{ hotList.length }}</span>
        </div>
      </template>

      <el-table :data="hotList" v-loading="loading" style="width: 100%">
        <el-table-column label="排名" width="80">
          <template #default="{ row }">
            <div class="rank-badge" :class="'rank-' + row.rank">
              {{ row.rank }}
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" min-width="300">
          <template #default="{ row }">
            <div class="title-cell">
              <a
                class="hot-title"
                :href="row.url"
                target="_blank"
                rel="noopener noreferrer"
              >
                {{ row.title }}
              </a>
              <div class="title-sub">抖音搜索热词 · 排名 {{ row.rank }}</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="热度" width="150">
          <template #default="{ row }">
            <div class="hot-value">
              <span class="hot-pill">🔥 {{ formatHotValue(row.hotValue) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="更新时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.url" type="primary" plain size="small" @click="openHotLink(row.url)">
              <el-icon><Promotion /></el-icon>
              查看热点
            </el-button>
            <span v-else class="action-placeholder">无链接</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Histogram, DataLine, TrendCharts, Timer, PictureFilled, Promotion } from '@element-plus/icons-vue'
import { getDouyinHotList, refreshDouyinHotList, type DouyinHotItem } from '@/api/douyin-hot'

const loading = ref(false)
const hotList = ref<DouyinHotItem[]>([])

const normalizedHotList = (payload: unknown): DouyinHotItem[] => {
  if (Array.isArray(payload)) {
    return [...payload].sort((a, b) => a.rank - b.rank)
  }
  if (payload && typeof payload === 'object' && Array.isArray((payload as any).list)) {
    return [...(payload as any).list].sort((a: DouyinHotItem, b: DouyinHotItem) => a.rank - b.rank)
  }
  return []
}

const latestUpdatedAt = computed(() => {
  if (!hotList.value.length) return '--'
  return formatDate(hotList.value[0]?.createdAt || '')
})

const topHotValue = computed(() => hotList.value[0]?.hotValue || 0)

const averageHotValue = computed(() => {
  if (!hotList.value.length) return 0
  const total = hotList.value.reduce((sum, item) => sum + (item.hotValue || 0), 0)
  return Math.round(total / hotList.value.length)
})

const fetchHotList = async () => {
  loading.value = true
  try {
    const res = await getDouyinHotList()
    hotList.value = normalizedHotList(res)
  } catch (error) {
    ElMessage.error('获取抖音热点榜失败')
  } finally {
    loading.value = false
  }
}

const handleRefresh = async () => {
  loading.value = true
  try {
    const res = await refreshDouyinHotList()
    hotList.value = normalizedHotList(res)
    ElMessage.success('热点榜已刷新')
  } catch (error) {
    ElMessage.error('刷新热点榜失败')
  } finally {
    loading.value = false
  }
}

const openHotLink = (url?: string) => {
  if (!url) {
    ElMessage.warning('当前热点没有可打开的链接')
    return
  }
  window.open(url, '_blank', 'noopener,noreferrer')
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

.hot-page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.page-title-block {
  min-width: 0;
}

.page-kicker {
  margin-bottom: 8px;
  color: #8ca0bc;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.page-header h2 {
  margin: 0;
  font-size: 30px;
  font-weight: 700;
  color: #243755;
}

.page-description {
  margin-top: 10px;
  color: #7d90af;
  font-size: 14px;
  line-height: 1.7;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.header-chip {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.76);
  border: 1px solid rgba(122, 160, 211, 0.16);
  box-shadow: 0 10px 22px rgba(91, 119, 164, 0.08);
}

.header-chip-label {
  color: #8ca0bc;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.header-chip-value {
  color: #294063;
  font-size: 14px;
  font-weight: 700;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 20px;
}

.overview-card {
  position: relative;
  padding: 20px;
  border-radius: 24px;
  border: 1px solid rgba(122, 160, 211, 0.16);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(245, 249, 255, 0.94));
  box-shadow: 0 16px 32px rgba(95, 124, 170, 0.1);
  overflow: hidden;
}

.overview-card::after {
  content: '';
  position: absolute;
  right: -24px;
  top: -24px;
  width: 108px;
  height: 108px;
  border-radius: 50%;
  opacity: 0.16;
}

.overview-card-pink::after {
  background: linear-gradient(135deg, #ff7db2, #ff9f6e);
}

.overview-card-blue::after {
  background: linear-gradient(135deg, #53a8ff, #7c4dff);
}

.overview-card-orange::after {
  background: linear-gradient(135deg, #ffb16d, #ffd95c);
}

.overview-card-cyan::after {
  background: linear-gradient(135deg, #3ecfff, #38d8c0);
}

.overview-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.overview-label {
  color: #7f91ae;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.overview-icon {
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.72);
  color: #2f91ff;
  box-shadow: inset 0 0 18px rgba(47, 145, 255, 0.08);
}

.overview-value {
  margin-top: 20px;
  color: #243755;
  font-size: 32px;
  font-weight: 700;
  line-height: 1.1;
}

.overview-desc {
  margin-top: 10px;
  color: #8ca0bc;
  font-size: 13px;
  line-height: 1.6;
}

.hot-card {
  border-radius: 28px !important;
  border: 1px solid rgba(122, 160, 211, 0.16) !important;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(245, 249, 255, 0.94)) !important;
  box-shadow: 0 18px 38px rgba(95, 124, 170, 0.12) !important;
}

.hot-card :deep(.el-card__header) {
  padding: 22px 24px 16px;
  border-bottom: 1px solid rgba(122, 160, 211, 0.12);
}

.hot-card :deep(.el-card__body) {
  padding: 22px 24px 24px;
}

.hot-card :deep(.el-table) {
  border-radius: 16px;
}

.hot-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.card-kicker {
  margin-bottom: 8px;
  color: #8ca0bc;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.card-title-row {
  color: #243755;
  font-size: 18px;
  font-weight: 700;
}

.card-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(47, 145, 255, 0.12), rgba(124, 77, 255, 0.12));
  color: #2f69d0;
  font-size: 12px;
  font-weight: 700;
}

.rank-badge {
  width: 36px;
  height: 36px;
  border-radius: 14px;
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
  background: linear-gradient(135deg, #8ea3c3, #6e85ad);
  font-size: 12px;
}

.cover-thumb {
  width: 82px;
  height: 60px;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(95, 124, 170, 0.12);
}

.cover-placeholder {
  width: 82px;
  height: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98), rgba(240, 246, 255, 0.95));
  border: 1px dashed rgba(122, 160, 211, 0.18);
  color: #90a2bc;
  font-size: 12px;
}

.title-cell {
  min-width: 0;
}

.hot-title {
  color: #253a59;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.6;
  text-decoration: none;
}

.hot-title:hover {
  color: #2f69d0;
}

.title-sub {
  margin-top: 6px;
  color: #8ca0bc;
  font-size: 12px;
}

.hot-value {
  display: flex;
  align-items: center;
}

.hot-pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(255, 111, 145, 0.12), rgba(255, 180, 84, 0.16));
  color: #e05b7f;
  font-size: 12px;
  font-weight: 700;
}

.action-placeholder {
  color: #9aaac2;
  font-size: 12px;
}

@media (max-width: 992px) {
  .overview-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .hot-page-header,
  .hot-card-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .overview-grid {
    grid-template-columns: 1fr;
  }
}
</style>
