<template>
  <div class="article-list">
    <div class="page-header">
      <h2>文章管理</h2>
      <el-button type="primary" @click="goToCreate">
        <el-icon><Plus /></el-icon>
        发布文章
      </el-button>
    </div>

    <el-card class="article-card">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="全部文章" name="all">
          <el-table :data="articleList" v-loading="loading" style="width: 100%">
            <el-table-column prop="id" label="ID" width="80" />
            <el-table-column prop="title" label="标题" min-width="200" />
            <el-table-column label="封面" width="120">
              <template #default="{ row }">
                <el-image
                  v-if="row.logo"
                  :src="row.logo"
                  fit="cover"
                  style="width: 80px; height: 60px; border-radius: 4px"
                  :preview-src-list="[row.logo]"
                />
                <span v-else style="color: #909399">无封面</span>
              </template>
            </el-table-column>
            <el-table-column label="作者" width="120">
              <template #default="{ row }">
                {{ row.author?.username || '未知' }}
              </template>
            </el-table-column>
            <el-table-column label="发布时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
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
            <el-table-column prop="title" label="标题" min-width="200" />
            <el-table-column label="封面" width="120">
              <template #default="{ row }">
                <el-image
                  v-if="row.logo"
                  :src="row.logo"
                  fit="cover"
                  style="width: 80px; height: 60px; border-radius: 4px"
                  :preview-src-list="[row.logo]"
                />
                <span v-else style="color: #909399">无封面</span>
              </template>
            </el-table-column>
            <el-table-column label="发布时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.createdAt) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" fixed="right">
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
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import { getArticleList, getMyArticles, deleteArticle } from '@/api/article'

const router = useRouter()

const activeTab = ref('all')
const loading = ref(false)
const articleList = ref<any[]>([])
const myArticleList = ref<any[]>([])

const currentUserId = ref(0)

const fetchAllArticles = async () => {
  loading.value = true
  try {
    const res: any = await getArticleList()
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
    const res: any = await getMyArticles()
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
  router.push(`/articles/detail/${id}`)
}

const editArticle = (id: number) => {
  router.push(`/articles/edit/${id}`)
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
})
</script>

<style scoped>
.article-list {
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

.article-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.article-card :deep(.el-card__body) {
  padding: 24px;
}

.article-card :deep(.el-table) {
  border-radius: 8px;
}

.article-card :deep(.el-button) {
  border-radius: 6px;
}
</style>
