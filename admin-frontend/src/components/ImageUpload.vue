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
  const url = `/api${fileUrl}`
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
  display: inline-flex;
  flex-direction: column;
}

.image-preview {
  position: relative;
  width: 240px;
  height: 164px;
  border-radius: 22px;
  overflow: hidden;
  cursor: pointer;
  box-shadow: 0 16px 32px rgba(95, 124, 170, 0.14);
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
  background: linear-gradient(180deg, rgba(16, 31, 59, 0.06), rgba(16, 31, 59, 0.46));
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.24s ease;
}

.image-preview:hover .image-mask {
  opacity: 1;
}

.mask-icon {
  font-size: 32px;
  color: #fff;
}

.upload-placeholder {
  width: 240px;
  height: 164px;
  border: 1px dashed rgba(122, 160, 211, 0.28);
  border-radius: 22px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.94), rgba(241, 247, 255, 0.92));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.96),
    0 14px 28px rgba(95, 124, 170, 0.08);
  transition: all 0.24s ease;
}

.upload-placeholder:hover {
  border-color: rgba(47, 145, 255, 0.34);
  transform: translateY(-2px);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.98),
    0 18px 34px rgba(95, 124, 170, 0.12);
}

.upload-icon {
  font-size: 42px;
  color: #4d8ff5;
  margin-bottom: 12px;
}

.upload-text {
  font-size: 14px;
  color: #51647f;
  font-weight: 700;
}

.upload-tip {
  margin-top: 8px;
  font-size: 12px;
  color: #8ca0bc;
}
</style>
