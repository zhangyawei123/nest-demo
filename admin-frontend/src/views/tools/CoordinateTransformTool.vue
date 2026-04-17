<template>
  <div class="tool-panel-content">
    <div class="tool-grid">
      <el-select v-model="sourceType">
        <el-option label="WGS84" value="WGS84" />
        <el-option label="GCJ02" value="GCJ02" />
        <el-option label="BD09" value="BD09" />
      </el-select>
      <el-select v-model="targetType">
        <el-option label="WGS84" value="WGS84" />
        <el-option label="GCJ02" value="GCJ02" />
        <el-option label="BD09" value="BD09" />
      </el-select>
    </div>

    <div class="tool-grid">
      <el-input v-model="longitude" placeholder="请输入经度，例如 106.715444" />
      <el-input v-model="latitude" placeholder="请输入纬度，例如 26.578343" />
    </div>

    <div class="action-row">
      <el-button type="primary" @click="handleConvert">开始转换</el-button>
      <el-button @click="swapTypes">交换坐标系</el-button>
      <el-button :disabled="!result" @click="useResultAsInput">结果回填</el-button>
    </div>

    <el-alert v-if="errorMessage" :title="errorMessage" type="error" :closable="false" show-icon />

    <div v-if="result" class="result-panel">
      <div class="result-item">
        <span class="label">原始坐标</span>
        <span class="value">{{ result.sourceText }}</span>
      </div>
      <div class="result-item">
        <span class="label">转换结果</span>
        <span class="value">{{ result.targetText }}</span>
      </div>
      <div class="result-item">
        <span class="label">目标坐标系</span>
        <span class="value">{{ targetType }}</span>
      </div>
      <div class="action-row">
        <el-button @click="copyText(result.targetText, '转换结果已复制')">复制结果</el-button>
        <el-button @click="copyText(result.targetLongitude, '经度已复制')">复制经度</el-button>
        <el-button @click="copyText(result.targetLatitude, '纬度已复制')">复制纬度</el-button>
      </div>

      <div class="map-links">
        <a :href="mapLinks.amap" target="_blank" rel="noopener noreferrer">高德打开</a>
        <a :href="mapLinks.tencent" target="_blank" rel="noopener noreferrer">腾讯打开</a>
        <a :href="mapLinks.baidu" target="_blank" rel="noopener noreferrer">百度打开</a>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'

type CoordType = 'WGS84' | 'GCJ02' | 'BD09'

interface ConvertResult {
  sourceText: string
  targetText: string
  targetLongitude: string
  targetLatitude: string
  rawLongitude: number
  rawLatitude: number
}

const sourceType = ref<CoordType>('WGS84')
const targetType = ref<CoordType>('GCJ02')
const longitude = ref('')
const latitude = ref('')
const errorMessage = ref('')
const result = ref<ConvertResult | null>(null)

const PI = Math.PI
const X_PI = (PI * 3000.0) / 180.0
const A = 6378245.0
const EE = 0.00669342162296594323

const formatCoordinate = (value: number) => value.toFixed(6)

const outOfChina = (lng: number, lat: number) => lng < 72.004 || lng > 137.8347 || lat < 0.8293 || lat > 55.8271

