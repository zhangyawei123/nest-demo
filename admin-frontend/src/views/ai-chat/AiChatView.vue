<template>
  <div class="ai-chat">
    <!-- 左侧会话面板（可折叠） -->
    <transition name="slide-panel">
      <div v-show="!sidebarCollapsed" class="session-panel">
        <div class="session-panel-header">
          <span class="session-panel-title">历史会话</span>
          <el-button size="small" text @click="sidebarCollapsed = true">
            <el-icon><ArrowLeft /></el-icon>
          </el-button>
        </div>
        <div class="session-list">
          <div
            v-for="s in sessions"
            :key="s.id"
            class="session-item"
            :class="{ active: s.id === currentSessionId }"
            @click="switchSession(s.id)"
          >
            <div class="session-item-content">
              <div class="session-item-title">{{ s.title }}</div>
              <div class="session-item-time">{{ formatTime(s.updatedAt) }}</div>
            </div>
            <el-button
              class="session-delete-btn"
              text
              size="small"
              @click.stop="handleDeleteSession(s.id)"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
          <div v-if="sessions.length === 0 && !sessionsLoading" class="session-empty">
            发送第一条消息即可开始
          </div>
        </div>
      </div>
    </transition>

    <!-- 右侧聊天区 -->
    <div class="chat-main">
      <div class="chat-shell">
        <div class="chat-messages" ref="messagesRef">
          <!-- 欢迎页 -->
          <div v-if="messages.length === 0 && !messagesLoading && !loading" class="empty-state">
            <div class="empty-hero">
              <div class="empty-icon-wrap">
                <el-icon class="empty-icon"><ChatDotRound /></el-icon>
              </div>
              <div class="empty-copy">
                <h3>有什么可以帮你的？</h3>
                <p>直接在下方输入问题开始对话。</p>
              </div>
            </div>
            <div class="starter-grid">
              <button
                v-for="item in quickPrompts"
                :key="item.title"
                type="button"
                class="starter-card"
                @click="applyPrompt(item.prompt)"
              >
                <div class="starter-title">{{ item.title }}</div>
                <div class="starter-desc">{{ item.description }}</div>
              </button>
            </div>
          </div>

          <!-- 加载历史消息中 -->
          <div v-if="messagesLoading" class="empty-state">
            <el-icon class="loading-icon"><Loading /></el-icon>
            <span style="color:#8ca0bc;font-size:13px">加载消息中...</span>
          </div>

          <!-- 消息列表 -->
          <template v-if="messages.length > 0">
            <div
              v-for="msg in messages"
              :key="msg.id"
              class="message-item"
              :class="msg.role"
            >
              <div class="message-avatar">
                <el-avatar v-if="msg.role === 'user'" :size="36" class="avatar-user">
                  <el-icon><User /></el-icon>
                </el-avatar>
                <el-avatar v-else :size="36" class="avatar-assistant">
                  <el-icon><Monitor /></el-icon>
                </el-avatar>
              </div>
              <div class="message-content">
                <div class="message-role">{{ msg.role === 'user' ? '我' : 'AI 助手' }}</div>
                <div class="message-text">
                  <MarkdownRenderer :content="msg.content" />
                </div>
              </div>
            </div>
          </template>

          <!-- 流式输出中 -->
          <div v-if="loading" class="message-item assistant">
            <div class="message-avatar">
              <el-avatar :size="36" class="avatar-assistant">
                <el-icon><Monitor /></el-icon>
              </el-avatar>
            </div>
            <div class="message-content">
              <div class="message-role">AI 助手</div>
              <div v-if="streamContent" class="message-text typing assistant-stream">
                <MarkdownRenderer :content="streamContent" />
              </div>
              <div v-else class="message-text typing assistant-stream">
                <span class="typing-dots">
                  <span></span><span></span><span></span>
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 输入区 -->
        <div class="chat-input">
          <div class="input-toolbar">
            <el-button
              v-if="sidebarCollapsed"
              size="small"
              text
              class="toolbar-btn"
              @click="sidebarCollapsed = false"
              title="展开历史会话"
            >
              <el-icon><ChatLineSquare /></el-icon>
            </el-button>
            <el-button size="small" text class="toolbar-btn" @click="startNewChat" title="新对话">
              <el-icon><Plus /></el-icon>
              <span class="toolbar-label">新对话</span>
            </el-button>
          </div>
          <div class="input-wrapper">
            <el-input
              v-model="inputText"
              type="textarea"
              :autosize="{ minRows: 1, maxRows: 5 }"
              placeholder="输入消息...（Enter 发送，Shift+Enter 换行）"
              resize="none"
              @keydown.enter.exact.prevent="handleSend"
            />
            <el-button
              v-if="loading"
              type="danger"
              class="send-btn stop-btn"
              @click="handleStop"
            >
              <el-icon><VideoPause /></el-icon>
              <span>停止</span>
            </el-button>
            <el-button
              v-else
              type="primary"
              :disabled="!canSend"
              class="send-btn"
              @click="handleSend"
            >
              <el-icon><Promotion /></el-icon>
              <span>发送</span>
            </el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { User, Monitor, Promotion, Delete, ChatDotRound, Plus, Loading, ArrowLeft, ChatLineSquare, VideoPause } from '@element-plus/icons-vue'
