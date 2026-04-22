<template>
  <div class="ai-chat">
    <div class="chat-container">
      <div class="chat-messages" ref="messagesRef">
        <div v-if="messages.length === 0" class="empty-state">
          <el-icon :size="48" color="#409eff"><ChatDotRound /></el-icon>
          <h3>AI 助手</h3>
          <p>输入文字或上传图片开始对话，支持图文问答与技术咨询</p>
        </div>

        <div
          v-for="(msg, index) in messages"
          :key="index"
          class="message-item"
          :class="msg.role"
        >
          <div class="message-avatar">
            <el-avatar v-if="msg.role === 'user'" :size="36" style="background: #409eff">
              <el-icon><User /></el-icon>
            </el-avatar>
            <el-avatar v-else :size="36" style="background: #67c23a">
              <el-icon><Monitor /></el-icon>
            </el-avatar>
          </div>
          <div class="message-content">
            <div class="message-role">{{ msg.role === 'user' ? '我' : 'AI 助手' }}</div>
            <div class="message-body" :class="{ 'image-only': !getMessageText(msg.content) }">
              <img
                v-if="getMessageImage(msg.content)"
                :src="getMessageImage(msg.content)"
                alt="用户上传图片"
                class="message-image"
              />
              <div v-if="getMessageText(msg.content)" class="message-text">
                <MarkdownRenderer :content="getMessageText(msg.content)" />
              </div>
            </div>
          </div>
        </div>

        <div v-if="loading" class="message-item assistant">
          <div class="message-avatar">
            <el-avatar :size="36" style="background: #67c23a">
              <el-icon><Monitor /></el-icon>
            </el-avatar>
          </div>
          <div class="message-content">
            <div class="message-role">AI 助手</div>
            <div v-if="streamContent" class="message-text typing">
              <MarkdownRenderer :content="streamContent" />
            </div>
            <div v-else class="message-text typing">
              <span class="typing-dots">
                <span></span><span></span><span></span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="chat-input">
        <div v-if="selectedImageUrl" class="selected-image-panel">
          <img :src="selectedImageUrl" alt="待发送图片" class="selected-image-preview" />
          <div class="selected-image-meta">
            <span class="selected-image-name">{{ selectedImageName }}</span>
            <el-button text @click="removeSelectedImage">
              <el-icon><Close /></el-icon>
              移除图片
            </el-button>
          </div>
        </div>

        <div class="input-wrapper">
          <el-input
            v-model="inputText"
            type="textarea"
            :rows="2"
            :autosize="{ minRows: 1, maxRows: 5 }"
            placeholder="输入消息... (支持图片，Enter 发送，Shift+Enter 换行)"
            resize="none"
            @keydown.enter.exact.prevent="handleSend"
          />
          <el-button
            type="primary"
            :loading="loading"
            :disabled="!canSend"
            class="send-btn"
            @click="handleSend"
          >
            <el-icon><Promotion /></el-icon>
          </el-button>
        </div>
        <div class="input-actions">
          <div class="input-actions-left">
            <el-upload
              :auto-upload="false"
              :show-file-list="false"
              accept="image/*"
              @change="handleImageChange"
            >
              <template #trigger>
                <el-button size="small" text>
                  <el-icon><Picture /></el-icon>
                  上传图片
                </el-button>
              </template>
            </el-upload>
            <el-button size="small" text @click="clearMessages">
              <el-icon><Delete /></el-icon>
              清空对话
            </el-button>
          </div>
          <span class="model-tag">模型由服务端配置</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { UploadFile } from 'element-plus'
import { User, Monitor, Promotion, Delete, ChatDotRound, Picture, Close } from '@element-plus/icons-vue'
import MarkdownRenderer from '@/components/MarkdownRenderer.vue'
import { sendChatStream, type ChatContentPart, type ChatMessage } from '@/api/ai-chat'

const messages = ref<ChatMessage[]>([])
const inputText = ref('')
const loading = ref(false)
const streamContent = ref('')
const messagesRef = ref<HTMLDivElement>()
const selectedImageUrl = ref('')
const selectedImageName = ref('')

const canSend = computed(() => {
  return Boolean(inputText.value.trim() || selectedImageUrl.value) && !loading.value
})

const scrollToBottom = async () => {
  await nextTick()
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('图片读取失败'))
    reader.readAsDataURL(file)
  })

const buildUserMessage = (text: string, imageUrl: string): ChatMessage => {
  if (!imageUrl) {
    return { role: 'user', content: text }
  }

  const parts: ChatContentPart[] = []
  if (text) {
    parts.push({ type: 'text', text })
  }
  parts.push({
    type: 'image_url',
    image_url: { url: imageUrl },
  })
  return { role: 'user', content: parts }
}

