<template>
  <div class="tools-page">
    <div class="page-header">
      <div>
        <h2>小功能</h2>
        <p>这里放一些零散但实用的小工具，后面可以继续往这里加。</p>
      </div>
    </div>

    <div class="tool-card">
      <div class="tool-card-header">
        <div>
          <h3>地点转经纬度</h3>
          <p>输入地点名称或详细地址，快速获取标准地址和经纬度。</p>
        </div>
      </div>

      <div class="search-row">
        <el-input
          v-model="address"
          placeholder="请输入地点，例如：遵义市红花岗区中山路街道内环路走马坝市建老徐脆哨"
          clearable
          @keyup.enter="searchLocation"
        />
        <el-button type="primary" :loading="loading" @click="searchLocation">获取经纬度</el-button>
        <el-button @click="openPicker">地图选点</el-button>
      </div>

      <el-alert v-if="errorMessage" :title="errorMessage" type="error" :closable="false" show-icon />

      <div v-if="result" class="result-panel">
        <div class="result-item">
          <span class="label">输入地点</span>
          <span class="value">{{ result.query }}</span>
        </div>
        <div class="result-item">
          <span class="label">标准地址</span>
          <span class="value">{{ result.address }}</span>
        </div>
        <div class="result-item">
          <span class="label">经纬度</span>
          <span class="value">{{ result.location }}</span>
        </div>
        <div class="action-row">
          <el-button @click="copyText(result.location, '经纬度已复制')">复制经纬度</el-button>
          <el-button @click="copyText(result.address, '标准地址已复制')">复制标准地址</el-button>
        </div>
      </div>
    </div>

    <el-dialog v-model="pickerVisible" title="地图选点" width="80%" top="5vh" destroy-on-close>
      <iframe :src="pickerUrl" class="picker-frame" allow="geolocation"></iframe>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'

const mapKey = 'CPEBZ-VERW3-62Q3C-O4O4N-JXBCF-CFBF7'
const address = ref('')
const loading = ref(false)
const errorMessage = ref('')
const pickerVisible = ref(false)
const currentLocation = ref('')

const result = ref<{ query: string; address: string; location: string } | null>(null)

const pickerUrl = computed(() => {
  let url = `https://apis.map.qq.com/tools/locpicker?search=1&type=1&key=${mapKey}&referer=latlng`
  if (address.value.trim()) {
    url += `&addr=${encodeURIComponent(address.value.trim())}`
  }
  if (currentLocation.value) {
    url += `&coord=${currentLocation.value}`
  }
  return url
})

const copyText = async (text: string, message: string) => {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success(message)
  } catch {
    ElMessage.error('复制失败，请手动复制')
  }
}

const renderResult = (query: string, targetAddress: string, lat: number, lng: number) => {
  const location = `${lat},${lng}`
  currentLocation.value = location
  result.value = {
    query,
    address: targetAddress || query,
    location,
  }
}

const searchLocation = () => {
  const query = address.value.trim()
  if (!query) {
    errorMessage.value = '请输入地点'
    result.value = null
    return
  }

  errorMessage.value = ''
  result.value = null
  loading.value = true

  const callbackName = `qqMapGeocoder_${Date.now()}`
  const script = document.createElement('script')

  ;(window as any)[callbackName] = (res: any) => {
    try {
      if (res?.status === 0 && res?.result?.location) {
        renderResult(query, res.result.address || query, res.result.location.lat, res.result.location.lng)
      } else {
        errorMessage.value = res?.message || '未获取到经纬度'
      }
    } finally {
      loading.value = false
      delete (window as any)[callbackName]
      script.remove()
    }
  }

  script.onerror = () => {
    loading.value = false
    errorMessage.value = '请求失败，请检查 Key 或网络'
    delete (window as any)[callbackName]
    script.remove()
  }

  script.src = `https://apis.map.qq.com/ws/geocoder/v1/?address=${encodeURIComponent(query)}&output=jsonp&key=${mapKey}&callback=${callbackName}`
  document.body.appendChild(script)
}

const openPicker = () => {
  pickerVisible.value = true
}

const handleMessage = (event: MessageEvent) => {
  const loc = event.data as any
  if (!loc || loc.module !== 'locationPicker' || !loc.latlng) {
    return
  }
  const targetAddress = loc.poiaddress || loc.poiname || address.value.trim()
  address.value = targetAddress
  errorMessage.value = ''
  renderResult(targetAddress, targetAddress, loc.latlng.lat, loc.latlng.lng)
  pickerVisible.value = false
}

onMounted(() => {
  window.addEventListener('message', handleMessage, false)
})

onBeforeUnmount(() => {
  window.removeEventListener('message', handleMessage, false)
})
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

.tool-card {
  background: #fff;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.tool-card-header h3 {
  margin: 0 0 8px;
  font-size: 20px;
  color: #303133;
}

.tool-card-header p {
  margin: 0;
  color: #606266;
  font-size: 14px;
}

.search-row {
  display: flex;
  gap: 12px;
}

.search-row :deep(.el-input) {
  flex: 1;
}

.result-panel {
  background: #f8fafc;
  border: 1px solid #ebeef5;
  border-radius: 12px;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.result-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.label {
  font-size: 13px;
  color: #909399;
}

.value {
  font-size: 14px;
  color: #303133;
  word-break: break-all;
}

.action-row {
  display: flex;
  gap: 12px;
}

.picker-frame {
  width: 100%;
  height: 70vh;
  border: none;
  border-radius: 10px;
}

@media (max-width: 768px) {
  .search-row {
    flex-direction: column;
  }

  .action-row {
    flex-direction: column;
  }
}
</style>
