<template>
  <div class="tool-card">
    <div class="tool-card-header">
      <div>
        <h3>AI 图片描述</h3>
        <p>上传一张图片，AI 帮你生成描述文案。</p>
      </div>
    </div>

    <div class="upload-area">
      <el-upload
        ref="uploadRef"
        :auto-upload="false"
        :show-file-list="false"
        accept="image/*"
        :on-change="handleFileChange"
      >
        <template #trigger>
          <el-button type="primary">选择图片</el-button>
        </template>
      </el-upload>
      <el-button type="success" :loading="loading" :disabled="!selectedFile" @click="doDescribe">
        生成描述
      </el-button>
    </div>

    <div v-if="previewUrl" class="preview-area">
      <img :src="previewUrl" alt="预览" class="preview-img" />
    </div>

    <el-alert v-if="errorMsg" :title="errorMsg" type="error" :closable="false" show-icon />

    <div v-if="description" class="result-panel">
      <div class="result-item">
        <span class="label">图片描述</span>
        <span class="value">{{ description }}</span>
      </div>
      <div class="action-row">
        <el-button @click="copyText(description)">复制描述</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { UploadFile } from 'element-plus'
import request from '@/utils/request'

const selectedFile = ref<File | null>(null)
const previewUrl = ref('')
const loading = ref(false)
const errorMsg = ref('')
const description = ref('')

const handleFileChange = (file: UploadFile) => {
  if (!file.raw) return
  selectedFile.value = file.raw
  previewUrl.value = URL.createObjectURL(file.raw)
  description.value = ''
  errorMsg.value = ''
}

const doDescribe = async () => {
  if (!selectedFile.value) return
  loading.value = true
  errorMsg.value = ''
  description.value = ''

  const formData = new FormData()
  formData.append('file', selectedFile.value)

  try {
    const res: any = await request({
      url: '/vision/recipe-combo',
      method: 'post',
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    })
    description.value = res?.summary || res?.rawReply || JSON.stringify(res)
  } catch (e: any) {
    errorMsg.value = e?.response?.data?.message || e.message || '请求失败'
  } finally {
    loading.value = false
  }
}

const copyText = async (text: string) => {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('已复制')
  } catch {
    ElMessage.error('复制失败')
  }
}
</script>

<style scoped>
.upload-area {
  display: flex;
  gap: 12px;
  align-items: center;
}
.preview-area {
  display: flex;
  justify-content: center;
}
.preview-img {
  max-width: 100%;
  max-height: 300px;
  border-radius: 12px;
  border: 1px solid #ebeef5;
  object-fit: contain;
}
</style>
