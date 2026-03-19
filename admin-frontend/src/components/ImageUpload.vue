<template>
  <div class="image-upload">
    <el-upload
      :action="uploadUrl"
      :headers="headers"
      :show-file-list="false"
      :on-success="handleSuccess"
      :on-error="handleError"
      :before-upload="beforeUpload"
      accept="image/*"
    >
      <div v-if="imageUrl" class="image-preview">
        <el-image :src="imageUrl" fit="cover" />
        <div class="image-mask">
          <el-icon class="mask-icon"><Edit /></el-icon>
        </div>
      </div>
      <div v-else class="upload-placeholder">
        <el-icon class="upload-icon"><Plus /></el-icon>
        <div class="upload-text">上传图片</div>
      </div>
    </el-upload>
    <div class="upload-tip">支持 jpg、png、gif、webp 格式，大小不超过 5MB</div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Edit } from '@element-plus/icons-vue'

const props = defineProps<{
  modelValue?: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const uploadUrl = ref('/api/upload/image')
const headers = ref({
  Authorization: `Bearer ${localStorage.getItem('token')}`
})

const imageUrl = ref(props.modelValue || '')

watch(() => props.modelValue, (newVal) => {
  imageUrl.value = newVal || ''
})

const beforeUpload = (file: File) => {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5

  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB')
    return false
  }
  return true
}

const handleSuccess = (response: any) => {
  // 后端统一响应格式：{ code: 200, data: { url: '...' } }
  const fileUrl = response?.data?.url || response?.url
  if (!fileUrl) {
    ElMessage.error('上传失败：无法获取文件地址')
    return
  }
  const url = `http://localhost:3000${fileUrl}`
  imageUrl.value = url
  emit('update:modelValue', url)
  ElMessage.success('上传成功')
}

const handleError = () => {
  ElMessage.error('上传失败')
}
</script>

<style scoped>
.image-upload {
  display: inline-block;
}

.image-preview {
  position: relative;
  width: 200px;
  height: 150px;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
}

.image-preview :deep(.el-image) {
  width: 100%;
  height: 100%;
}

.image-mask {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.image-preview:hover .image-mask {
  opacity: 1;
}

.mask-icon {
  font-size: 32px;
  color: #fff;
}

.upload-placeholder {
  width: 200px;
  height: 150px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;
}

.upload-placeholder:hover {
  border-color: #667eea;
  background: #f5f7fa;
}

.upload-icon {
  font-size: 48px;
  color: #8c939d;
  margin-bottom: 8px;
}

.upload-text {
  font-size: 14px;
  color: #8c939d;
}

.upload-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #909399;
}
</style>