import MarkdownRenderer from '@/components/MarkdownRenderer.vue'
import {
  getSessions,
  createSession,
  deleteSession,
  getSessionMessages,
  sendSessionChatStream,
  type ChatSessionItem,
  type ChatMessageItem,
} from '@/api/ai-chat'

// ─── 会话状态 ───
const sessions = ref<ChatSessionItem[]>([])
const currentSessionId = ref<number | null>(null)
const sessionsLoading = ref(false)
const sidebarCollapsed = ref(false)

// ─── 消息状态 ───
interface DisplayMessage {
  id: number | string
  role: string
  content: string
}
const messages = ref<DisplayMessage[]>([])
const messagesLoading = ref(false)
const inputText = ref('')
const loading = ref(false)
const streamContent = ref('')
const messagesRef = ref<HTMLDivElement>()
const userScrolledUp = ref(false)
let abortController: AbortController | null = null

const quickPrompts = [
  {
    title: '解释技术问题',
    description: '把复杂概念拆解成容易理解的解释',
    prompt: '请用通俗但专业的方式解释这个技术问题，并给出可执行建议。'
  },
  {
    title: '生成运营文案',
    description: '整理成适合发布的标题、正文和标签',
    prompt: '请帮我生成一版适合社交平台发布的文案，包含标题、正文和标签建议。'
  },
  {
    title: '分析图片内容',
    description: '结合图像信息提取亮点与重点',
    prompt: '请详细分析这张图片中的主体、场景、文字信息以及可提炼的内容亮点。'
  },
  {
    title: '整理会议纪要',
    description: '总结重点、风险和下一步动作',
    prompt: '请把我提供的内容整理成会议纪要，包含重点、风险和下一步行动。'
  }
]

const canSend = computed(() => {
  return Boolean(inputText.value.trim()) && !loading.value
})

// ─── 会话操作 ───

const loadSessions = async () => {
  sessionsLoading.value = true
  try {
    const resp = await getSessions()
    sessions.value = ((resp as any) || []) as ChatSessionItem[]
  } catch {
    // 静默
  } finally {
    sessionsLoading.value = false
  }
}

const startNewChat = () => {
  currentSessionId.value = null
  messages.value = []
  inputText.value = ''
  streamContent.value = ''
}

