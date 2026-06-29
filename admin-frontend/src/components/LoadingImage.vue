<template>
  <el-image
    v-bind="$attrs"
    :src="src"
    :fit="fit"
    :lazy="lazy"
    :preview-src-list="previewSrcList"
    :initial-index="initialIndex"
    :preview-teleported="previewTeleported"
    class="loading-image"
  >
    <template #placeholder>
      <div class="image-state image-state-loading">
        <el-icon class="loading-icon"><Loading /></el-icon>
        <span>{{ loadingText }}</span>
      </div>
    </template>
    <template #error>
      <div class="image-state image-state-error">
        <el-icon><Picture /></el-icon>
        <span>{{ errorText }}</span>
      </div>
    </template>
  </el-image>
</template>

<script setup lang="ts">
import { Loading, Picture } from '@element-plus/icons-vue'

defineOptions({
  inheritAttrs: false,
})

withDefaults(
  defineProps<{
    src?: string
    fit?: 'fill' | 'contain' | 'cover' | 'none' | 'scale-down'
    lazy?: boolean
    previewSrcList?: string[]
    initialIndex?: number
    previewTeleported?: boolean
    loadingText?: string
    errorText?: string
  }>(),
  {
    src: '',
    fit: 'cover',
    lazy: false,
    previewSrcList: () => [],
    initialIndex: 0,
    previewTeleported: false,
    loadingText: '图片加载中',
    errorText: '加载失败',
  },
)
</script>

<style scoped>
.loading-image {
  overflow: hidden;
}

.image-state {
  width: 100%;
  height: 100%;
  min-height: inherit;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  background:
    linear-gradient(135deg, rgba(247, 250, 255, 0.96), rgba(239, 245, 255, 0.96));
  color: #7d90af;
  font-size: 12px;
  text-align: center;
}

.image-state-error {
  color: #a8abb2;
}

.loading-icon {
  animation: image-loading-rotate 1s linear infinite;
}

@keyframes image-loading-rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}
</style>
