import request from '@/utils/request'

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export const sendChat = (messages: ChatMessage[]) => {
  return request<{ reply: string }>({
    url: '/ai-chat',
    method: 'post',
    data: { messages }
  })
}

// SSE 流式请求
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