const handleDeleteSession = async (id: number) => {
  try {
    await ElMessageBox.confirm('确定删除此会话？所有聊天记录将被清除。', '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })
  } catch {
    return
  }

  try {
    await deleteSession(id)
    sessions.value = sessions.value.filter(s => s.id !== id)
    if (currentSessionId.value === id) {
      startNewChat()
    }
    ElMessage.success('已删除')
  } catch {
    ElMessage.error('删除失败')
  }
}

const switchSession = async (id: number) => {
  if (!id || id === currentSessionId.value) return
  currentSessionId.value = id
  messages.value = []
  messagesLoading.value = true
  try {
    const resp = await getSessionMessages(id)
    const list = ((resp as any) || []) as ChatMessageItem[]
    messages.value = list.map(m => ({
      id: m.id,
      role: m.role,
      content: m.content,
    }))
    await scrollToBottom()
  } catch {
    ElMessage.error('获取消息失败')
  } finally {
    messagesLoading.value = false
  }
}

// ─── 发送消息（核心：第一条消息自动创建会话）───

const handleSend = async () => {
  const text = inputText.value.trim()
  if (!text || loading.value) return

  inputText.value = ''
  loading.value = true
  streamContent.value = ''

  // 先在界面上显示用户消息
  userScrolledUp.value = false
  const tempUserMsg: DisplayMessage = { id: 'temp-user', role: 'user', content: text }
  messages.value.push(tempUserMsg)
  await scrollToBottom(true)

  try {
    // 如果没有当前会话，先自动创建一个
    let sessionId = currentSessionId.value
    if (!sessionId) {
      const resp = await createSession()
      const session = (resp as any) as ChatSessionItem
      if (!session?.id) {
        throw new Error('创建会话失败')
      }
      sessionId = session.id
      currentSessionId.value = sessionId
      sessions.value.unshift(session)
    }

    // 流式发送
    abortController = new AbortController()
    let fullReply = ''
    for await (const event of sendSessionChatStream(sessionId, text, abortController.signal)) {
      if (event.type === 'user_msg' && event.id) {
        tempUserMsg.id = event.id
      } else if (event.type === 'content' && event.content) {
        fullReply += event.content
        streamContent.value = fullReply
        await scrollToBottom()
      } else if (event.type === 'assistant_msg' && event.id) {
        messages.value.push({ id: event.id, role: 'assistant', content: fullReply })
      }
    }

    // 刷新会话列表（更新标题）
    await loadSessions()
  } catch (e: any) {
    if (e.name === 'AbortError') {
      // 用户主动停止，把已收到的内容作为消息保留
      if (streamContent.value) {
        messages.value.push({ id: 'stopped-' + Date.now(), role: 'assistant', content: streamContent.value })
      }
    } else {
      ElMessage.error('对话失败：' + (e?.message || '未知错误'))
      messages.value.push({ id: 'err', role: 'assistant', content: '抱歉，请求出错了，请重试。' })
    }
  } finally {
    abortController = null
    loading.value = false
    streamContent.value = ''
    await scrollToBottom()
  }
}

const handleStop = () => {
  if (abortController) {
    abortController.abort()
  }
}

// ─── 智能滚动 ───

const isNearBottom = () => {
  const el = messagesRef.value
  if (!el) return true
  return el.scrollHeight - el.scrollTop - el.clientHeight < 80
}

const onMessagesScroll = () => {
  userScrolledUp.value = !isNearBottom()
}

const scrollToBottom = async (force = false) => {
  await nextTick()
  if (!messagesRef.value) return
  if (force || !userScrolledUp.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}

const applyPrompt = (prompt: string) => {
  inputText.value = prompt
}

const formatTime = (dateStr: string) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  if (isToday) {
    return d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  return d.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' }) +
    ' ' +
    d.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// ─── 初始化 ───
onMounted(() => {
  loadSessions()
  messagesRef.value?.addEventListener('scroll', onMessagesScroll)
})

onUnmounted(() => {
  messagesRef.value?.removeEventListener('scroll', onMessagesScroll)
})
</script>

<style scoped>
/* ─── 主布局：左右分栏 ─── */
.ai-chat {
  width: 100%;
  height: calc(100vh - 156px);
  display: flex;
  flex-direction: row;
  gap: 16px;
  overflow: hidden;
}

/* ─── 左侧会话面板 ─── */
.session-panel {
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-radius: 20px;
  border: 1px solid rgba(122, 160, 211, 0.16);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(245, 249, 255, 0.94));
  box-shadow: 0 12px 28px rgba(95, 124, 170, 0.1);
  overflow: hidden;
  transition: width 0.3s ease, opacity 0.3s ease, margin 0.3s ease;
}

/* 折叠动画 */
.slide-panel-enter-active,
.slide-panel-leave-active {
  transition: width 0.3s ease, opacity 0.25s ease, margin-right 0.3s ease;
  overflow: hidden;
}

.slide-panel-enter-from,
.slide-panel-leave-to {
  width: 0 !important;
  opacity: 0;
  margin-right: -16px;
}

.session-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 12px;
  border-bottom: 1px solid rgba(122, 160, 211, 0.1);
  flex-shrink: 0;
}

.session-panel-title {
  font-size: 15px;
  font-weight: 700;
  color: #243755;
}

.session-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.session-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  margin-bottom: 4px;
}

