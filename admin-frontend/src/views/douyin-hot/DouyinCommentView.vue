<template>
  <div class="douyin-comment">
    <div class="page-header">
      <h2>抖音评论抓取</h2>
    </div>

    <el-card class="input-card">
      <el-form :inline="true" @submit.prevent="handleFetch">
        <el-form-item label="抖音视频链接">
          <el-input
            v-model="videoUrl"
            placeholder="请输入抖音视频链接，如 https://www.douyin.com/video/..."
            style="width: 500px"
            clearable
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :loading="fetching" @click="handleFetch">
            <el-icon><Download /></el-icon>
            抓取评论
          </el-button>
          <el-button :disabled="!videoUrl || fetching" @click="handleQuery">
            查看已抓取
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card v-if="comments.length > 0" class="comment-card" style="margin-top: 16px">
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span>评论列表（共 {{ comments.length }} 条）</span>
          <el-tag type="info">{{ currentUrl }}</el-tag>
        </div>
      </template>

      <el-table :data="comments" style="width: 100%">
        <el-table-column prop="nickname" label="用户" width="150">
          <template #default="{ row }">
            <div style="display: flex; align-items: center; gap: 8px">
              <el-avatar :size="32" :src="row.avatarUrl" />
              <span>{{ row.nickname || '匿名用户' }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="评论内容" min-width="300" />
        <el-table-column prop="likeCount" label="点赞数" width="100" sortable>
          <template #default="{ row }">
            <el-tag type="danger" v-if="row.likeCount > 0">♥ {{ row.likeCount }}</el-tag>
            <span v-else style="color: #999">0</span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="抓取时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createdAt) }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-empty v-else-if="queried" description="暂无评论数据，请先抓取" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Download } from '@element-plus/icons-vue'
import { getComments, fetchComments, type DouyinCommentItem } from '@/api/douyin-comment'

const videoUrl = ref('')
const currentUrl = ref('')
const fetching = ref(false)
const queried = ref(false)
const comments = ref<DouyinCommentItem[]>([])

const handleFetch = async () => {
  if (!videoUrl.value.trim()) {
    ElMessage.warning('请输入抖音视频链接')
    return
  }
  fetching.value = true
  queried.value = false
  comments.value = []
  try {
    ElMessage.info('正在启动浏览器抓取评论，请稍候（约需 15-30 秒）...')
    const res: any = await fetchComments(videoUrl.value.trim())
    comments.value = res || []
    currentUrl.value = videoUrl.value.trim()
    queried.value = true
    ElMessage.success(`抓取成功，共 ${comments.value.length} 条评论`)
  } catch (e: any) {
    ElMessage.error('抓取失败：' + (e?.message || '未知错误'))
  } finally {
    fetching.value = false
  }
}

const handleQuery = async () => {
  if (!videoUrl.value.trim()) return
  try {
    const res: any = await getComments(videoUrl.value.trim())
    comments.value = res || []
    currentUrl.value = videoUrl.value.trim()
    queried.value = true
    if (comments.value.length === 0) {
      ElMessage.info('该链接暂无已抓取的评论')
    }
  } catch (e) {
    ElMessage.error('查询失败')
  }
}

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleString('zh-CN')
}
</script>

<style scoped>
.douyin-comment {
  width: 100%;
}

.page-header {
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
}
</style>
