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

export interface StreamEvent {
  type?: 'user_msg' | 'content' | 'assistant_msg'
  id?: number
  content?: string
  error?: string
}

const baseUrl = () => import.meta.env.VITE_API_BASE_URL || '/api'

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('website_token') || ''}`,
})

const postJson = async <T>(url: string, data?: Record<string, unknown>): Promise<T> => {
  const res = await fetch(`${baseUrl()}${url}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data || {}),
  })
  const json = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(json?.message || `请求失败: ${res.status}`)
  }
  if (json && json.code === 200) return json.data as T
  return json as T
}

export const createSession = (title?: string) => {
  return postJson<ChatSessionItem>('/ai-chat/sessions/create', { title })
}

export const getSessions = () => {
  return postJson<ChatSessionItem[]>('/ai-chat/sessions/list')
}

export const deleteSession = (sessionId: number) => {
  return postJson<null>('/ai-chat/sessions/delete', { sessionId })
}

export const getSessionMessages = (sessionId: number) => {
  return postJson<ChatMessageItem[]>('/ai-chat/sessions/messages', { sessionId })
}

export const sendSessionChatStream = async function* (
  sessionId: number,
  message: string,
  signal?: AbortSignal,
): AsyncGenerator<StreamEvent> {
  const res = await fetch(`${baseUrl()}/ai-chat/sessions/chat`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ sessionId, message }),
    signal,
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `请求失败: ${res.status}`)
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

      const parsed = JSON.parse(data) as StreamEvent
      if (parsed.error) throw new Error(parsed.error)
      yield parsed
    }
  }
}