.session-item:hover {
  background: rgba(47, 145, 255, 0.06);
}

.session-item.active {
  background: rgba(47, 145, 255, 0.1);
  border: 1px solid rgba(47, 145, 255, 0.18);
}

.session-item-content {
  flex: 1;
  min-width: 0;
}

.session-item-title {
  font-size: 13px;
  font-weight: 600;
  color: #243755;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.session-item-time {
  margin-top: 3px;
  font-size: 11px;
  color: #8ca0bc;
}

.session-delete-btn {
  opacity: 0;
  transition: opacity 0.2s;
  color: #b0b8c8;
  flex-shrink: 0;
}

.session-item:hover .session-delete-btn {
  opacity: 1;
}

.session-delete-btn:hover {
  color: #e74c3c !important;
}

.session-empty {
  padding: 24px 12px;
  text-align: center;
  color: #8ca0bc;
  font-size: 13px;
}

/* ─── 右侧聊天区 ─── */
.chat-main {
  flex: 1;
  min-width: 0;
  border-radius: 20px;
  border: 1px solid rgba(122, 160, 211, 0.16);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(245, 249, 255, 0.94));
  box-shadow: 0 12px 28px rgba(95, 124, 170, 0.1);
  overflow: hidden;
}

.chat-shell {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.chat-messages {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 18px 20px 14px;
  background:
    radial-gradient(circle at top left, rgba(47, 145, 255, 0.06), transparent 30%),
    linear-gradient(180deg, rgba(248, 251, 255, 0.98), rgba(241, 246, 255, 0.96));
}

/* ─── 空状态 ─── */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 40px 20px;
}

.empty-hero {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 18px;
  border-radius: 18px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.96), rgba(239, 245, 255, 0.92));
  border: 1px solid rgba(122, 160, 211, 0.14);
}

.empty-icon-wrap {
  width: 44px;
  height: 44px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  background: linear-gradient(135deg, #2f91ff, #7c4dff);
  box-shadow: 0 10px 16px rgba(66, 121, 255, 0.16);
}

.empty-icon {
  color: #fff;
  font-size: 20px;
}

.empty-copy h3 {
  margin: 0 0 4px;
  color: #243755;
  font-size: 16px;
  font-weight: 700;
}

.empty-copy p {
  margin: 0;
  color: #7d90af;
  font-size: 13px;
  line-height: 1.5;
}

.loading-icon {
  font-size: 24px;
  color: #2f91ff;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* ─── 快捷提示 ─── */
.starter-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  width: 100%;
  max-width: 520px;
}

.starter-card {
  width: 100%;
  padding: 12px;
  border: 1px solid rgba(122, 160, 211, 0.14);
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.76);
  text-align: left;
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

.starter-card:hover {
  transform: translateY(-2px);
  border-color: rgba(95, 148, 226, 0.24);
  box-shadow: 0 12px 20px rgba(95, 124, 170, 0.1);
}

.starter-title {
  color: #243755;
  font-size: 13px;
  font-weight: 700;
}

.starter-desc {
  margin-top: 4px;
  color: #7d90af;
  font-size: 12px;
  line-height: 1.4;
}

/* ─── 消息 ─── */
.message-item {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(6px); }
  to { opacity: 1; transform: translateY(0); }
}

.message-item.user {
  flex-direction: row-reverse;
}

.message-content {
  flex: 1;
  max-width: min(78%, 720px);
}

