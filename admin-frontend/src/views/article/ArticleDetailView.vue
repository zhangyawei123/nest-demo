<template>
  <div class="article-detail">
    <div class="page-header detail-page-header">
      <div class="page-title-block">
        <div class="page-kicker">Article Detail</div>
        <h2>文章详情</h2>
        <p class="page-description">在更沉浸的内容阅读视图中查看标题、封面、作者信息和正文细节。</p>
      </div>
      <div class="header-actions">
        <el-button @click="goBack">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <template v-if="isMyArticle">
          <el-button type="primary" @click="editArticle">编辑</el-button>
          <el-button type="danger" @click="handleDelete">删除</el-button>
        </template>
      </div>
    </div>

    <el-card v-loading="loading" class="detail-card">
      <div class="article-hero">
        <div class="hero-main">
          <div class="hero-kicker">Creative Reading</div>
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
            <span class="meta-item">
              <el-icon><View /></el-icon>
              {{ article.viewCount || 0 }} 阅读
            </span>
          </div>
        </div>

        <div class="hero-side">
          <div class="hero-stat-card">
            <span class="hero-stat-label">阅读量</span>
            <strong class="hero-stat-value">{{ article.viewCount || 0 }}</strong>
            <span class="hero-stat-desc">当前文章累计访问</span>
          </div>
          <div class="hero-stat-card hero-stat-card-soft">
            <span class="hero-stat-label">内容长度</span>
            <strong class="hero-stat-value">{{ contentWordCount }}</strong>
            <span class="hero-stat-desc">按正文字符估算</span>
          </div>
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
import { computed, ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, User, Clock, View } from '@element-plus/icons-vue'
import { getArticleDetail, deleteArticle } from '@/api/article'
import { normalizeAssetUrl, normalizeHtmlAssetUrls } from '@/utils/upload-url'

const router = useRouter()
const route = useRoute()

const loading = ref(false)
const article = ref<any>({})
const currentUserId = ref(0)

const isMyArticle = ref(false)

const contentWordCount = computed(() => {
  const html = article.value?.content || ''
  return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim().length
})

const fetchArticleDetail = async (id: number) => {
  loading.value = true
  try {
    const res: any = await getArticleDetail(id)
    article.value = {
      ...res,
      logo: normalizeAssetUrl(res.logo),
      content: normalizeHtmlAssetUrls(res.content),
    }
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
  router.push({ path: '/articles/edit', query: { id: article.value.id } })
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

  const id = route.query.id
  if (id) {
    fetchArticleDetail(Number(id))
  }
})
</script>

<style scoped>
.article-detail {
  width: 100%;
}

.detail-page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
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
  color: #243755;
  font-size: 30px;
  font-weight: 700;
}

.page-description {
  margin-top: 10px;
  color: #7d90af;
  font-size: 14px;
  line-height: 1.7;
}

.detail-card {
  border-radius: 30px !important;
  border: 1px solid rgba(122, 160, 211, 0.16) !important;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(245, 249, 255, 0.94)) !important;
  box-shadow: 0 18px 42px rgba(95, 124, 170, 0.12) !important;
}

.detail-card :deep(.el-card__body) {
  padding: 32px;
}

.article-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 260px;
  gap: 20px;
  align-items: stretch;
  margin-bottom: 32px;
  padding: 28px;
  border-radius: 26px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.94), rgba(239, 245, 255, 0.9));
  border: 1px solid rgba(122, 160, 211, 0.16);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.92);
}

.hero-kicker {
  display: inline-flex;
  align-items: center;
  height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  background: linear-gradient(135deg, rgba(47, 145, 255, 0.12), rgba(124, 77, 255, 0.12));
  color: #2f69d0;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.article-title {
  font-size: 34px;
  font-weight: 700;
  color: #243755;
  margin: 18px 0 20px 0;
  line-height: 1.4;
}

.article-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  color: #8ca0bc;
  font-size: 14px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.hero-side {
  display: grid;
  gap: 14px;
}

.hero-stat-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  min-height: 132px;
  padding: 20px 22px;
  border-radius: 22px;
  background: linear-gradient(135deg, #2f91ff 0%, #7c4dff 100%);
  color: #fff;
  box-shadow: 0 18px 32px rgba(47, 145, 255, 0.2);
}

.hero-stat-card-soft {
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(122, 160, 211, 0.14);
  color: #243755;
  box-shadow: 0 14px 24px rgba(95, 124, 170, 0.08);
}

.hero-stat-label {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
  opacity: 0.82;
}

.hero-stat-value {
  margin: 12px 0 6px;
  font-size: 34px;
  line-height: 1;
}

.hero-stat-desc {
  font-size: 13px;
  opacity: 0.78;
}

.article-cover {
  margin-bottom: 32px;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 18px 36px rgba(95, 124, 170, 0.12);
}

.article-cover :deep(.el-image) {
  width: 100%;
  max-height: 540px;
}

.article-content {
  font-size: 16px;
  line-height: 1.8;
  color: #30435f;
}

.article-content :deep(*) {
  max-width: 100%;
}

.article-content :deep(img) {
  max-width: 100%;
  border-radius: 18px;
  margin: 20px 0;
  box-shadow: 0 12px 28px rgba(95, 124, 170, 0.12);
}

.article-content :deep(p) {
  margin: 18px 0;
}

.article-content :deep(h1),
.article-content :deep(h2),
.article-content :deep(h3) {
  margin: 30px 0 16px 0;
  font-weight: 700;
  color: #22324c;
}

.article-content :deep(code) {
  background: rgba(47, 145, 255, 0.08);
  padding: 3px 8px;
  border-radius: 8px;
  font-family: 'Courier New', monospace;
  color: #2f69d0;
}

.article-content :deep(pre) {
  background: linear-gradient(180deg, rgba(246, 250, 255, 0.98), rgba(238, 245, 255, 0.96));
  padding: 18px 20px;
  border-radius: 20px;
  overflow-x: auto;
  margin: 22px 0;
  border: 1px solid rgba(122, 160, 211, 0.14);
}

.article-content :deep(blockquote) {
  border-left: 4px solid #2f91ff;
  padding: 4px 0 4px 16px;
  margin: 22px 0;
  color: #5d7395;
  background: linear-gradient(90deg, rgba(47, 145, 255, 0.06), transparent);
}

@media (max-width: 1024px) {
  .article-hero {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .detail-page-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .detail-card :deep(.el-card__body) {
    padding: 22px 18px;
  }

  .article-hero {
    padding: 22px 18px;
  }

  .article-title {
    font-size: 28px;
  }
}
</style>
