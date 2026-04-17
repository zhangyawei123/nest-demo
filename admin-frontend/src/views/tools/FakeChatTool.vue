<template>
  <div class="tool-card">
    <div class="tool-card-header">
      <div>
        <h3>假聊天截图生成</h3>
        <p>模拟微信聊天界面，输入对话内容生成截图。</p>
      </div>
    </div>

    <div class="chat-config">
      <el-input v-model="contactName" placeholder="对方昵称" style="width: 200px" />
      <el-select v-model="theme" style="width: 120px">
        <el-option label="浅色" value="light" />
        <el-option label="深色" value="dark" />
      </el-select>
    </div>

    <div class="msg-list-editor">
      <div v-for="(msg, idx) in messages" :key="idx" class="msg-edit-row">
        <el-select v-model="msg.side" style="width: 80px">
          <el-option label="对方" value="left" />
          <el-option label="我" value="right" />
        </el-select>
        <el-input v-model="msg.text" placeholder="消息内容" @keyup.enter="addMessage" />
        <el-button v-if="messages.length > 1" text type="danger" @click="removeMsg(idx)">删</el-button>
      </div>
      <el-button @click="addMessage" size="small">+ 添加消息</el-button>
    </div>

    <div class="chat-actions">
      <el-button type="primary" @click="generateScreenshot">生成截图</el-button>
    </div>

    <!-- 预览区域 -->
    <div ref="chatPreviewRef" class="chat-preview" :class="theme">
      <div class="chat-header-bar">
        <span class="back-arrow">‹</span>
        <span class="chat-title">{{ contactName || '好友' }}</span>
        <span class="more-dots">⋯</span>
      </div>
      <div class="chat-body">
        <div
          v-for="(msg, idx) in messages"
          :key="idx"
          class="chat-bubble-row"
          :class="msg.side"
        >
          <div class="avatar" :class="msg.side === 'right' ? 'avatar-me' : 'avatar-other'">
            {{ msg.side === 'right' ? '我' : (contactName?.[0] || '友') }}
          </div>
          <div class="bubble">{{ msg.text || '...' }}</div>
        </div>
      </div>
      <div class="chat-input-bar">
        <div class="fake-input">消息</div>
        <span class="plus-btn">＋</span>
      </div>
    </div>

    <div v-if="screenshotUrl" class="screenshot-result">
      <img :src="screenshotUrl" alt="截图" class="screenshot-img" />
      <el-button @click="downloadScreenshot">下载截图</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import html2canvas from 'html2canvas'

interface ChatMsg {
  side: 'left' | 'right'
  text: string
}

const contactName = ref('好友')
const theme = ref<'light' | 'dark'>('light')
const messages = ref<ChatMsg[]>([
  { side: 'left', text: '在吗？' },
  { side: 'right', text: '在的，什么事？' },
  { side: 'left', text: '今晚一起吃饭吗' },
  { side: 'right', text: '好啊，去哪吃？' },
])
const chatPreviewRef = ref<HTMLElement | null>(null)
const screenshotUrl = ref('')

const addMessage = () => {
  const lastSide = messages.value.length ? messages.value[messages.value.length - 1]!.side : 'left'
  messages.value.push({ side: lastSide === 'left' ? 'right' : 'left', text: '' })
}

const removeMsg = (idx: number) => {
  messages.value.splice(idx, 1)
}

const generateScreenshot = async () => {
  if (!chatPreviewRef.value) return
  try {
    const canvas = await html2canvas(chatPreviewRef.value, {
      scale: 2,
      backgroundColor: theme.value === 'dark' ? '#1e1e1e' : '#ededed',
      useCORS: true,
    })
    screenshotUrl.value = canvas.toDataURL('image/png')
    ElMessage.success('截图生成成功')
  } catch {
    ElMessage.error('截图生成失败')
  }
}

const downloadScreenshot = () => {
  if (!screenshotUrl.value) return
  const a = document.createElement('a')
  a.href = screenshotUrl.value
  a.download = `chat_${Date.now()}.png`
  a.click()
}
</script>

<style scoped>
.chat-config {
  display: flex;
  gap: 12px;
  align-items: center;
}
.msg-list-editor {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.msg-edit-row {
  display: flex;
  gap: 8px;
  align-items: center;
}
.msg-edit-row :deep(.el-input) {
  flex: 1;
}
.chat-actions {
  display: flex;
  gap: 12px;
}

/* 微信风格预览 */
.chat-preview {
  width: 375px;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #d9d9d9;
  font-family: -apple-system, 'Helvetica Neue', sans-serif;
  font-size: 15px;
  margin: 0 auto;
}
.chat-preview.light {
  background: #ededed;
  color: #000;
}
.chat-preview.dark {
  background: #1e1e1e;
  color: #fff;
}
.chat-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  font-weight: 600;
  font-size: 17px;
}
.light .chat-header-bar {
  background: #ededed;
  border-bottom: 1px solid #d6d6d6;
}
.dark .chat-header-bar {
  background: #2c2c2c;
  border-bottom: 1px solid #3a3a3a;
}
.back-arrow {
  font-size: 22px;
  font-weight: 300;
}
.more-dots {
  font-size: 20px;
}
.chat-body {
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 200px;
}
.chat-bubble-row {
  display: flex;
  gap: 8px;
  align-items: flex-start;
}
.chat-bubble-row.right {
  flex-direction: row-reverse;
}
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
  color: #fff;
}
.avatar-other {
  background: #6b7fdc;
}
.avatar-me {
  background: #47b96e;
}
.bubble {
  max-width: 220px;
  padding: 10px 14px;
  border-radius: 6px;
  line-height: 1.5;
  word-break: break-all;
}
.light .left .bubble {
  background: #fff;
  color: #000;
}
.light .right .bubble {
  background: #95ec69;
  color: #000;
}
.dark .left .bubble {
  background: #3a3a3a;
  color: #fff;
}
.dark .right .bubble {
  background: #57a85c;
  color: #fff;
}
.chat-input-bar {
  display: flex;
  align-items: center;
  padding: 8px 12px;
  gap: 10px;
}
.light .chat-input-bar {
  background: #f6f6f6;
  border-top: 1px solid #d6d6d6;
}
.dark .chat-input-bar {
  background: #2c2c2c;
  border-top: 1px solid #3a3a3a;
}
.fake-input {
  flex: 1;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 14px;
}
.light .fake-input {
  background: #fff;
  color: #bbb;
}
.dark .fake-input {
  background: #3a3a3a;
  color: #666;
}
.plus-btn {
  font-size: 22px;
  font-weight: 300;
}

.screenshot-result {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}
.screenshot-img {
  max-width: 375px;
  border-radius: 12px;
  border: 1px solid #ebeef5;
}
</style>