.message-item.user .message-content {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.avatar-user,
.avatar-assistant {
  box-shadow: 0 8px 16px rgba(95, 124, 170, 0.12);
}

.avatar-user {
  background: linear-gradient(135deg, #2f91ff, #7c4dff) !important;
}

.avatar-assistant {
  background: linear-gradient(135deg, #38d8c0, #53a8ff) !important;
}

.message-role {
  margin-bottom: 4px;
  color: #8ca0bc;
  font-size: 12px;
  font-weight: 700;
}

.message-text {
  padding: 14px 16px;
  border-radius: 18px;
  font-size: 14px;
  line-height: 1.7;
  word-break: break-word;
}

.message-item.user .message-text {
  background: linear-gradient(135deg, #2f91ff 0%, #7c4dff 100%);
  color: #fff;
  border-radius: 18px 18px 6px 18px;
  box-shadow: 0 12px 24px rgba(66, 121, 255, 0.2);
}

.message-item.assistant .message-text,
.assistant-stream {
  background: rgba(255, 255, 255, 0.92);
  color: #2e425f;
  border: 1px solid rgba(122, 160, 211, 0.14);
  border-radius: 18px 18px 18px 6px;
  box-shadow: 0 8px 18px rgba(95, 124, 170, 0.06);
}

.typing-dots {
  display: inline-flex;
  gap: 6px;
}

.typing-dots span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #8fa5c4;
  animation: bounce 1.4s infinite both;
}

.typing-dots span:nth-child(2) { animation-delay: 0.16s; }
.typing-dots span:nth-child(3) { animation-delay: 0.32s; }

@keyframes bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

/* ─── 输入区 ─── */
.chat-input {
  flex-shrink: 0;
  padding: 10px 20px 16px;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(246, 250, 255, 0.98));
  border-top: 1px solid rgba(122, 160, 211, 0.1);
}

.input-toolbar {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
}

.toolbar-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 30px;
  padding: 0 10px;
  border-radius: 8px;
  color: #5c769c;
  font-size: 13px;
  transition: all 0.2s;
}

.toolbar-btn:hover {
  background: rgba(47, 145, 255, 0.08);
  color: #2f69d0;
}

.toolbar-label {
  font-size: 13px;
  font-weight: 600;
}

.input-wrapper {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.input-wrapper :deep(.el-textarea__inner) {
  min-height: 44px !important;
  padding: 10px 14px;
  border-radius: 16px;
  border-color: rgba(122, 160, 211, 0.16);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.94);
  font-size: 14px;
  line-height: 1.6;
}

.input-wrapper :deep(.el-textarea__inner:focus) {
  box-shadow:
    0 0 0 3px rgba(47, 145, 255, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.94);
}

.send-btn {
  height: 42px;
  padding: 0 18px;
  border-radius: 16px;
  flex-shrink: 0;
}

.quick-prompt-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.quick-prompt-chip {
  height: 30px;
  padding: 0 12px;
  border: 1px solid rgba(122, 160, 211, 0.14);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.78);
  color: #243755;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.quick-prompt-chip:hover {
  color: #2f69d0;
  border-color: rgba(95, 148, 226, 0.22);
  background: rgba(47, 145, 255, 0.08);
}

/* ─── Markdown 内联样式 ─── */
.message-item.user :deep(p code),
.message-item.user :deep(li code) {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.message-item.user :deep(a) {
  color: #fff;
  text-decoration: underline;
}

.message-item.assistant :deep(a) {
  color: #2f69d0;
}

/* ─── 响应式 ─── */
@media (max-width: 900px) {
  .ai-chat {
    flex-direction: column;
    height: auto;
    min-height: calc(100vh - 156px);
  }

  .session-panel {
    width: 100% !important;
    max-height: 200px;
  }

  .chat-main {
    flex: 1;
    min-height: 400px;
  }
}

@media (max-width: 640px) {
  .starter-grid {
    grid-template-columns: 1fr;
  }

  .empty-hero {
    flex-direction: column;
  }

  .chat-messages,
  .chat-input {
    padding-left: 14px;
    padding-right: 14px;
  }

  .message-content {
    max-width: calc(100% - 48px);
  }
}
</style>
