const app = getApp()

Page({
  data: {
    messages: [],
    inputText: '',
    loading: false,
    streamContent: '',
    scrollToId: ''
  },

  onInput(e) {
    this.setData({ inputText: e.detail.value })
  },

  sendMsg() {
    const text = this.data.inputText.trim()
    if (!text || this.data.loading) return

    if (!app.globalData.token) {
      wx.navigateTo({ url: '/pages/login/login' })
      return
    }

    const messages = [...this.data.messages, { role: 'user', content: text }]
    this.setData({
      messages,
      inputText: '',
      loading: true,
      streamContent: ''
    })
    this.scrollToBottom()

    // 小程序不支持 SSE，用普通请求
    app.request({
      url: '/ai-chat',
      method: 'POST',
      data: {
        messages: messages.map(m => ({ role: m.role, content: m.content }))
      }
    }).then(res => {
      const reply = res.reply || res.content || '抱歉，无法获取回复'
      const newMessages = [...messages, { role: 'assistant', content: reply }]
      this.setData({ messages: newMessages })
      this.scrollToBottom()
    }).catch(() => {
      const newMessages = [...messages, { role: 'assistant', content: '请求出错了，请重试' }]
      this.setData({ messages: newMessages })
    }).finally(() => {
      this.setData({ loading: false })
    })
  },

  scrollToBottom() {
    const len = this.data.messages.length
    this.setData({ scrollToId: this.data.loading ? 'msg-loading' : 'msg-' + (len - 1) })
  }
})
