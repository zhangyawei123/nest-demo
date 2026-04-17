<template>
  <div class="tools-page">
    <div class="page-header">
      <div>
        <h2>小功能</h2>
        <p>这里放一些零散但实用的小工具，统一作为组件收口，不再单独拆新路由。</p>
      </div>
    </div>

    <el-collapse v-model="activeNames" class="tools-collapse">
      <el-collapse-item name="location">
        <template #title>
          <div class="tool-collapse-title">
            <h3>地点转经纬度</h3>
            <p>输入地点名称或详细地址，快速获取标准地址和经纬度。</p>
          </div>
        </template>
        <LocationTool />
      </el-collapse-item>

      <el-collapse-item name="coordinate">
        <template #title>
          <div class="tool-collapse-title">
            <h3>坐标系转换</h3>
            <p>支持 WGS84、GCJ02、BD09 互转，并生成常用地图打开链接。</p>
          </div>
        </template>
        <CoordinateTransformTool />
      </el-collapse-item>

      <el-collapse-item name="qrcode">
        <template #title>
          <div class="tool-collapse-title">
            <h3>二维码工具</h3>
            <p>支持文本或链接生成二维码，也可以上传二维码图片直接解析内容。</p>
          </div>
        </template>
        <QrCodeTool />
      </el-collapse-item>

      <el-collapse-item name="lottery">
        <template #title>
          <div class="tool-collapse-title">
            <h3>幸运转盘</h3>
            <p>把原来的抽奖页收进工具页，方便直接配置、抽奖和看记录。</p>
          </div>
        </template>
        <LotteryTool />
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import LocationTool from './LocationTool.vue'
import CoordinateTransformTool from './CoordinateTransformTool.vue'
import QrCodeTool from './QrCodeTool.vue'
import LotteryTool from './LotteryTool.vue'

const activeNames = ref<string[]>([])
</script>

<style scoped>
.tools-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header {
  padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  color: #fff;
}

.page-header h2 {
  margin: 0 0 8px;
  font-size: 28px;
}

.page-header p {
  margin: 0;
  opacity: 0.92;
  font-size: 14px;
}

.tools-collapse {
  --el-collapse-border-color: transparent;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tools-page :deep(.el-collapse-item) {
  border: none;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
  background: #fff;
}

.tools-page :deep(.el-collapse-item__header) {
  min-height: 88px;
  padding: 18px 24px;
  border: none;
  align-items: center;
  line-height: normal;
  background: #fff;
}

.tool-collapse-title h3 {
  margin: 0 0 8px;
  font-size: 20px;
  color: #303133;
}

.tool-collapse-title p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.tools-page :deep(.el-collapse-item__wrap) {
  border: none;
}

.tools-page :deep(.el-collapse-item__content) {
  padding: 0 24px 24px;
}

.tools-page :deep(.tool-panel-content) {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.tools-page :deep(.search-row) {
  display: flex;
  gap: 12px;
}

.tools-page :deep(.search-row .el-input) {
  flex: 1;
}

.tools-page :deep(.result-panel) {
  background: #f8fafc;
  border: 1px solid #ebeef5;
  border-radius: 12px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.tools-page :deep(.result-item) {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tools-page :deep(.label) {
  font-size: 13px;
  color: #909399;
}

.tools-page :deep(.value) {
  font-size: 14px;
  color: #303133;
  word-break: break-all;
}

.tools-page :deep(.action-row) {
  display: flex;
  gap: 12px;
}

@media (max-width: 768px) {
  .tools-page :deep(.el-collapse-item__header) {
    padding: 16px 18px;
  }

  .tools-page :deep(.el-collapse-item__content) {
    padding: 0 18px 18px;
  }

  .tools-page :deep(.search-row) {
    flex-direction: column;
  }

  .tools-page :deep(.action-row) {
    flex-direction: column;
  }
}
</style>
