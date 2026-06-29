<template>
  <div class="article-list">
    <div class="page-header article-page-header">
      <div class="page-title-block">
        <div class="page-kicker">Content Studio</div>
        <h2>文章管理</h2>
        <p class="page-description">统一查看全部文章、当前列表状态与内容更新情况，快速进入发布、查看和编辑流程。</p>
      </div>
      <div class="header-actions">
        <div class="header-chip">
          <span class="header-chip-label">当前视图</span>
          <span class="header-chip-value">{{ activeTab === 'all' ? '全部文章' : '我的文章' }}</span>
        </div>
        <el-button type="primary" @click="goToCreate">
          <el-icon><Plus /></el-icon>
          发布文章
        </el-button>
      </div>
    </div>

    <div class="overview-grid">
      <div
        v-for="item in overviewCards"
        :key="item.label"
        class="overview-card"
        :class="`overview-card-${item.tone}`"
      >
        <div class="overview-top">
          <span class="overview-label">{{ item.label }}</span>
          <div class="overview-icon">
            <el-icon><component :is="item.icon" /></el-icon>
          </div>
        </div>
        <div class="overview-value">{{ item.value }}</div>
        <div class="overview-desc">{{ item.desc }}</div>
      </div>
    </div>

    <div class="toolbar article-toolbar">
      <div class="toolbar-search">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索标题或内容"
          clearable
          class="search-input"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>
        <span class="search-tip">支持按标题和正文内容快速筛选</span>
      </div>
      <div class="toolbar-actions">
        <el-button @click="handleReset">重置</el-button>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
      </div>
    </div>

    <el-card class="article-card">
      <template #header>
        <div class="article-card-header">
          <div>
            <div class="card-kicker">Article Library</div>
            <div class="card-title-row">内容列表</div>
          </div>
          <span class="card-pill">{{ visibleArticleCount }} 篇</span>
        </div>
      </template>

      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="全部文章" name="all">
          <el-table :data="articleList" v-loading="loading" style="width: 100%">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="title" label="标题" min-width="260">
              <template #default="{ row }">
                <div class="title-cell">
                  <div class="title-main">{{ row.title }}</div>
                  <div class="title-sub">{{ row.author?.username || '未知作者' }} · {{ formatDate(row.createdAt) }}</div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="封面" width="120">
              <template #default="{ row }">
                <LoadingImage
                  v-if="row.logo"
                  :src="assetUrl(row.logo)"
                  fit="cover"
                  class="cover-thumb"
                  :preview-src-list="[assetUrl(row.logo)]"
                />
                <span v-else class="empty-cover">无封面</span>
              </template>
            </el-table-column>
            <el-table-column label="作者" width="120">
              <template #default="{ row }">
                <span class="meta-chip">{{ row.author?.username || '未知' }}</span>
              </template>
            </el-table-column>
            <el-table-column label="阅读" width="80">
              <template #default="{ row }">
                <span class="meta-number">{{ row.viewCount || 0 }}</span>
              </template>
            </el-table-column>
            <el-table-column label="发布时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="240" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="viewDetail(row.id)">查看</el-button>
                <el-button
                  v-if="isMyArticle(row)"
                  size="small"
                  type="primary"
                  @click="editArticle(row.id)"
                >
                  编辑
                </el-button>
                <el-button
                  v-if="isMyArticle(row)"
                  size="small"
                  type="danger"
                  @click="handleDelete(row)"
                >
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <el-tab-pane label="我的文章" name="my">
          <el-table :data="myArticleList" v-loading="loading" style="width: 100%">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="title" label="标题" min-width="260">
              <template #default="{ row }">
                <div class="title-cell">
                  <div class="title-main">{{ row.title }}</div>
                  <div class="title-sub">我的创作 · {{ formatDate(row.createdAt) }}</div>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="封面" width="120">
              <template #default="{ row }">
                <LoadingImage
                  v-if="row.logo"
                  :src="assetUrl(row.logo)"
                  fit="cover"
                  class="cover-thumb"
                  :preview-src-list="[assetUrl(row.logo)]"
                />
                <span v-else class="empty-cover">无封面</span>
              </template>
            </el-table-column>
            <el-table-column label="阅读" width="80">
              <template #default="{ row }">
                <span class="meta-number">{{ row.viewCount || 0 }}</span>
              </template>
            </el-table-column>
            <el-table-column label="发布时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="240" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="viewDetail(row.id)">查看</el-button>
                <el-button size="small" type="primary" @click="editArticle(row.id)">
                  编辑
                </el-button>
                <el-button size="small" type="danger" @click="handleDelete(row)">
                  删除
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search, Document, TrendCharts, User } from '@element-plus/icons-vue'
import { getArticleList, getMyArticles, deleteArticle } from '@/api/article'
import LoadingImage from '@/components/LoadingImage.vue'
import { normalizeAssetUrl } from '@/utils/upload-url'

const router = useRouter()

const activeTab = ref('all')
const loading = ref(false)
const searchKeyword = ref('')
const articleList = ref<any[]>([])
const myArticleList = ref<any[]>([])

const visibleArticleCount = computed(() =>
  activeTab.value === 'all' ? articleList.value.length : myArticleList.value.length
)

