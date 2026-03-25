<template>
  <div class="ai-chat">
    <div class="chat-container">
      <!-- 消息列表 -->
      <div class="chat-messages" ref="messagesRef">
        <div v-if="messages.length === 0" class="empty-state">
          <el-icon :size="48" color="#409eff"><ChatDotRound /></el-icon>
          <h3>AI 助手</h3>
          <p>输入消息开始对话，支持代码问答、技术咨询等</p>
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
            <div class="message-text" v-html="renderMarkdown(msg.content)"></div>
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
            <div class="message-text typing">
              <span v-if="streamContent">{{ streamContent }}</span>
              <span v-else class="typing-dots">
                <span></span><span></span><span></span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区 -->
      <div class="chat-input">
        <div class="input-wrapper">
          <el-input
            v-model="inputText"
            type="textarea"
            :rows="2"
            :autosize="{ minRows: 1, maxRows: 5 }"
            placeholder="输入消息... (Enter 发送, Shift+Enter 换行)"
            resize="none"
            @keydown.enter.exact.prevent="handleSend"
          />
          <el-button
            type="primary"
            :loading="loading"
            :disabled="!inputText.trim()"
            class="send-btn"
            @click="handleSend"
          >
            <el-icon><Promotion /></el-icon>
          </el-button>
        </div>
        <div class="input-actions">
          <el-button size="small" text @click="clearMessages">
            <el-icon><Delete /></el-icon>
            清空对话
          </el-button>
          <span class="model-tag">Doubao-Seed-2.0-Code</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { User, Monitor, Promotion, Delete, ChatDotRound } from '@element-plus/icons-vue'
import { sendChatStream, type ChatMessage } from '@/api/ai-chat'

const messages = ref<ChatMessage[]>([])
const inputText = ref('')
const loading = ref(false)
const streamContent = ref('')
const messagesRef = ref<HTMLDivElement>()

const scrollToBottom = async () => {
  await nextTick()
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}

const handleSend = async () => {
  const text = inputText.value.trim()
  if (!text || loading.value) return

  messages.value.push({ role: 'user', content: text })
  inputText.value = ''
  loading.value = true
  streamContent.value = ''
  await scrollToBottom()

  try {
    const chatMessages: ChatMessage[] = messages.value.map(m => ({
      role: m.role,
      content: m.content,
    }))

    let fullContent = ''
    for await (const chunk of sendChatStream(chatMessages)) {
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

const renderMarkdown = (text: string) => {
  // 简易 markdown：代码块、行内代码、加粗、换行
  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  // 代码块
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_m, lang, code) => {
    return `<pre class="code-block"><code class="language-${lang}">${code.trim()}</code></pre>`
  })
  // 行内代码
  html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>')
  // 加粗
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  // 换行
  html = html.replace(/\n/g, '<br>')

  return html
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

.message-text {
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-word;
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

.model-tag {
  font-size: 12px;
  color: #c0c4cc;
}

/* 代码样式 */
:deep(.code-block) {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 12px 16px;
  border-radius: 8px;
  overflow-x: auto;
  margin: 8px 0;
  font-size: 13px;
  line-height: 1.5;
}

:deep(.inline-code) {
  background: #f0f2f5;
  color: #c7254e;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
}
</style>
