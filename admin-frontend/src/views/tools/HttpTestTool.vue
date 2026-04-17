<template>
  <div class="tool-card">
    <div class="tool-card-header">
      <div>
        <h3>HTTP 请求测试</h3>
        <p>在页面上直接发 GET/POST 请求，查看响应结果，类似轻量 Postman。</p>
      </div>
    </div>

    <div class="http-row">
      <el-select v-model="method" style="width: 120px">
        <el-option label="GET" value="GET" />
        <el-option label="POST" value="POST" />
        <el-option label="PUT" value="PUT" />
        <el-option label="DELETE" value="DELETE" />
        <el-option label="PATCH" value="PATCH" />
      </el-select>
      <el-input v-model="url" placeholder="请输入 URL，例如 https://httpbin.org/get" @keyup.enter="sendRequest" />
      <el-button type="primary" :loading="loading" @click="sendRequest">发送</el-button>
    </div>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="请求头" name="headers">
        <div class="kv-editor">
          <div v-for="(h, i) in headers" :key="i" class="kv-row">
            <el-input v-model="h.key" placeholder="Header Name" />
            <el-input v-model="h.value" placeholder="Header Value" />
            <el-button text type="danger" @click="headers.splice(i, 1)">删</el-button>
          </div>
          <el-button @click="headers.push({ key: '', value: '' })" size="small">+ 添加</el-button>
        </div>
      </el-tab-pane>
      <el-tab-pane label="请求体" name="body">
        <el-input
          v-model="body"
          type="textarea"
          :rows="5"
          placeholder='JSON 格式请求体，例如 {"key": "value"}'
          resize="vertical"
        />
      </el-tab-pane>
    </el-tabs>

    <el-alert v-if="errorMsg" :title="errorMsg" type="error" :closable="false" show-icon />

    <div v-if="response" class="response-panel">
      <div class="response-meta">
        <el-tag :type="statusType" effect="dark">{{ response.status }} {{ response.statusText }}</el-tag>
        <span class="response-time">{{ response.time }}ms</span>
      </div>

      <el-tabs v-model="responseTab">
        <el-tab-pane label="响应体" name="resBody">
          <pre class="code-block">{{ response.body }}</pre>
        </el-tab-pane>
        <el-tab-pane label="响应头" name="resHeaders">
          <pre class="code-block">{{ response.headers }}</pre>
        </el-tab-pane>
      </el-tabs>

      <el-button @click="copyBody" size="small">复制响应体</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

const method = ref('GET')
const url = ref('')
const body = ref('')
const headers = ref<{ key: string; value: string }[]>([
  { key: 'Content-Type', value: 'application/json' },
])
const activeTab = ref('headers')
const responseTab = ref('resBody')
const loading = ref(false)
const errorMsg = ref('')
const response = ref<{
  status: number
  statusText: string
  time: number
  body: string
  headers: string
} | null>(null)

const statusType = computed(() => {
  if (!response.value) return 'info'
  const s = response.value.status
  if (s >= 200 && s < 300) return 'success'
  if (s >= 300 && s < 400) return 'warning'
  return 'danger'
})

const sendRequest = async () => {
  const targetUrl = url.value.trim()
  if (!targetUrl) {
    errorMsg.value = '请输入 URL'
    return
  }

  loading.value = true
  errorMsg.value = ''
  response.value = null

  const reqHeaders: Record<string, string> = {}
  for (const h of headers.value) {
    if (h.key.trim()) {
      reqHeaders[h.key.trim()] = h.value
    }
  }

  const start = Date.now()

  try {
    const init: RequestInit = {
      method: method.value,
      headers: reqHeaders,
    }
    if (['POST', 'PUT', 'PATCH'].includes(method.value) && body.value.trim()) {
      init.body = body.value
    }

    const res = await fetch(targetUrl, init)
    const elapsed = Date.now() - start
    const text = await res.text()

    let formattedBody: string
    try {
      formattedBody = JSON.stringify(JSON.parse(text), null, 2)
    } catch {
      formattedBody = text
    }

    const resHeaders: string[] = []
    res.headers.forEach((v, k) => {
      resHeaders.push(`${k}: ${v}`)
    })

    response.value = {
      status: res.status,
      statusText: res.statusText,
      time: elapsed,
      body: formattedBody,
      headers: resHeaders.join('\n'),
    }
  } catch (e: any) {
    errorMsg.value = e.message || '请求失败'
  } finally {
    loading.value = false
  }
}

const copyBody = async () => {
  if (!response.value?.body) return
  try {
    await navigator.clipboard.writeText(response.value.body)
    ElMessage.success('已复制')
  } catch {
    ElMessage.error('复制失败')
  }
}
</script>

<style scoped>
.http-row {
  display: flex;
  gap: 8px;
}
.http-row :deep(.el-input) {
  flex: 1;
}
.kv-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.kv-row {
  display: flex;
  gap: 8px;
  align-items: center;
}
.kv-row :deep(.el-input) {
  flex: 1;
}
.response-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
.response-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}
.response-time {
  font-size: 13px;
  color: #909399;
}
.code-block {
  background: #f8fafc;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  padding: 16px;
  font-family: 'Menlo', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 400px;
  overflow-y: auto;
  margin: 0;
}
@media (max-width: 768px) {
  .http-row {
    flex-direction: column;
  }
}
</style>