const transformLat = (lng: number, lat: number) => {
  let ret = -100.0 + 2.0 * lng + 3.0 * lat + 0.2 * lat * lat + 0.1 * lng * lat + 0.2 * Math.sqrt(Math.abs(lng))
  ret += ((20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0) / 3.0
  ret += ((20.0 * Math.sin(lat * PI) + 40.0 * Math.sin((lat / 3.0) * PI)) * 2.0) / 3.0
  ret += ((160.0 * Math.sin((lat / 12.0) * PI) + 320.0 * Math.sin((lat * PI) / 30.0)) * 2.0) / 3.0
  return ret
}

const transformLng = (lng: number, lat: number) => {
  let ret = 300.0 + lng + 2.0 * lat + 0.1 * lng * lng + 0.1 * lng * lat + 0.1 * Math.sqrt(Math.abs(lng))
  ret += ((20.0 * Math.sin(6.0 * lng * PI) + 20.0 * Math.sin(2.0 * lng * PI)) * 2.0) / 3.0
  ret += ((20.0 * Math.sin(lng * PI) + 40.0 * Math.sin((lng / 3.0) * PI)) * 2.0) / 3.0
  ret += ((150.0 * Math.sin((lng / 12.0) * PI) + 300.0 * Math.sin((lng / 30.0) * PI)) * 2.0) / 3.0
  return ret
}

const wgs84ToGcj02 = (lng: number, lat: number) => {
  if (outOfChina(lng, lat)) return [lng, lat] as const
  let dLat = transformLat(lng - 105.0, lat - 35.0)
  let dLng = transformLng(lng - 105.0, lat - 35.0)
  const radLat = (lat / 180.0) * PI
  let magic = Math.sin(radLat)
  magic = 1 - EE * magic * magic
  const sqrtMagic = Math.sqrt(magic)
  dLat = (dLat * 180.0) / (((A * (1 - EE)) / (magic * sqrtMagic)) * PI)
  dLng = (dLng * 180.0) / ((A / sqrtMagic) * Math.cos(radLat) * PI)
  return [lng + dLng, lat + dLat] as const
}

const gcj02ToWgs84 = (lng: number, lat: number) => {
  if (outOfChina(lng, lat)) return [lng, lat] as const
  const [mgLng, mgLat] = wgs84ToGcj02(lng, lat)
  return [lng * 2 - mgLng, lat * 2 - mgLat] as const
}

const gcj02ToBd09 = (lng: number, lat: number) => {
  const z = Math.sqrt(lng * lng + lat * lat) + 0.00002 * Math.sin(lat * X_PI)
  const theta = Math.atan2(lat, lng) + 0.000003 * Math.cos(lng * X_PI)
  return [z * Math.cos(theta) + 0.0065, z * Math.sin(theta) + 0.006] as const
}

const bd09ToGcj02 = (lng: number, lat: number) => {
  const x = lng - 0.0065
  const y = lat - 0.006
  const z = Math.sqrt(x * x + y * y) - 0.00002 * Math.sin(y * X_PI)
  const theta = Math.atan2(y, x) - 0.000003 * Math.cos(x * X_PI)
  return [z * Math.cos(theta), z * Math.sin(theta)] as const
}

const convertCoordinate = (from: CoordType, to: CoordType, lng: number, lat: number) => {
  if (from === to) return [lng, lat] as const

  if (from === 'WGS84' && to === 'GCJ02') return wgs84ToGcj02(lng, lat)
  if (from === 'GCJ02' && to === 'WGS84') return gcj02ToWgs84(lng, lat)
  if (from === 'GCJ02' && to === 'BD09') return gcj02ToBd09(lng, lat)
  if (from === 'BD09' && to === 'GCJ02') return bd09ToGcj02(lng, lat)
  if (from === 'WGS84' && to === 'BD09') {
    const [gcjLng, gcjLat] = wgs84ToGcj02(lng, lat)
    return gcj02ToBd09(gcjLng, gcjLat)
  }

  const [gcjLng, gcjLat] = bd09ToGcj02(lng, lat)
  return gcj02ToWgs84(gcjLng, gcjLat)
}

const mapLinks = computed(() => {
  if (!result.value) {
    return { amap: '#', tencent: '#', baidu: '#' }
  }

  const [gcjLng, gcjLat] = convertCoordinate(targetType.value, 'GCJ02', result.value.rawLongitude, result.value.rawLatitude)
  const [bdLng, bdLat] = convertCoordinate(targetType.value, 'BD09', result.value.rawLongitude, result.value.rawLatitude)

  return {
    amap: `https://uri.amap.com/marker?position=${gcjLng},${gcjLat}&name=${encodeURIComponent('坐标点')}`,
    tencent: `https://apis.map.qq.com/uri/v1/marker?marker=coord:${gcjLat},${gcjLng};title:${encodeURIComponent('坐标点')}&referer=latlng`,
    baidu: `https://api.map.baidu.com/marker?location=${bdLat},${bdLng}&title=${encodeURIComponent('坐标点')}&content=${encodeURIComponent('坐标点')}&output=html&coord_type=bd09ll`,
  }
})

const copyText = async (text: string, successMessage: string) => {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success(successMessage)
  } catch {
    ElMessage.error('复制失败，请手动复制')
  }
}

const handleConvert = () => {
  const lng = Number(longitude.value.trim())
  const lat = Number(latitude.value.trim())

  if (Number.isNaN(lng) || Number.isNaN(lat)) {
    errorMessage.value = '请输入有效的经度和纬度'
    result.value = null
    return
  }

  errorMessage.value = ''
  const [targetLng, targetLat] = convertCoordinate(sourceType.value, targetType.value, lng, lat)
  result.value = {
    sourceText: `${formatCoordinate(lng)}, ${formatCoordinate(lat)}`,
    targetText: `${formatCoordinate(targetLng)}, ${formatCoordinate(targetLat)}`,
    targetLongitude: formatCoordinate(targetLng),
    targetLatitude: formatCoordinate(targetLat),
    rawLongitude: targetLng,
    rawLatitude: targetLat,
  }
}

const swapTypes = () => {
  const currentSource = sourceType.value
  sourceType.value = targetType.value
  targetType.value = currentSource
}

const useResultAsInput = () => {
  if (!result.value) return
  longitude.value = result.value.targetLongitude
  latitude.value = result.value.targetLatitude
  sourceType.value = targetType.value
  result.value = null
}
</script>

<style scoped>
.tool-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.map-links {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.map-links a {
  color: #409eff;
  text-decoration: none;
  font-size: 14px;
}

.map-links a:hover {
  text-decoration: underline;
}

@media (max-width: 768px) {
  .tool-grid {
    grid-template-columns: 1fr;
  }
}
</style>