const getMessageText = (content: ChatMessage['content']) => {
  if (typeof content === 'string') return content
  return content
    .filter((part): part is Extract<ChatContentPart, { type: 'text' }> => part.type === 'text')
    .map(part => part.text)
    .join('\n')
}

const getMessageImage = (content: ChatMessage['content']) => {
  if (typeof content === 'string') return ''
  return content.find(part => part.type === 'image_url')?.image_url.url || ''
}

const handleImageChange = async (file: UploadFile) => {
  const raw = file.raw
  if (!raw) return

  if (!raw.type.startsWith('image/')) {
    ElMessage.error('只能上传图片文件')
    return
  }

  if (raw.size > 3 * 1024 * 1024) {
    ElMessage.error('图片大小不能超过 3MB')
    return
  }

  try {
    selectedImageUrl.value = await fileToDataUrl(raw)
    selectedImageName.value = raw.name
  } catch (e: any) {
    ElMessage.error(e?.message || '图片读取失败')
  }
}

const removeSelectedImage = () => {
  selectedImageUrl.value = ''
  selectedImageName.value = ''
}

const handleSend = async () => {
  const text = inputText.value.trim()
  const imageUrl = selectedImageUrl.value
  if ((!text && !imageUrl) || loading.value) return

  const userMessage = buildUserMessage(text, imageUrl)
  messages.value.push(userMessage)
  inputText.value = ''
  removeSelectedImage()
  loading.value = true
  streamContent.value = ''
  await scrollToBottom()

  try {
    let fullContent = ''
    for await (const chunk of sendChatStream(messages.value)) {
      fullContent += chunk
      streamContent.value = fullContent
      await scrollToBottom()
    }

    messages.value.push({ role: 'assistant', content: fullContent })
  } catch (e: any) {
    ElMessage.error('对话失败：' + (e?.message || '未知错误'))
    messages.value.push({ role: 'assistant', content: '抱歉，请求出错了，请重试。' })
  } finally {
    loading.value = false
    streamContent.value = ''
    await scrollToBottom()
  }
}

const clearMessages = () => {
  messages.value = []
}
</script>

<style scoped>
.ai-chat {
  height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}

.chat-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #f5f7fa;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #909399;
}

.empty-state h3 {
  margin: 16px 0 8px;
  color: #303133;
}

.empty-state p {
  color: #909399;
  font-size: 14px;
}

.message-item {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

.message-content {
  flex: 1;
  max-width: 80%;
}

.message-item.user {
  flex-direction: row-reverse;
}

.message-item.user .message-content {
  align-items: flex-end;
  display: flex;
  flex-direction: column;
}

.message-role {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.message-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  align-items: flex-start;
}

.message-item.user .message-body {
  align-items: flex-end;
}

.message-body.image-only {
  max-width: 320px;
}

.message-text {
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
}

.message-image {
  max-width: 320px;
  max-height: 240px;
  border-radius: 12px;
  object-fit: cover;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
}

.message-item.user .message-text {
  background: #409eff;
  color: white;
  border-radius: 12px 12px 2px 12px;
}

.message-item.assistant .message-text {
  background: white;
  color: #303133;
  border-radius: 12px 12px 12px 2px;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06);
}

.typing-dots {
  display: inline-flex;
  gap: 4px;
}

.typing-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #909399;
  animation: bounce 1.4s infinite both;
}

.typing-dots span:nth-child(2) { animation-delay: 0.16s; }
.typing-dots span:nth-child(3) { animation-delay: 0.32s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

.chat-input {
  padding: 16px 24px;
  background: white;
  border-top: 1px solid #e4e7ed;
}

.selected-image-panel {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  margin-bottom: 12px;
  background: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 10px;
}

.selected-image-preview {
  width: 64px;
  height: 64px;
  border-radius: 10px;
  object-fit: cover;
  flex-shrink: 0;
}

.selected-image-meta {
  min-width: 0;
  display: flex;
  flex: 1;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.selected-image-name {
  min-width: 0;
  color: #606266;
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.input-wrapper {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.input-wrapper :deep(.el-textarea__inner) {
  border-radius: 8px;
  padding: 10px 14px;
  font-size: 14px;
}

.send-btn {
  height: 40px;
  width: 40px;
  border-radius: 8px;
  flex-shrink: 0;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.input-actions-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.model-tag {
  font-size: 12px;
  color: #c0c4cc;
}

/* 用户气泡里反色 */
.message-item.user :deep(p code),
.message-item.user :deep(li code) {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}
.message-item.user :deep(a) {
  color: #fff;
  text-decoration: underline;
}

@media (max-width: 768px) {
  .message-content {
    max-width: calc(100% - 48px);
  }

  .message-image,
  .message-body.image-only {
    max-width: 100%;
  }

  .selected-image-panel {
    align-items: flex-start;
  }

  .selected-image-meta,
  .input-actions {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
