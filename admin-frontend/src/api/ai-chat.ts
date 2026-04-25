import request from '@/utils/request'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | ChatContentPart[]
}

export type ChatContentPart = TextContentPart | ImageContentPart

export interface TextContentPart {
  type: 'text'
  text: string
}

export interface ImageContentPart {
  type: 'image_url'
  image_url: {
    url: string
  }
}

// ─── 会话接口 ───

export interface ChatSessionItem {
  id: number
  title: string
  userId: number
  createdAt: string
  updatedAt: string
}

export interface ChatMessageItem {
  id: number
  sessionId: number
  role: string
  content: string
  createdAt: string
}

export const createSession = (title?: string) => {
  return request<ChatSessionItem>({
    url: '/ai-chat/sessions/create',
    method: 'post',
    data: { title }
  })
}

export const getSessions = () => {
  return request<ChatSessionItem[]>({
    url: '/ai-chat/sessions/list',
    method: 'post'
  })
}

export const deleteSession = (sessionId: number) => {
  return request({
    url: '/ai-chat/sessions/delete',
    method: 'post',
    data: { sessionId }
  })
}

export const updateSessionTitle = (sessionId: number, title: string) => {
  return request<ChatSessionItem>({
    url: '/ai-chat/sessions/update-title',
    method: 'post',
    data: { sessionId, title }
  })
}

export const getSessionMessages = (sessionId: number) => {
  return request<ChatMessageItem[]>({
    url: '/ai-chat/sessions/messages',
    method: 'post',
    data: { sessionId }
  })
}

// ─── 带持久化的流式对话 ───

export interface StreamEvent {
  type?: 'user_msg' | 'content' | 'assistant_msg'
  id?: number
  content?: string
  error?: string
}

export const sendSessionChatStream = async function* (
  sessionId: number,
  message: string,
  signal?: AbortSignal
): AsyncGenerator<StreamEvent> {
  const token = localStorage.getItem('token')
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api'
  const res = await fetch(`${baseUrl}/ai-chat/sessions/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ sessionId, message }),
    signal,
  })

  if (!res.ok) {
    throw new Error(`请求失败: ${res.status}`)
  }

  const reader = res.body?.getReader()
  if (!reader) throw new Error('无法读取流')

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith('data: ')) continue
      const data = trimmed.slice(6)
      if (data === '[DONE]') return

      try {
        const parsed: StreamEvent = JSON.parse(data)
        if (parsed.error) throw new Error(parsed.error)
        yield parsed
      } catch (e: any) {
        if (e.message && !e.message.includes('JSON')) throw e
      }
    }
  }
}

// ─── 旧接口（兼容）───

export const sendChat = (messages: ChatMessage[]) => {
  return request<{ reply: string }>({
    url: '/ai-chat',
    method: 'post',
    data: { messages }
  })
}

export const sendChatStream = async function* (messages: ChatMessage[]) {
  const token = localStorage.getItem('token')
  const baseUrl = import.meta.env.VITE_API_BASE_URL || '/api'
  const res = await fetch(`${baseUrl}/ai-chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ messages }),
  })

  if (!res.ok) {
    throw new Error(`请求失败: ${res.status}`)
  }

  const reader = res.body?.getReader()
  if (!reader) throw new Error('无法读取流')

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith('data: ')) continue
      const data = trimmed.slice(6)
      if (data === '[DONE]') return

      try {
        const parsed = JSON.parse(data)
        if (parsed.error) throw new Error(parsed.error)
        if (parsed.content) yield parsed.content
      } catch (e: any) {
        if (e.message && !e.message.includes('JSON')) throw e
      }
    }
  }
}
