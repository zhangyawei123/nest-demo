<template>
  <div class="tool-card">
    <div class="tool-card-header">
      <div>
        <h3>AI 文案改写</h3>
        <p>粘贴一段文字，AI 帮你改写、润色或翻译。</p>
      </div>
    </div>

    <div class="rewrite-mode">
      <el-radio-group v-model="mode">
        <el-radio-button value="rewrite">改写润色</el-radio-button>
        <el-radio-button value="formal">正式化</el-radio-button>
        <el-radio-button value="casual">口语化</el-radio-button>
        <el-radio-button value="expand">扩写</el-radio-button>
        <el-radio-button value="shorten">缩写</el-radio-button>
        <el-radio-button value="translate_en">翻译成英文</el-radio-button>
        <el-radio-button value="translate_zh">翻译成中文</el-radio-button>
      </el-radio-group>
    </div>

    <div class="rewrite-panels">
      <div class="panel-col">
        <div class="panel-label">原文</div>
        <el-input
          v-model="inputText"
          type="textarea"
          :rows="8"
          placeholder="在这里粘贴你的文字..."
          resize="vertical"
        />
        <div class="panel-footer">
          <span class="char-count">{{ inputText.length }} 字</span>
          <el-button type="primary" :loading="loading" :disabled="!inputText.trim()" @click="doRewrite">
            开始改写
          </el-button>
        </div>
      </div>
      <div class="panel-col">
        <div class="panel-label">结果</div>
        <el-input
          v-model="outputText"
          type="textarea"
          :rows="8"
          placeholder="改写结果会出现在这里..."
          resize="vertical"
          readonly
        />
        <div class="panel-footer">
          <span class="char-count">{{ outputText.length }} 字</span>
          <el-button :disabled="!outputText" @click="copyResult">复制结果</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { sendChatStream } from '@/api/ai-chat'
import type { ChatMessage } from '@/api/ai-chat'

const mode = ref('rewrite')
const inputText = ref('')
const outputText = ref('')
const loading = ref(false)

const modePrompts: Record<string, string> = {
  rewrite: '请改写润色以下文字，保持原意但让表达更流畅优美：',
  formal: '请将以下文字改写为正式、书面化的表达：',
  casual: '请将以下文字改写为轻松、口语化的表达：',
  expand: '请将以下文字扩写，补充更多细节和内容，但保持原意：',
  shorten: '请将以下文字精简缩写，保留核心意思，去掉冗余内容：',
  translate_en: '请将以下文字翻译成英文，翻译要自然地道：',
  translate_zh: '请将以下中文/英文文字翻译成中文，翻译要自然流畅：',
}

const doRewrite = async () => {
  const text = inputText.value.trim()
  if (!text) return

  loading.value = true
  outputText.value = ''

  const prompt = modePrompts[mode.value] || modePrompts.rewrite
  const messages: ChatMessage[] = [
    { role: 'system', content: '你是一个专业的文案编辑助手，只输出改写/翻译后的结果，不要加任何解释。' },
    { role: 'user', content: `${prompt}\n\n${text}` },
  ]

  try {
    for await (const chunk of sendChatStream(messages)) {
      outputText.value += chunk
    }
  } catch (e: any) {
    ElMessage.error(e.message || '请求失败')
  } finally {
    loading.value = false
  }
}

const copyResult = async () => {
  if (!outputText.value) return
  try {
    await navigator.clipboard.writeText(outputText.value)
    ElMessage.success('已复制')
  } catch {
    ElMessage.error('复制失败')
  }
}
</script>

<style scoped>
.rewrite-mode {
  overflow-x: auto;
}
.rewrite-panels {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}
.panel-col {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.panel-label {
  font-size: 13px;
  color: #909399;
  font-weight: 500;
}
.panel-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.char-count {
  font-size: 12px;
  color: #c0c4cc;
}
@media (max-width: 768px) {
  .rewrite-panels {
    grid-template-columns: 1fr;
  }
}
</style>
