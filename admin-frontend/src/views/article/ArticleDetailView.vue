<template>
  <div class="article-detail">
    <div class="page-header">
      <el-button @click="goBack">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
      <div class="header-actions" v-if="isMyArticle">
        <el-button type="primary" @click="editArticle">编辑</el-button>
        <el-button type="danger" @click="handleDelete">删除</el-button>
      </div>
    </div>

    <el-card v-loading="loading" class="detail-card">
      <div class="article-header">
        <h1 class="article-title">{{ article.title }}</h1>
        <div class="article-meta">
          <span class="meta-item">
            <el-icon><User /></el-icon>
            {{ article.author?.username || '未知' }}
          </span>
          <span class="meta-item">
            <el-icon><Clock /></el-icon>
            {{ formatDate(article.createdAt) }}
          </span>
        </div>
      </div>

      <div v-if="article.logo" class="article-cover">
        <el-image :src="article.logo" fit="cover" />
      </div>

      <div class="article-content" v-html="article.content"></div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, User, Clock } from '@element-plus/icons-vue'
import { getArticleDetail, deleteArticle } from '@/api/article'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const article = ref<any>({})
const currentUserId = ref(0)

const isMyArticle = ref(false)

const fetchArticleDetail = async (id: number) => {
  loading.value = true
  try {
    const res: any = await getArticleDetail(id)
    article.value = res
    isMyArticle.value = res.authorId === currentUserId.value
  } catch (error) {
    ElMessage.error('获取文章详情失败')
    router.push('/articles')
  } finally {
    loading.value = false
  }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

const goBack = () => {
  router.back()
}

const editArticle = () => {
  router.push(`/articles/edit/${article.value.id}`)
}

const handleDelete = async () => {
  try {
    await ElMessageBox.confirm(`确定要删除文章《${article.value.title}》吗？`, '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    await deleteArticle(article.value.id)
    ElMessage.success('删除成功')
    router.push('/articles')
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

  const id = route.params.id
  if (id) {
    fetchArticleDetail(Number(id))
  }
})
</script>

<style scoped>
.article-detail {
  width: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.detail-card {
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.detail-card :deep(.el-card__body) {
  padding: 40px;
}

.article-header {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid #e6e6e6;
}

.article-title {
  font-size: 32px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px 0;
  line-height: 1.4;
}

.article-meta {
  display: flex;
  gap: 24px;
  color: #909399;
  font-size: 14px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.article-cover {
  margin-bottom: 32px;
  border-radius: 8px;
  overflow: hidden;
}

.article-cover :deep(.el-image) {
  width: 100%;
  max-height: 500px;
}

.article-content {
  font-size: 16px;
  line-height: 1.8;
  color: #303133;
}

.article-content :deep(img) {
  max-width: 100%;
  border-radius: 8px;
  margin: 16px 0;
}

.article-content :deep(p) {
  margin: 16px 0;
}

.article-content :deep(h1),
.article-content :deep(h2),
.article-content :deep(h3) {
  margin: 24px 0 16px 0;
  font-weight: 600;
}

.article-content :deep(code) {
  background: #f5f7fa;
  padding: 2px 8px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
}

.article-content :deep(pre) {
  background: #f5f7fa;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 16px 0;
}

.article-content :deep(blockquote) {
  border-left: 4px solid #667eea;
  padding-left: 16px;
  margin: 16px 0;
  color: #606266;
}
</style>