const overviewCards = computed(() => [
  {
    label: '全部文章',
    value: articleList.value.length,
    desc: '内容库已加载的文章规模',
    tone: 'blue',
    icon: Document,
  },
  {
    label: '我的创作',
    value: myArticleList.value.length,
    desc: '当前账号的内容沉淀',
    tone: 'purple',
    icon: User,
  },
  {
    label: '当前列表',
    value: visibleArticleCount.value,
    desc: activeTab.value === 'all' ? '正在浏览全部文章' : '正在浏览我的文章',
    tone: 'orange',
    icon: Search,
  },
  {
    label: '检索状态',
    value: searchKeyword.value.trim() ? '已筛选' : '全部',
    desc: searchKeyword.value.trim() || '当前未输入搜索关键词',
    tone: 'cyan',
    icon: TrendCharts,
  },
])

const currentUserId = ref(0)

const assetUrl = (url?: string) => normalizeAssetUrl(url)

const fetchAllArticles = async () => {
  loading.value = true
  try {
    const res: any = await getArticleList({
      keyword: searchKeyword.value.trim() || undefined
    })
    articleList.value = res || []
  } catch (error) {
    ElMessage.error('获取文章列表失败')
  } finally {
    loading.value = false
  }
}

const fetchMyArticles = async () => {
  loading.value = true
  try {
    const res: any = await getMyArticles({
      keyword: searchKeyword.value.trim() || undefined
    })
    myArticleList.value = res || []
  } catch (error) {
    ElMessage.error('获取我的文章失败')
  } finally {
    loading.value = false
  }
}

const handleTabChange = (tab: string) => {
  if (tab === 'all') {
    fetchAllArticles()
  } else {
    fetchMyArticles()
  }
}

const handleSearch = () => {
  if (activeTab.value === 'all') {
    fetchAllArticles()
  } else {
    fetchMyArticles()
  }
}

const handleReset = () => {
  searchKeyword.value = ''
  handleSearch()
}

const isMyArticle = (article: any) => {
  return article.authorId === currentUserId.value
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

const goToCreate = () => {
  router.push('/articles/create')
}

const viewDetail = (id: number) => {
  router.push({ path: '/articles/detail', query: { id } })
}

const editArticle = (id: number) => {
  router.push({ path: '/articles/edit', query: { id } })
}

const handleDelete = async (article: any) => {
  try {
    await ElMessageBox.confirm(`确定要删除文章《${article.title}》吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await deleteArticle(article.id)
    ElMessage.success('删除成功')

    if (activeTab.value === 'all') {
      fetchAllArticles()
    } else {
      fetchMyArticles()
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  const userInfo = localStorage.getItem('userInfo')
  if (userInfo) {
    const user = JSON.parse(userInfo)
    currentUserId.value = user.id
  }
  fetchAllArticles()
  getMyArticles().then((res: any) => {
    if (activeTab.value !== 'my') myArticleList.value = res || []
  }).catch(() => {})
})
</script>

<style scoped>
.article-list {
  width: 100%;
}

.article-page-header {
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

.overview-card-blue::after {
  background: linear-gradient(135deg, #53a8ff, #7c4dff);
}

.overview-card-purple::after {
  background: linear-gradient(135deg, #8b72ff, #b86dff);
}

.overview-card-orange::after {
  background: linear-gradient(135deg, #ffb16d, #ff7db2);
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

.article-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.toolbar-search {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 280px;
  flex: 1;
}

.search-input {
  max-width: 360px;
}

.search-tip {
  color: #8ca0bc;
  font-size: 12px;
}

.toolbar-actions {
  display: flex;
  gap: 12px;
}

.article-card-header {
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

.article-card {
  border-radius: 28px !important;
  border: 1px solid rgba(122, 160, 211, 0.16) !important;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(245, 249, 255, 0.94)) !important;
  box-shadow: 0 18px 38px rgba(95, 124, 170, 0.12) !important;
}

.article-card :deep(.el-card__header) {
  padding: 22px 24px 16px;
  border-bottom: 1px solid rgba(122, 160, 211, 0.12);
}

.article-card :deep(.el-card__body) {
  padding: 22px 24px 24px;
}

.article-card :deep(.el-table) {
  border-radius: 16px;
}

.article-card :deep(.el-button) {
  border-radius: 10px;
}

.article-card :deep(.el-tabs__header) {
  margin-bottom: 18px;
}

.title-cell {
  min-width: 0;
}

.title-main {
  color: #253a59;
  font-size: 14px;
  font-weight: 700;
  line-height: 1.5;
}

.title-sub {
  margin-top: 6px;
  color: #8ca0bc;
  font-size: 12px;
}

.cover-thumb {
  width: 82px;
  height: 60px;
  border-radius: 12px;
  box-shadow: 0 8px 20px rgba(95, 124, 170, 0.12);
}

.empty-cover {
  color: #9aaac2;
  font-size: 12px;
}

.meta-chip {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 10px;
  border-radius: 999px;
  background: rgba(91, 127, 183, 0.08);
  color: #5f789c;
  font-size: 12px;
  font-weight: 600;
}

.meta-number {
  color: #253a59;
  font-weight: 700;
}

@media (max-width: 992px) {
  .overview-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 768px) {
  .article-page-header,
  .article-card-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .overview-grid {
    grid-template-columns: 1fr;
  }

  .toolbar-search {
    min-width: 100%;
  }

  .search-input {
    max-width: 100%;
  }
}
</style>
