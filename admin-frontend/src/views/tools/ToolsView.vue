<template>
  <div class="tools-page">
    <div class="page-header">
      <div class="page-header-copy">
        <span class="page-header-badge">TOOLS HUB</span>
        <h2>小功能</h2>
        <p>这里放一些零散但实用的小工具，统一作为组件收口，不再单独拆新路由。</p>
      </div>
      <div class="page-header-tags">
        <span class="header-tag">轻量工具</span>
        <span class="header-tag">统一入口</span>
        <span class="header-tag">即开即用</span>
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
        <component :is="toolComponents.location" v-if="activeNames.includes('location')" />
      </el-collapse-item>

      <el-collapse-item name="coordinate">
        <template #title>
          <div class="tool-collapse-title">
            <h3>坐标系转换</h3>
            <p>支持 WGS84、GCJ02、BD09 互转，并生成常用地图打开链接。</p>
          </div>
        </template>
        <component :is="toolComponents.coordinate" v-if="activeNames.includes('coordinate')" />
      </el-collapse-item>

      <el-collapse-item name="qrcode">
        <template #title>
          <div class="tool-collapse-title">
            <h3>二维码工具</h3>
            <p>支持文本或链接生成二维码，也可以上传二维码图片直接解析内容。</p>
          </div>
        </template>
        <component :is="toolComponents.qrcode" v-if="activeNames.includes('qrcode')" />
      </el-collapse-item>

      <el-collapse-item name="lottery">
        <template #title>
          <div class="tool-collapse-title">
            <h3>幸运转盘</h3>
            <p>把原来的抽奖页收进工具页，方便直接配置、抽奖和看记录。</p>
          </div>
        </template>
        <component :is="toolComponents.lottery" v-if="activeNames.includes('lottery')" />
      </el-collapse-item>

      <el-collapse-item name="accountBook">
        <template #title>
          <div class="tool-collapse-title">
            <h3>本地记账本</h3>
            <p>基于 Dexie + IndexedDB 的三表关联记账：账户、分类、流水，全部数据只存在浏览器本地。</p>
          </div>
        </template>
        <component :is="toolComponents.accountBook" v-if="activeNames.includes('accountBook')" />
      </el-collapse-item>
    </el-collapse>
  </div>
</template>

<script setup lang="ts">
import { defineAsyncComponent, ref } from 'vue'

const activeNames = ref<string[]>([])
const toolComponents = {
  location: defineAsyncComponent(() => import('./LocationTool.vue')),
  coordinate: defineAsyncComponent(() => import('./CoordinateTransformTool.vue')),
  qrcode: defineAsyncComponent(() => import('./QrCodeTool.vue')),
  lottery: defineAsyncComponent(() => import('./LotteryTool.vue')),
  accountBook: defineAsyncComponent(() => import('./AccountBookTool.vue')),
}
</script>

<style scoped>
.tools-page {
  display: flex;
  flex-direction: column;
  gap: 20px;
  min-height: 100%;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
  padding: 28px;
  background:
    radial-gradient(circle at top right, rgba(255, 255, 255, 0.28), transparent 28%),
    linear-gradient(135deg, #2f91ff 0%, #7c4dff 100%);
  border-radius: 24px;
  color: #fff;
  box-shadow: 0 18px 36px rgba(66, 121, 255, 0.2);
  position: relative;
  overflow: hidden;
}

.page-header::after {
  content: '';
  position: absolute;
  inset: auto -60px -80px auto;
  width: 220px;
  height: 220px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 255, 255, 0.22), transparent 68%);
  pointer-events: none;
}

.page-header-copy {
  position: relative;
  z-index: 1;
  max-width: 680px;
}

.page-header-badge {
  display: inline-flex;
  align-items: center;
  height: 28px;
  padding: 0 12px;
  margin-bottom: 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
  border: 1px solid rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(10px);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.page-header h2 {
  margin: 0 0 8px;
  font-size: 30px;
  line-height: 1.2;
}

.page-header p {
  margin: 0;
  max-width: 620px;
  opacity: 0.92;
  font-size: 14px;
  line-height: 1.7;
}

.page-header-tags {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
  max-width: 300px;
}

.header-tag {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 34px;
  padding: 0 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.22);
  backdrop-filter: blur(8px);
  font-size: 13px;
  font-weight: 600;
}

.tools-collapse {
  --el-collapse-border-color: transparent;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.tools-page :deep(.el-collapse-item) {
  border: 1px solid rgba(122, 160, 211, 0.14);
  border-radius: 22px;
  overflow: hidden;
  box-shadow: 0 12px 28px rgba(95, 124, 170, 0.1);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(245, 249, 255, 0.94));
  transition: transform 0.24s ease, box-shadow 0.24s ease, border-color 0.24s ease;
}

.tools-page :deep(.el-collapse-item:hover) {
  transform: translateY(-2px);
  border-color: rgba(95, 148, 226, 0.22);
  box-shadow: 0 16px 32px rgba(95, 124, 170, 0.14);
}

.tools-page :deep(.el-collapse-item__header) {
  min-height: 88px;
  padding: 18px 24px;
  border: none;
  align-items: center;
  line-height: normal;
  background: transparent;
}

.tools-page :deep(.el-collapse-item__arrow) {
  width: 34px;
  height: 34px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 14px;
  color: #5c769c;
  background: rgba(47, 145, 255, 0.08);
  transition: all 0.2s ease;
}

.tools-page :deep(.is-active > .el-collapse-item__header .el-collapse-item__arrow) {
  color: #2f69d0;
  background: rgba(47, 145, 255, 0.14);
}

.tool-collapse-title h3 {
  margin: 0 0 8px;
  font-size: 20px;
  color: #243755;
  font-weight: 700;
}

.tool-collapse-title p {
  margin: 0;
  color: #7d90af;
  font-size: 14px;
  line-height: 1.6;
}

.tools-page :deep(.el-collapse-item__wrap) {
  border: none;
  background: transparent;
}

.tools-page :deep(.el-collapse-item__content) {
  padding: 0 24px 24px;
}

.tools-page :deep(.tool-panel-content) {
  display: flex;
  flex-direction: column;
  gap: 18px;
  padding: 18px;
  border-radius: 18px;
  border: 1px solid rgba(122, 160, 211, 0.14);
  background:
    radial-gradient(circle at top left, rgba(47, 145, 255, 0.06), transparent 24%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(246, 250, 255, 0.94));
}

.tools-page :deep(.search-row) {
  display: flex;
  gap: 12px;
}

.tools-page :deep(.search-row .el-input) {
  flex: 1;
}

.tools-page :deep(.result-panel) {
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(122, 160, 211, 0.14);
  border-radius: 16px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

.tools-page :deep(.result-item) {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tools-page :deep(.label) {
  font-size: 13px;
  color: #8ca0bc;
}

.tools-page :deep(.value) {
  font-size: 14px;
  color: #243755;
  word-break: break-all;
  line-height: 1.7;
}

.tools-page :deep(.action-row) {
  display: flex;
  gap: 12px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    padding: 22px;
    border-radius: 20px;
  }

  .page-header-tags {
    justify-content: flex-start;
    max-width: none;
  }

  .tools-page :deep(.el-collapse-item__header) {
    padding: 16px 18px;
  }

  .tools-page :deep(.el-collapse-item__content) {
    padding: 0 18px 18px;
  }

  .tools-page :deep(.tool-panel-content) {
    padding: 14px;
    border-radius: 16px;
  }

  .tools-page :deep(.search-row) {
    flex-direction: column;
  }

  .tools-page :deep(.action-row) {
    flex-direction: column;
  }
}
</style>
